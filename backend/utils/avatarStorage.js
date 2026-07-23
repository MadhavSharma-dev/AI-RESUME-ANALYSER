import { put, del } from "@vercel/blob";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import logger from "./logger.js";

const AVATAR_DIR = path.resolve("uploads", "avatars");
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

/**
 * Saves profile avatar image to Vercel Blob or local storage fallback.
 * Cleans up old avatar file if oldAvatarUrl is provided.
 */
export async function saveAvatar(userId, fileBuffer, originalFilename, mimeType, oldAvatarUrl = null) {
  // Delete old avatar if present
  if (oldAvatarUrl) {
    await deleteAvatar(oldAvatarUrl);
  }

  const ext = path.extname(originalFilename).toLowerCase() || ".jpg";
  const filename = `${crypto.randomUUID()}${ext}`;

  // If Vercel Blob read/write token is present in environment, upload to Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobPath = `avatars/${userId}/${filename}`;
      const blob = await put(blobPath, fileBuffer, {
        access: "public",
        addRandomSuffix: true,
        contentType: mimeType
      });
      logger.info({ userId, url: blob.url }, "Avatar uploaded to Vercel Blob");
      return blob.url;
    } catch (err) {
      logger.error({ err: err.message }, "Vercel Blob avatar upload failed — using local fallback");
    }
  }

  // Local storage fallback
  const localPath = path.join(AVATAR_DIR, filename);
  fs.writeFileSync(localPath, fileBuffer);
  const localUrl = `/uploads/avatars/${filename}`;
  logger.info({ userId, localUrl }, "Avatar saved to local storage");
  return localUrl;
}

/**
 * Deletes avatar file from Vercel Blob or local filesystem.
 */
export async function deleteAvatar(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== "string") return;

  try {
    if (avatarUrl.includes("blob.vercel-storage.com") && process.env.BLOB_READ_WRITE_TOKEN) {
      await del(avatarUrl);
      logger.info({ url: avatarUrl }, "Old avatar deleted from Vercel Blob");
    } else if (avatarUrl.startsWith("/uploads/avatars/")) {
      const filename = path.basename(avatarUrl);
      const localPath = path.join(AVATAR_DIR, filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        logger.info({ localPath }, "Old local avatar file deleted");
      }
    }
  } catch (err) {
    logger.error({ err: err.message, avatarUrl }, "Failed to delete old avatar file");
  }
}
