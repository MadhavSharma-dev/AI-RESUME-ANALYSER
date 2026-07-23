import { aiResponseSchema, parsedSectionsSchema, buildAnalysisPrompt, buildParsingPrompt } from "./aiSchema.js";
import logger from "../utils/logger.js";

/**
 * Groq (Llama 3) AI service module.
 * Calls the Groq inference API for resume analysis.
 * Returns null on failure (logged server-side).
 */
export async function analyze(parsedSectionsJsonString, targetRole) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn("GROQ_API_KEY not configured — skipping Groq");
    return null;
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const prompt = buildAnalysisPrompt(parsedSectionsJsonString, targetRole);

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
        temperature: 0.0,
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

/**
 * Fallback parser using Groq (Llama 3)
 */
export async function parseResumeWithGroq(resumeText) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const prompt = buildParsingPrompt(resumeText);

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
    logger.error({ status: response.status, body: errBody }, "Groq API HTTP error during parsing");
    throw new Error("Groq parsing failed");
  }

  const data = await response.json();
  const resultText = data?.choices?.[0]?.message?.content || "";
  const parsed = JSON.parse(resultText.trim());
  const validated = parsedSectionsSchema.safeParse(parsed);

  if (!validated.success) {
    logger.warn({ errors: validated.error.errors }, "Groq parse response failed schema validation");
    return parsed;
  }

  return validated.data;
}

/**
 * Generates a fresh, witty, distinct Roaster Verdict paragraph.
 * Keeps temperature 0.85 for creative variation while preserving score breakdown.
 */
export async function generateFreshRoastVerdict(parsedSectionsJsonString, targetRole, atsScore) {
  const apiKey = process.env.GROQ_API_KEY;
  const systemMsg = "You are a brutally honest, hilarious, witty tech recruiter and resume roaster.";
  const userPrompt = `Target Role: ${targetRole}
ATS Score: ${atsScore}/100
Candidate Data: ${parsedSectionsJsonString}

Write a brand new, unique, 3-4 sentence hilarious roast verdict for this candidate's resume targeting ${targetRole}.
Be witty, funny, sharp, and brutally honest with constructive humor.
Return ONLY the raw text of the roast verdict paragraph directly. Do NOT wrap in JSON or quotes.`;

  if (apiKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.85
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (err) {
      logger.warn({ err: err.message }, "Groq fresh roast verdict failed");
    }
  }

  // Fallback to Gemini if Groq fails
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.85 }
        })
      });
      if (res.ok) {
        const gData = await res.json();
        const gText = gData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (gText) return gText;
      }
    } catch (err) {
      logger.warn({ err: err.message }, "Gemini fresh roast verdict failed");
    }
  }

  return "Listen up! Your resume has potential, but it needs serious polishing for this role. Quantify your bullet points, streamline your formatting, and get back in the arena!";
}
