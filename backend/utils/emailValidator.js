import dns from "dns";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates email format and performs server-side MX record DNS lookup.
 * Returns { valid: boolean, error?: string }
 */
export async function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email address is required." };
  }

  const trimmed = email.trim().toLowerCase();

  // 1. Format validation using standard email regex
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address format (e.g. name@domain.com)." };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid email structure." };
  }

  const domain = parts[1];

  // 2. Server-side MX record DNS lookup
  try {
    const mxRecords = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 3500);

      dns.resolveMx(domain, (err, addresses) => {
        clearTimeout(timer);
        if (err || !addresses || addresses.length === 0) {
          resolve(null);
        } else {
          resolve(addresses);
        }
      });
    });

    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        error: `The email domain "${domain}" does not appear to be valid or capable of receiving emails.`
      };
    }

    return { valid: true };
  } catch {
    // Fall back gracefully if DNS fails
    return { valid: true };
  }
}
