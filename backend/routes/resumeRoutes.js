import express from "express";
import multer from "multer";
import path from "path";
import protect from "../middleware/authMiddleware.js";
import {
  uploadResume,
  addResumeVersion,
  getResumes,
  getResumeById,
  deleteResume
} from "../controllers/resumeController.js";

const router = express.Router();

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Sanitize filename to avoid folder escaping
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

// Validate file type
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype === "application/octet-stream";

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Mount routes (all protected by JWT authMiddleware)
router
  .route("/")
  .get(protect, getResumes)
  .post(protect, upload.single("resume"), uploadResume);

router
  .route("/:id")
  .get(protect, getResumeById)
  .delete(protect, deleteResume);

router.post("/:id/version", protect, upload.single("resume"), addResumeVersion);

export default router;
