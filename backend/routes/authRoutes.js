import express from "express";
import { z } from "zod";
import {
  signupUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserProfile
} from "../controllers/authController.js";
import requireAuth from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// ─── Validation Schemas ────────────────────────────────────────────

const signupSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters")
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required")
  })
});

// ─── Routes ────────────────────────────────────────────────────────

// Public — rate-limited
router.post("/signup", authLimiter, validate(signupSchema), signupUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

// Protected
router.get("/profile", requireAuth, getUserProfile);

export default router;
