import rateLimit from "express-rate-limit";

/**
 * Auth-specific rate limiter — tight window to blunt credential stuffing.
 * 5 attempts per 15 minutes per IP on /api/auth/* endpoints.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again after 15 minutes" }
});

/**
 * Upload-specific rate limiter — prevents API-key exhaustion from upload spam.
 * 10 uploads per 15 minutes per IP.
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many uploads, please try again after 15 minutes" }
});

/**
 * General API rate limiter — moderate blanket protection.
 * 100 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" }
});
