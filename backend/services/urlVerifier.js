import logger from "../utils/logger.js";

/**
 * Normalizes a URL string by ensuring it has a protocol.
 */
function normalizeUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return null;
  let trimmed = urlStr.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }
  return trimmed;
}

/**
 * Verifies if a single URL is live with a 3.5s timeout.
 */
export async function verifyUrl(urlStr) {
  const url = normalizeUrl(urlStr);
  if (!url) return { url: "", isValid: false, status: 0 };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    // Attempt HEAD first, fallback to GET if 405 Method Not Allowed
    let res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    clearTimeout(timeoutId);

    if (res.status === 405) {
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), 3500);
      res = await fetch(url, {
        method: "GET",
        signal: getController.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      clearTimeout(getTimeoutId);
    }

    // Treat 2xx, 3xx, and 999 (LinkedIn bot challenge response) as valid live pages
    const isValid = (res.status >= 200 && res.status < 400) || res.status === 999;
    return { url, isValid, status: res.status };
  } catch (error) {
    clearTimeout(timeoutId);
    logger.warn({ url, err: error.message }, "Live URL verification failed or timed out");
    return { url, isValid: false, status: 0, error: error.message };
  }
}

/**
 * Verifies all contact social/profile URLs in parallel.
 */
export async function verifyContactUrls(contact = {}) {
  const fields = ["linkedin", "github", "portfolio", "leetcode"];
  const results = {};

  const promises = fields.map(async (field) => {
    const val = contact[field];
    if (val && typeof val === "string" && val.trim()) {
      results[field] = await verifyUrl(val);
    } else {
      results[field] = { url: "", isValid: false, status: 0 };
    }
  });

  await Promise.allSettled(promises);
  return results;
}
