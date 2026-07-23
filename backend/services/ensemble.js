import { analyze as geminiAnalyze } from "./gemini.js";
import { analyze as groqAnalyze } from "./groq.js";
import { analyze as mistralAnalyze } from "./mistral.js";
import logger from "../utils/logger.js";

/**
 * Calculates the average of an array of numbers, rounded to nearest int.
 */
function average(nums) {
  if (!nums || nums.length === 0) return 0;
  const sum = nums.reduce((a, b) => a + b, 0);
  return Math.round(sum / nums.length);
}

/**
 * Very basic deduplication based on exact title match or high substring overlap.
 * Prefers the item that has a "Fix:" suggestion or is longer.
 */
function deduplicateIssues(issuesList) {
  const unique = [];
  for (const issue of issuesList) {
    if (!issue || !issue.title) continue;
    const existingIdx = unique.findIndex(
      (u) => 
        u.title.toLowerCase() === issue.title.toLowerCase() ||
        (u.description && issue.description && u.description.includes(issue.description)) ||
        (u.description && issue.description && issue.description.includes(u.description))
    );

    if (existingIdx >= 0) {
      const existing = unique[existingIdx];
      // Prefer the one with a fix, or the longer description
      const existingHasFix = !!existing.fix && existing.fix.trim().length > 5;
      const newHasFix = !!issue.fix && issue.fix.trim().length > 5;
      
      if (newHasFix && !existingHasFix) {
        unique[existingIdx] = issue;
      } else if (newHasFix === existingHasFix) {
        if ((issue.description?.length || 0) > (existing.description?.length || 0)) {
          unique[existingIdx] = issue;
        }
      }
    } else {
      unique.push(issue);
    }
  }
  return unique;
}

function deduplicateStrings(strList) {
  const unique = [];
  for (const str of strList) {
    if (!str) continue;
    const isDuplicate = unique.some(
      (u) => u.toLowerCase() === str.toLowerCase() || u.includes(str) || str.includes(u)
    );
    if (!isDuplicate) {
      unique.push(str);
    }
  }
  return unique;
}

function deduplicateRewrites(rewritesList) {
  const unique = [];
  for (const rw of rewritesList) {
    if (!rw || !rw.before || !rw.after) continue;
    const isDuplicate = unique.some(
      (u) => u.before.toLowerCase() === rw.before.toLowerCase()
    );
    if (!isDuplicate) {
      unique.push(rw);
    }
  }
  return unique;
}

/**
 * Runs all 3 LLMs in parallel and reconciles their outputs.
 * Takes the ParsedSections JSON string and the target role.
 */
export async function runEnsemble(parsedSectionsJsonString, targetRole) {
  const [geminiResult, groqResult, mistralResult] = await Promise.allSettled([
    geminiAnalyze(parsedSectionsJsonString, targetRole),
    groqAnalyze(parsedSectionsJsonString, targetRole),
    mistralAnalyze(parsedSectionsJsonString, targetRole)
  ]);

  const rawOutputs = {
    gemini: geminiResult.status === "fulfilled" ? geminiResult.value : null,
    groq: groqResult.status === "fulfilled" ? groqResult.value : null,
    mistral: mistralResult.status === "fulfilled" ? mistralResult.value : null
  };

  const successfulModels = Object.values(rawOutputs).filter(Boolean);

  if (successfulModels.length === 0) {
    throw new Error("All AI models failed to analyze the resume.");
  }

  const modelsUsed = successfulModels.map(m => m.provider);
  logger.info(`Ensemble succeeded with models: ${modelsUsed.join(", ")}`);

  // Aggregate Numeric Fields
  const overall_score = average(successfulModels.map(m => m.overall_score));
  const ats_compatibility = average(successfulModels.map(m => m.ats_compatibility));
  
  const keywordsScore = average(successfulModels.map(m => m.breakdown?.keywords));
  const formatScore = average(successfulModels.map(m => m.breakdown?.format));
  const impactScore = average(successfulModels.map(m => m.breakdown?.impact));
  const readabilityScore = average(successfulModels.map(m => m.breakdown?.readability));

  const contentScore = average(successfulModels.map(m => m.extendedBreakdown?.content || 50));
  const sectionsScore = average(successfulModels.map(m => m.extendedBreakdown?.sections || 50));
  const atsEssentialsScore = average(successfulModels.map(m => m.extendedBreakdown?.atsEssentials || 50));
  const hrRedFlagsScore = average(successfulModels.map(m => m.extendedBreakdown?.hrRedFlags || 50));
  const discriminationScore = average(successfulModels.map(m => m.extendedBreakdown?.discrimination || 50));
  const seniorityScore = average(successfulModels.map(m => m.extendedBreakdown?.seniority || 50));
  const tailoringScore = average(successfulModels.map(m => m.extendedBreakdown?.tailoring || 50));

  // Aggregate Lists
  const allIssues = successfulModels.flatMap(m => m.issues || []);
  const reconciledIssues = deduplicateIssues(allIssues).slice(0, 10); // cap at 10

  const allStrengths = successfulModels.flatMap(m => m.strengths || []);
  const reconciledStrengths = deduplicateStrings(allStrengths).slice(0, 10);

  const allMatchedKw = successfulModels.flatMap(m => m.keywords?.matched || []);
  const allMissingKw = successfulModels.flatMap(m => m.keywords?.missing || []);
  const reconciledKeywords = {
    matched: deduplicateStrings(allMatchedKw),
    missing: deduplicateStrings(allMissingKw)
  };

  const allRewrites = successfulModels.flatMap(m => m.before_after_rewrites || []);
  const reconciledRewrites = deduplicateRewrites(allRewrites).slice(0, 8);

  // Verdict Synthesis: Just pick the verdict from the model whose atsScore was closest to the average
  let bestVerdict = "";
  let smallestDiff = Infinity;
  for (const m of successfulModels) {
    const diff = Math.abs(m.ats_compatibility - ats_compatibility);
    if (diff < smallestDiff && m.verdict) {
      smallestDiff = diff;
      bestVerdict = m.verdict;
    }
  }

  return {
    modelsUsed,
    rawOutputs,
    reconciled: {
      overallScore: overall_score,
      atsScore: ats_compatibility,
      breakdown: {
        keywords: keywordsScore,
        format: formatScore,
        impact: impactScore,
        readability: readabilityScore
      },
      extendedBreakdown: {
        content: contentScore,
        sections: sectionsScore,
        atsEssentials: atsEssentialsScore,
        hrRedFlags: hrRedFlagsScore,
        discrimination: discriminationScore,
        seniority: seniorityScore,
        tailoring: tailoringScore
      },
      issues: reconciledIssues,
      strengths: reconciledStrengths,
      keywords: reconciledKeywords,
      rewrites: reconciledRewrites,
      verdict: bestVerdict
    }
  };
}
