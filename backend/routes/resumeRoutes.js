import express from "express";
import { z } from "zod";
import requireAuth from "../middleware/authMiddleware.js";
import upload, { verifyMagicBytes } from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import validate from "../middleware/validate.js";
import {
  uploadResume,
  addResumeVersion,
  getResumes,
  getResumeById,
  deleteResume
} from "../controllers/resumeController.js";

const router = express.Router();

// ─── Validation Schemas ────────────────────────────────────────────

const idSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid resume ID format")
  })
});

const uploadSchema = z.object({
  body: z.object({
    targetRole: z.string().max(100).optional().or(z.literal(""))
  })
});

// ─── Routes ────────────────────────────────────────────────────────

// List all resumes for the authenticated user
router.get("/", requireAuth, getResumes);

// Upload new resume (multipart) — rate-limited, magic-byte verified, validated body
router.post(
  "/upload",
  requireAuth,
  uploadLimiter,
  upload.single("resume"),
  verifyMagicBytes,
  validate(uploadSchema),
  uploadResume
);

// Get specific resume by ID — validated ID
router.get("/:id", requireAuth, validate(idSchema), getResumeById);

// Delete resume by ID — validated ID
router.delete("/:id", requireAuth, validate(idSchema), deleteResume);

// Upload new version of existing resume — validated ID and body
router.post(
  "/:id/version",
  requireAuth,
  uploadLimiter,
  validate(idSchema),
  upload.single("resume"),
  verifyMagicBytes,
  validate(uploadSchema),
  addResumeVersion
);

export default router;
