import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { validateMagicBytes } from "../utils/magicBytes.js";
import logger from "../utils/logger.js";

// Ensure uploads directory exists (outside web root — NOT served statically)
const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types — strict whitelist
const ALLOWED_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

// Multer storage — UUID-based filenames to prevent path traversal and overwrite
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uuid = crypto.randomUUID();
    cb(null, `${uuid}${ext}`);
  }
});

// MIME-type filter (first check — client-supplied, can be spoofed)
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error("Only PDF and DOCX files are allowed"), false);
};

// Multer instance
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter
});

/**
 * Post-upload magic-byte verification middleware.
 * Runs AFTER multer has saved the file, verifies the actual file signature
 * matches what the client claimed. Deletes the file and rejects if spoofed.
 */
export const verifyMagicBytes = (req, res, next) => {
  if (!req.file) return next();

  const ext = path.extname(req.file.originalname).toLowerCase();
  let expectedType = null;

  if (ext === ".pdf" || req.file.mimetype === "application/pdf") {
    expectedType = "pdf";
  } else if (
    ext === ".docx" ||
    req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    expectedType = "docx";
  }

  if (!expectedType) {
    cleanupFile(req.file.path);
    return res.status(400).json({ message: "Unsupported file type" });
  }

  if (!validateMagicBytes(req.file.path, expectedType)) {
    logger.warn({ filename: req.file.filename, expectedType }, "Magic byte mismatch — file rejected");
    cleanupFile(req.file.path);
    return res.status(400).json({ message: "File content does not match its extension. Upload rejected." });
  }

  return next();
};

/**
 * Delete a temp file safely.
 */
export function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    logger.error({ err: err.message, filePath }, "Failed to clean up temp file");
  }
}

export default upload;
