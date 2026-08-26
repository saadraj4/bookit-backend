const jwt = require("jsonwebtoken");
const { error } = require("../lib/response");

/**
 * Middleware that verifies the Bearer access token from the Authorization header.
 * Attaches the decoded payload to req.user.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error(res, "Unauthorized: no token provided", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload; // { userId, email, roleId, ... }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return error(res, "Unauthorized: access token expired", 401);
    }
    return error(res, "Unauthorized: invalid token", 401);
  }
};

module.exports = { requireAuth };
