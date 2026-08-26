const authService = require("../services/auth.service");
const { success, error } = require("../lib/response");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.headers["x-forwarded-for"];

    const result = await authService.login({ email, password, userAgent, ipAddress });
    return success(res, result, "Login successful");
  } catch (err) {
    return error(res, err.message, 401);
  }
};

const me = async (req, res) => {
  try {
    // req.user is set by requireAuth middleware
    const user = await authService.me(req.user.userId);
    return success(res, user, "Profile fetched successfully");
  } catch (err) {
    return error(res, err.message, 404);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.headers["x-forwarded-for"];

    const result = await authService.refreshToken(refreshToken, userAgent, ipAddress);
    return success(res, result, "Tokens refreshed successfully");
  } catch (err) {
    return error(res, err.message, 401);
  }
};

const revokeToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    // We can also extract the accessToken from the Authorization header to revoke the current session if refreshToken is not passed
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    const revoked = await authService.revokeToken({ accessToken, refreshToken });
    if (!revoked) {
      return error(res, "No active session found matching the tokens provided", 400);
    }
    return success(res, null, "Session revoked successfully");
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  login,
  me,
  refreshToken,
  revokeToken,
};
