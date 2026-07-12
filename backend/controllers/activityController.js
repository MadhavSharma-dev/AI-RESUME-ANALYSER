import Activity from "../models/Activity.js";
import Resume from "../models/Resume.js";

// @desc    Get all activity for the logged-in user
// @route   GET /api/activity
// @access  Private
export const getActivity = async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Backfill activity from existing resumes (safe to call multiple times — skips already-logged)
// @route   POST /api/activity/backfill
// @access  Private
export const backfillActivity = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id });
    let created = 0;

    for (const resume of resumes) {
      for (const version of resume.versions) {
        // Check if activity already exists for this resume+version to avoid duplicates
        const existing = await Activity.findOne({
          userId: req.user._id,
          resumeId: resume._id,
          type: "upload",
          versionNumber: version.versionNumber
        });

        if (!existing) {
          // Upload event
          await Activity.create({
            userId: req.user._id,
            resumeId: resume._id,
            resumeName: resume.name,
            type: "upload",
            versionNumber: version.versionNumber,
            targetRole: version.targetRole || "General",
            createdAt: version.createdAt || resume.createdAt
          });
          created++;

          // Analysis event
          await Activity.create({
            userId: req.user._id,
            resumeId: resume._id,
            resumeName: resume.name,
            type: "analysis",
            atsScore: version.atsScore,
            overallScore: version.overallScore,
            versionNumber: version.versionNumber,
            targetRole: version.targetRole || "General",
            createdAt: version.createdAt || resume.createdAt
          });
          created++;

          // Rewrite event (if rewrites exist)
          if (version.beforeAfterRewrites && version.beforeAfterRewrites.length > 0) {
            await Activity.create({
              userId: req.user._id,
              resumeId: resume._id,
              resumeName: resume.name,
              type: "rewrite",
              versionNumber: version.versionNumber,
              targetRole: version.targetRole || "General",
              createdAt: version.createdAt || resume.createdAt
            });
            created++;
          }
        }
      }
    }

    return res.json({ message: `Backfill complete. ${created} activities created.` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
