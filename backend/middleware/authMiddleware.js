import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

/**
 * requireAuth middleware — verifies the short-lived JWT access token.
 * Attaches req.userId from the verified token payload.
 * Never trusts a userId passed in the request body.
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    return next();
  } catch (error) {
    logger.warn({ err: error.message }, "Access token verification failed");

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    }

    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export default requireAuth;
