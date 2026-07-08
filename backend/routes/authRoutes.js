import express from "express";
import { signupUser, loginUser, getUserProfile } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/signup", signupUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", protect, getUserProfile);

export default router;
