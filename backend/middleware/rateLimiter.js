import rateLimit from "express-rate-limit";

const isProd = process.env.NODE_ENV === "production";

/**
 * Auth-specific rate limiter — tight window in prod, generous in dev.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: isProd ? 15 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again after 15 minutes" }
});

/**
 * Upload-specific rate limiter — prevents API-key exhaustion from upload spam.
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many uploads, please try again after 15 minutes" }
});

/**
 * General API rate limiter — moderate blanket protection.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" }
});
