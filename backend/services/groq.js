import { aiResponseSchema, buildPrompt } from "./aiSchema.js";
import logger from "../utils/logger.js";

/**
 * Groq (Llama 3) AI service module.
 * Calls the Groq inference API for resume analysis.
 * Returns null on failure (logged server-side).
 */
export async function analyze(resumeText, targetRole) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn("GROQ_API_KEY not configured — skipping Groq");
    return null;
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const prompt = buildPrompt(resumeText, targetRole);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error({ status: response.status, body: errBody }, "Groq API HTTP error");
      return null;
    }

    const data = await response.json();
    const resultText = data?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(resultText.trim());

    const validated = aiResponseSchema.safeParse(parsed);
    if (!validated.success) {
      logger.warn({ errors: validated.error.errors }, "Groq response failed schema validation");
      return null;
    }

    return { provider: "groq", ...validated.data };
  } catch (error) {
    logger.error({ err: error.message }, "Groq analysis failed");
    return null;
  }
}
