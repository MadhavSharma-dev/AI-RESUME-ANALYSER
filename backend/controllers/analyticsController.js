import Resume from "../models/Resume.js";

// ─── Score Trends (Chronological) ──────────────────────────────────
// GET /api/analytics/trends
export const getScoreTrends = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ createdAt: 1 });

    const trends = [];
    for (const resume of resumes) {
      for (const version of resume.versions) {
        trends.push({
          resumeName: resume.name.replace(/\.[^.]+$/, ""),
          versionNumber: version.versionNumber,
          overallScore: version.overallScore,
          atsScore: version.atsScore,
          date: version.createdAt,
          targetRole: version.targetRole
        });
      }
    }

    // Sort by date
    trends.sort((a, b) => new Date(a.date) - new Date(b.date));

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

    const keywordMap = {};
    for (const resume of resumes) {
      for (const version of resume.versions) {
        for (const kw of version.keywordGaps || []) {
          const normalized = kw.trim().toLowerCase();
          if (normalized) {
            keywordMap[normalized] = (keywordMap[normalized] || 0) + 1;
          }
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

// ─── Recurring Issues (Most Common Improvements) ───────────────────
// GET /api/analytics/recurring-issues
export const getRecurringIssues = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId });

    const issueMap = {};
    for (const resume of resumes) {
      for (const version of resume.versions) {
        for (const improvement of version.improvements || []) {
          const normalized = improvement.trim().toLowerCase();
          if (normalized) {
            issueMap[normalized] = (issueMap[normalized] || 0) + 1;
          }
        }
      }
    }

    const issues = Object.entries(issueMap)
      .map(([title, count]) => ({
        title,
        count,
        severity: count >= 3 ? "high" : count >= 2 ? "medium" : "low"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return res.json(issues);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch recurring issues" });
  }
};
