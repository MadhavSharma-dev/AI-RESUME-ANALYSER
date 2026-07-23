import express from "express";
import { z } from "zod";
import {
  signupUser,
  loginUser,
  googleLogin,
  appleLogin,
  refreshAccessToken,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  getUserStats
} from "../controllers/authController.js";
import requireAuth from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { avatarUpload } from "../middleware/imageUpload.js";

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
router.post("/google", authLimiter, googleLogin);
router.post("/apple", authLimiter, appleLogin);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

// Protected
router.get("/profile", requireAuth, getUserProfile);
router.put("/profile", requireAuth, updateUserProfile);
router.post("/avatar", requireAuth, avatarUpload.single("avatar"), uploadAvatar);
router.get("/stats", requireAuth, getUserStats);

export default router;
