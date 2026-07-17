import { aiResponseSchema, buildPrompt } from "./aiSchema.js";
import logger from "../utils/logger.js";

/**
 * Mistral AI service module.
 * Calls the Mistral chat completions API for resume analysis.
 * Returns null on failure (logged server-side).
 */
export async function analyze(resumeText, targetRole) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    logger.warn("MISTRAL_API_KEY not configured — skipping Mistral");
    return null;
  }

  const url = "https://api.mistral.ai/v1/chat/completions";
  const prompt = buildPrompt(resumeText, targetRole);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error({ status: response.status, body: errBody }, "Mistral API HTTP error");
      return null;
    }

    const data = await response.json();
    const resultText = data?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(resultText.trim());

    const validated = aiResponseSchema.safeParse(parsed);
    if (!validated.success) {
      logger.warn({ errors: validated.error.errors }, "Mistral response failed schema validation");
      return null;
    }

    return { provider: "mistral", ...validated.data };
  } catch (error) {
    logger.error({ err: error.message }, "Mistral analysis failed");
    return null;
  }
}
