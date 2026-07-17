import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import logger from "./utils/logger.js";

// ─── Load Environment ──────────────────────────────────────────────
dotenv.config();

// Startup safety checks — refuse to start if critical env vars are missing
if (!process.env.JWT_SECRET) {
  logger.fatal("JWT_SECRET is not set. Refusing to start.");
  process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET) {
  logger.fatal("JWT_REFRESH_SECRET is not set. Refusing to start.");
  process.exit(1);
}

// ─── Connect to MongoDB ────────────────────────────────────────────
connectDB();

const app = express();

// ─── Security Middleware ────────────────────────────────────────────
app.use(helmet()); // Secure HTTP headers (HSTS, X-Content-Type-Options, etc.)

// CORS locked to known frontend origin — NOT *
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true // Required for httpOnly cookie exchange
  })
);

// General rate limiting on ALL /api/* routes
app.use("/api", generalLimiter);

// ─── Body Parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ─── Route Mountings ────────────────────────────────────────────────
// NOTE: Uploads are NOT served statically. Files are stored outside the
// web root and can only be accessed through authenticated API endpoints.
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/analytics", analyticsRoutes);

// Base health check
app.get("/", (_req, res) => {
  res.json({ status: "healthy", service: "Resume Roaster API" });
});

// ─── Global Error Handler ───────────────────────────────────────────
// Must be registered LAST — catches all unhandled errors.
// Returns generic messages to client; logs full detail server-side.
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`[Server] running on port ${PORT}`);
});
