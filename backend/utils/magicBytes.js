import fs from "fs";

/**
 * Validate file magic bytes to ensure the file's actual type matches what the
 * client claims. Prevents uploading an .exe renamed to .pdf, etc.
 *
 * PDF magic bytes:  %PDF  → 0x25 0x50 0x44 0x46
 * DOCX magic bytes: PK    → 0x50 0x4B 0x03 0x04  (ZIP container)
 */

const SIGNATURES = {
  pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]),       // %PDF
  docx: Buffer.from([0x50, 0x4b, 0x03, 0x04])        // PK\x03\x04 (ZIP)
};

/**
 * @param {string} filePath - Absolute path to the uploaded file
 * @param {string} expectedType - "pdf" or "docx"
 * @returns {boolean} true if magic bytes match the expected type
 */
export function validateMagicBytes(filePath, expectedType) {
  const sig = SIGNATURES[expectedType];
  if (!sig) return false;

  const fd = fs.openSync(filePath, "r");
  const buf = Buffer.alloc(sig.length);
  fs.readSync(fd, buf, 0, sig.length, 0);
  fs.closeSync(fd);

  return buf.equals(sig);
}
