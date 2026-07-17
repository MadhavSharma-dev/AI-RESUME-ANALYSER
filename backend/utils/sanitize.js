/**
 * Sanitize resume text before it is interpolated into AI prompts or stored in DB.
 * - Strips null bytes and most ASCII control characters (keeps newlines, tabs)
 * - Truncates to a safe maximum length to prevent prompt abuse / token overflow
 */

const MAX_RESUME_TEXT_LENGTH = 30_000; // ~8 000 tokens, safe for free-tier context windows

export function sanitizeResumeText(raw) {
  if (typeof raw !== "string") return "";

  let text = raw
    // Strip null bytes
    .replace(/\0/g, "")
    // Strip ASCII control characters except \n (0x0A), \r (0x0D), \t (0x09)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Collapse excessive whitespace
    .replace(/[ \t]{4,}/g, "  ")
    // Collapse excessive newlines
    .replace(/\n{4,}/g, "\n\n\n");

  // Truncate to safe length
  if (text.length > MAX_RESUME_TEXT_LENGTH) {
    text = text.slice(0, MAX_RESUME_TEXT_LENGTH) + "\n[... truncated for safety ...]";
  }

  return text.trim();
}
