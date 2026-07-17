import * as gemini from "./gemini.js";
import * as groq from "./groq.js";
import * as mistral from "./mistral.js";
import logger from "../utils/logger.js";

// ─── Per-User Analysis Lock ───────────────────────────────────────
// Prevents a single user from spamming multiple simultaneous analyses
// against rate-limited free-tier API keys.
const activeAnalyses = new Map(); // userId → true

export function isAnalysisLocked(userId) {
  return activeAnalyses.has(userId);
}

function lockAnalysis(userId) {
  activeAnalyses.set(userId, true);
}

function unlockAnalysis(userId) {
  activeAnalyses.delete(userId);
}

// ─── Median helper ────────────────────────────────────────────────
function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

// ─── Run Consensus ────────────────────────────────────────────────

/**
 * Run all three AI providers in parallel via Promise.allSettled.
 * One provider failing does NOT fail the whole analysis.
 * If all three fail, throws an explicit error.
 *
 * @param {string} resumeText - Sanitized resume text
 * @param {string} targetRole - Target job role
 * @param {string} userId - For per-user locking
 * @returns {object} Merged consensus result
 */
export async function runConsensus(resumeText, targetRole, userId) {
  if (isAnalysisLocked(userId)) {
    throw new Error("An analysis is already in progress. Please wait for it to complete.");
  }

  lockAnalysis(userId);

  try {
    logger.info({ userId, targetRole }, "Starting multi-model consensus analysis");

    const results = await Promise.allSettled([
      gemini.analyze(resumeText, targetRole),
      groq.analyze(resumeText, targetRole),
      mistral.analyze(resumeText, targetRole)
    ]);

    // Filter to successful, non-null results
    const successful = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);

    // Log failures
    results.forEach((r, idx) => {
      const providers = ["Gemini", "Groq", "Mistral"];
      if (r.status === "rejected") {
        logger.error({ provider: providers[idx], err: r.reason?.message }, "Provider rejected");
      } else if (r.value === null) {
        logger.warn({ provider: providers[idx] }, "Provider returned null (failed/skipped)");
      }
    });

    if (successful.length === 0) {
      throw new Error("All AI providers failed. Please check your API keys and try again.");
    }

    logger.info({ successCount: successful.length }, "Consensus analysis: providers succeeded");

    // ─── Compute Consensus ─────────────────────────────────
    const overallScore = median(successful.map((s) => s.overall_score));
    const atsScore = median(successful.map((s) => s.ats_compatibility));

    const breakdown = {
      keywords: median(successful.map((s) => s.breakdown.keywords)),
      format: median(successful.map((s) => s.breakdown.format)),
      impact: median(successful.map((s) => s.breakdown.impact)),
      readability: median(successful.map((s) => s.breakdown.readability))
    };

    // Per-model scores for display
    const modelScores = {
      gemini: successful.find((s) => s.provider === "gemini")?.overall_score || 0,
      groq: successful.find((s) => s.provider === "groq")?.overall_score || 0,
      mistral: successful.find((s) => s.provider === "mistral")?.overall_score || 0
    };

    // Merge text feedback with provenance
    const strengths = Array.from(new Set(
      successful.flatMap((s) => s.strengths.slice(0, 2))
    )).slice(0, 6);

    const improvements = Array.from(new Set(
      successful.flatMap((s) => s.improvements.slice(0, 2))
    )).slice(0, 6);

    const keywordGaps = Array.from(new Set(
      successful.flatMap((s) => s.keyword_gaps)
    )).slice(0, 8);

    const beforeAfterRewrites = successful
      .flatMap((s) => s.before_after_rewrites.slice(0, 1))
      .slice(0, 3);

    const toneAssessment = successful
      .map((s) => s.tone_assessment)
      .filter(Boolean)
      .join(" ");

    return {
      overall_score: overallScore,
      ats_compatibility: atsScore,
      modelScores,
      breakdown,
      strengths,
      improvements,
      keyword_gaps: keywordGaps,
      tone_assessment: toneAssessment,
      before_after_rewrites: beforeAfterRewrites,
      providersUsed: successful.length
    };
  } finally {
    unlockAnalysis(userId);
  }
}
