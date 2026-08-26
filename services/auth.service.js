const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-default";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-default";
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * Parses duration string like '7d' or '15m' to milliseconds.
 */
const parseExpiresIn = (expiresIn) => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const val = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s": return val * 1000;
    case "m": return val * 60 * 1000;
    case "h": return val * 60 * 60 * 1000;
    case "d": return val * 24 * 60 * 60 * 1000;
    default: return val * 24 * 60 * 60 * 1000;
  }
};

/**
 * Validate credentials, create session, and return tokens.
 */
const login = async ({ email, password, userAgent, ipAddress }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("User account is inactive");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Generate tokens
  const payload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
  };

  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  const refreshExpiresMs = parseExpiresIn(JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + refreshExpiresMs);

  // Store session
  await prisma.authSession.create({
    data: {
      userId: user.id,
      provider: "EMAIL_PASSWORD",
      accessToken,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  // Exclude password hash from response user object
  const { passwordHash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

/**
 * Retrieve the current authenticated user's profile.
 */
const me = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Refresh tokens using rotation strategy.
 */
const refreshToken = async (token, userAgent, ipAddress) => {
  if (!token) {
    throw new Error("Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }

  const session = await prisma.authSession.findUnique({
    where: { refreshToken: token },
    include: { user: { include: { role: true } } },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.isRevoked) {
    throw new Error("Session has been revoked");
  }

  if (new Date() > session.expiresAt) {
    throw new Error("Session has expired");
  }

  // Generate new tokens
  const payload = {
    userId: session.user.id,
    email: session.user.email,
    roleId: session.user.roleId,
    roleName: session.user.role.name,
  };

  const newAccessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });

  const newRefreshToken = jwt.sign({ userId: session.user.id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  const refreshExpiresMs = parseExpiresIn(JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + refreshExpiresMs);

  // Update session with rotated tokens
  await prisma.authSession.update({
    where: { id: session.id },
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      userAgent: userAgent || session.userAgent,
      ipAddress: ipAddress || session.ipAddress,
      expiresAt,
      lastAccessedAt: new Date(),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Revoke session by access token or refresh token.
 */
const revokeToken = async ({ accessToken, refreshToken }) => {
  if (refreshToken) {
    const session = await prisma.authSession.findUnique({
      where: { refreshToken },
    });
    if (session) {
      await prisma.authSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      return true;
    }
  }

  if (accessToken) {
    const session = await prisma.authSession.findUnique({
      where: { accessToken },
    });
    if (session) {
      await prisma.authSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      return true;
    }
  }

  return false;
};

module.exports = {
  login,
  me,
  refreshToken,
  revokeToken,
};
