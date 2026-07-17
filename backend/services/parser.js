import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { sanitizeResumeText } from "../utils/sanitize.js";
import logger from "../utils/logger.js";

/**
 * Parse uploaded file and extract raw text.
 * Supports PDF, DOCX, and plain text.
 * Wraps all parsing in try/catch — malicious/corrupt files fail gracefully.
 *
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {string} Sanitized extracted text
 */
export async function parseFile(filePath, mimeType) {
  let rawText = "";

  try {
    if (mimeType === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text;
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      rawText = result.value;
    } else {
      // Fallback: plain text
      rawText = fs.readFileSync(filePath, "utf8");
    }
  } catch (err) {
    logger.error({ err: err.message, filePath, mimeType }, "File parsing failed");
    throw new Error("Failed to parse the uploaded file. Please ensure it is a valid PDF or DOCX.");
  }

  if (!rawText || rawText.trim().length < 50) {
    throw new Error("Could not extract meaningful text from the uploaded file. Please try a different file.");
  }

  return sanitizeResumeText(rawText);
}
