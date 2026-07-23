import multer from "multer";

const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error("Only JPG, PNG, and WebP images are allowed."), false);
};

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter
});
