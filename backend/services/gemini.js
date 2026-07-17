import { aiResponseSchema, buildPrompt } from "./aiSchema.js";
import logger from "../utils/logger.js";

/**
 * Google Gemini AI service module.
 * Calls the Gemini 1.5 Flash model for resume analysis.
 * Returns null on failure (logged server-side).
 */
export async function analyze(resumeText, targetRole) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("GEMINI_API_KEY not configured — skipping Gemini");
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const prompt = buildPrompt(resumeText, targetRole);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error({ status: response.status, body: errBody }, "Gemini API HTTP error");
      return null;
    }

    const data = await response.json();
    let resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip markdown code fences if present
    if (resultText.includes("```json")) {
      resultText = resultText.split("```json")[1].split("```")[0];
    } else if (resultText.includes("```")) {
      resultText = resultText.split("```")[1].split("```")[0];
    }

    const parsed = JSON.parse(resultText.trim());

    // Validate against Zod schema
    const validated = aiResponseSchema.safeParse(parsed);
    if (!validated.success) {
      logger.warn({ errors: validated.error.errors }, "Gemini response failed schema validation");
      return null;
    }

    return { provider: "gemini", ...validated.data };
  } catch (error) {
    logger.error({ err: error.message }, "Gemini analysis failed");
    return null;
  }
}
