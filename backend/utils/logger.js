import pino from "pino";

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
      : undefined,
  // Redact sensitive fields so they never appear in logs
  redact: {
    paths: [
      "password",
      "passwordHash",
      "refreshToken",
      "refreshTokenHash",
      "req.headers.authorization",
      "req.headers.cookie",
      "resumeText"
    ],
    censor: "[REDACTED]"
  }
});

export default logger;
