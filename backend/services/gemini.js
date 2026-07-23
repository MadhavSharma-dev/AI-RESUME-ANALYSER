import { aiResponseSchema, parsedSectionsSchema, buildAnalysisPrompt, buildParsingPrompt } from "./aiSchema.js";
import { parseResumeWithGroq } from "./groq.js";
import logger from "../utils/logger.js";

/**
 * Google Gemini AI service module.
 * Calls the Gemini 1.5 Flash model for resume analysis.
 * Returns null on failure (logged server-side).
 */
export async function analyze(parsedSectionsJsonString, targetRole) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("GEMINI_API_KEY not configured — skipping Gemini");
    return null;
  }

  const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const prompt = buildAnalysisPrompt(parsedSectionsJsonString, targetRole);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.0 }
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

/**
 * Parses raw text into structured ParsedSections JSON.
 * Robust multi-provider fallback: Gemini -> Groq -> Default JSON.
 */
export async function parseResume(resumeText) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const prompt = buildParsingPrompt(resumeText);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        let resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (resultText.includes("```json")) {
          resultText = resultText.split("```json")[1].split("```")[0];
        } else if (resultText.includes("```")) {
          resultText = resultText.split("```")[1].split("```")[0];
        }

        const parsed = JSON.parse(resultText.trim());
        const validated = parsedSectionsSchema.safeParse(parsed);
        
        if (validated.success) {
          return validated.data;
        }
        return parsed; // Best effort
      }
      logger.warn({ status: response.status }, "Gemini API HTTP error during parsing — attempting Groq fallback");
    }
  } catch (err) {
    logger.warn({ err: err.message }, "Gemini parsing failed — attempting Groq fallback");
  }

  // Fallback 1: Groq parsing
  try {
    const groqParsed = await parseResumeWithGroq(resumeText);
    if (groqParsed) {
      logger.info("Resume successfully parsed using Groq fallback!");
      return groqParsed;
    }
  } catch (groqErr) {
    logger.error({ err: groqErr.message }, "Groq parsing fallback failed");
  }

  // Fallback 2: Basic structured object
  return {
    name: "Extracted Candidate",
    title: "Resume Profile",
    contact: {},
    summary: resumeText.substring(0, 300),
    experience: [{ role: "Professional Experience", company: "Work History", dates: "", description: resumeText.substring(0, 1000) }],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: []
  };
}
