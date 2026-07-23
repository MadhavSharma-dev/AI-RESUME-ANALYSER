import Resume from "../models/Resume.js";
import Analysis from "../models/Analysis.js";

// ─── Complete Dashboard Overview (Chronological Analyses & High Scores) ───
// GET /api/analytics/overview
export const getDashboardOverview = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ updatedAt: -1 });
    const resumeMap = {};
    resumes.forEach((r) => {
      resumeMap[r._id.toString()] = r.name.replace(/\.[^.]+$/, "");
    });

    const resumeIds = resumes.map((r) => r._id);
    const analyses = await Analysis.find({ resumeId: { $in: resumeIds } }).sort({ createdAt: 1 });

    // Chronological analysis points across all resumes
    const trends = analyses.map((a, idx) => ({
      _id: a._id,
      resumeId: a.resumeId,
      resumeName: resumeMap[a.resumeId.toString()] || "Resume",
      versionNumber: a.versionNumber,
      overallScore: a.overallScore,
      atsScore: a.atsScore,
      date: a.createdAt,
      targetRole: a.targetRole,
      index: idx + 1
    }));

    // Find BEST (highest) ATS score across ALL resumes and versions
    const bestAtsScore = analyses.length > 0
      ? Math.max(...analyses.map((a) => a.atsScore || 0))
      : 0;

    // Collect all issues across all recent analyses
    const allIssues = analyses.flatMap((a) => (a.issues || []).map(i => ({
      ...i,
      resumeId: a.resumeId,
      resumeName: resumeMap[a.resumeId.toString()] || "Resume",
      versionNumber: a.versionNumber,
      targetRole: a.targetRole,
      date: a.createdAt
    }))).slice(-15);

    // Collect all keywords
    const matchedKeywords = Array.from(new Set(analyses.flatMap((a) => a.keywords?.matched || [])));
    const missingKeywords = Array.from(new Set(analyses.flatMap((a) => a.keywords?.missing || [])));

    // Collect all versions list across resumes
    const versionsList = resumes.flatMap((r) => r.versions.map((v) => ({
      resumeId: r._id,
      resumeName: r.name.replace(/\.[^.]+$/, ""),
      versionNumber: v.versionNumber,
      targetRole: v.targetRole,
      createdAt: v.createdAt,
      mimeType: v.mimeType
    })));

    return res.json({
      resumesCount: resumes.length,
      versionsCount: versionsList.length,
      analysesCount: analyses.length,
      bestAtsScore,
      trends,
      allIssues,
      keywords: {
        matched: matchedKeywords,
        missing: missingKeywords
      },
      versionsList,
      resumes
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch dashboard overview analytics" });
  }
};

// ─── Score Trends (Chronological) ──────────────────────────────────
// GET /api/analytics/trends
export const getScoreTrends = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId });
    const resumeMap = {};
    resumes.forEach((r) => { resumeMap[r._id.toString()] = r.name.replace(/\.[^.]+$/, ""); });

    const resumeIds = resumes.map((r) => r._id);
    const analyses = await Analysis.find({ resumeId: { $in: resumeIds } }).sort({ createdAt: 1 });

    const trends = analyses.map((a, idx) => ({
      _id: a._id,
      resumeId: a.resumeId,
      resumeName: resumeMap[a.resumeId.toString()] || "Resume",
      versionNumber: a.versionNumber,
      overallScore: a.overallScore,
      atsScore: a.atsScore,
      date: a.createdAt,
      targetRole: a.targetRole,
      index: idx + 1
    }));

    return res.json(trends);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch score trends" });
  }
};

// ─── Most-Missed Keywords (Aggregated) ─────────────────────────────
// GET /api/analytics/keywords
export const getMissedKeywords = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId });
    const resumeIds = resumes.map((r) => r._id);
    const analyses = await Analysis.find({ resumeId: { $in: resumeIds } });

    const keywordMap = {};
    for (const a of analyses) {
      for (const kw of a.keywords?.missing || []) {
        const normalized = kw.trim().toLowerCase();
        if (normalized) {
          keywordMap[normalized] = (keywordMap[normalized] || 0) + 1;
        }
      }
    }

    const keywords = Object.entries(keywordMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return res.json(keywords);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch keyword analytics" });
  }
};

// ─── Recurring Issues ──────────────────────────────────────────────
// GET /api/analytics/recurring-issues
export const getRecurringIssues = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId });
    const resumeIds = resumes.map((r) => r._id);
    const analyses = await Analysis.find({ resumeId: { $in: resumeIds } });

    const issueMap = {};
    for (const a of analyses) {
      for (const issue of a.issues || []) {
        const title = issue.title?.trim() || "";
        if (title) {
          if (!issueMap[title]) {
            issueMap[title] = { count: 0, description: issue.description, fix: issue.fix, severity: issue.severity };
          }
          issueMap[title].count += 1;
        }
      }
    }

    const issues = Object.entries(issueMap)
      .map(([title, data]) => ({
        title,
        count: data.count,
        description: data.description,
        fix: data.fix,
        severity: data.severity || (data.count >= 3 ? "high" : "medium")
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return res.json(issues);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch recurring issues" });
  }
};
