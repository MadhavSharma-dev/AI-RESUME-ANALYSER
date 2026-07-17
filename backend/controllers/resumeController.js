import fs from "fs";
import Resume from "../models/Resume.js";
import Activity from "../models/Activity.js";
import { parseFile } from "../services/parser.js";
import { runConsensus } from "../services/consensus.js";
import { cleanupFile } from "../middleware/upload.js";
import logger from "../utils/logger.js";

// ─── Upload New Resume & Trigger Analysis (V1) ────────────────────
// POST /api/resumes/upload
export const uploadResume = async (req, res) => {
  const { targetRole } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume file" });
    }

    // Parse file → extract text (service layer)
    let extractedText;
    try {
      extractedText = await parseFile(req.file.path, req.file.mimetype);
    } catch (parseErr) {
      cleanupFile(req.file.path);
      return res.status(400).json({ message: parseErr.message });
    }

    // Run AI consensus (service layer)
    let aiFeedback;
    try {
      aiFeedback = await runConsensus(extractedText, targetRole || "General", req.userId);
    } catch (aiErr) {
      cleanupFile(req.file.path);
      return res.status(502).json({ message: aiErr.message });
    }

    const versionData = {
      versionNumber: 1,
      storagePath: req.file.path,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      targetRole: targetRole || "General",
      rawText: extractedText,
      overallScore: aiFeedback.overall_score,
      atsScore: aiFeedback.ats_compatibility,
      modelScores: {
        gemini: aiFeedback.modelScores?.gemini || 0,
        groq: aiFeedback.modelScores?.groq || 0,
        mistral: aiFeedback.modelScores?.mistral || 0
      },
      breakdown: {
        keywords: aiFeedback.breakdown?.keywords || 50,
        format: aiFeedback.breakdown?.format || 50,
        impact: aiFeedback.breakdown?.impact || 50,
        readability: aiFeedback.breakdown?.readability || 50
      },
      strengths: aiFeedback.strengths || [],
      improvements: aiFeedback.improvements || [],
      keywordGaps: aiFeedback.keyword_gaps || [],
      toneAssessment: aiFeedback.tone_assessment || "",
      beforeAfterRewrites: aiFeedback.before_after_rewrites || []
    };

    // IDOR protection: always use req.userId from verified token
    const resume = await Resume.create({
      userId: req.userId,
      name: req.file.originalname,
      versions: [versionData]
    });

    // Log activity events
    await Activity.create({
      userId: req.userId,
      resumeId: resume._id,
      resumeName: req.file.originalname,
      type: "upload",
      versionNumber: 1,
      targetRole: targetRole || "General"
    });

    await Activity.create({
      userId: req.userId,
      resumeId: resume._id,
      resumeName: req.file.originalname,
      type: "analysis",
      atsScore: aiFeedback.ats_compatibility,
      overallScore: aiFeedback.overall_score,
      versionNumber: 1,
      targetRole: targetRole || "General"
    });

    if (aiFeedback.before_after_rewrites?.length > 0) {
      await Activity.create({
        userId: req.userId,
        resumeId: resume._id,
        resumeName: req.file.originalname,
        type: "rewrite",
        versionNumber: 1,
        targetRole: targetRole || "General"
      });
    }

    logger.info({ userId: req.userId, resumeId: resume._id }, "Resume uploaded and analyzed");
    return res.status(201).json(resume);
  } catch (error) {
    logger.error({ err: error.message }, "Upload failed");
    if (req.file) cleanupFile(req.file.path);
    return res.status(500).json({ message: "Upload failed. Please try again." });
  }
};

// ─── Add New Version to Existing Resume ────────────────────────────
// POST /api/resumes/:id/version
export const addResumeVersion = async (req, res) => {
  const { targetRole } = req.body;
  const resumeId = req.params.id;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume file" });
    }

    // IDOR protection: filter by req.userId
    const resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
    if (!resume) {
      cleanupFile(req.file.path);
      return res.status(404).json({ message: "Resume not found" });
    }

    // Parse
    let extractedText;
    try {
      extractedText = await parseFile(req.file.path, req.file.mimetype);
    } catch (parseErr) {
      cleanupFile(req.file.path);
      return res.status(400).json({ message: parseErr.message });
    }

    // AI consensus
    let aiFeedback;
    try {
      aiFeedback = await runConsensus(extractedText, targetRole || "General", req.userId);
    } catch (aiErr) {
      cleanupFile(req.file.path);
      return res.status(502).json({ message: aiErr.message });
    }

    const newVersionNumber = resume.versions.length + 1;

    const versionData = {
      versionNumber: newVersionNumber,
      storagePath: req.file.path,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      targetRole: targetRole || "General",
      rawText: extractedText,
      overallScore: aiFeedback.overall_score,
      atsScore: aiFeedback.ats_compatibility,
      modelScores: {
        gemini: aiFeedback.modelScores?.gemini || 0,
        groq: aiFeedback.modelScores?.groq || 0,
        mistral: aiFeedback.modelScores?.mistral || 0
      },
      breakdown: {
        keywords: aiFeedback.breakdown?.keywords || 50,
        format: aiFeedback.breakdown?.format || 50,
        impact: aiFeedback.breakdown?.impact || 50,
        readability: aiFeedback.breakdown?.readability || 50
      },
      strengths: aiFeedback.strengths || [],
      improvements: aiFeedback.improvements || [],
      keywordGaps: aiFeedback.keyword_gaps || [],
      toneAssessment: aiFeedback.tone_assessment || "",
      beforeAfterRewrites: aiFeedback.before_after_rewrites || []
    };

    resume.versions.push(versionData);
    await resume.save();

    // Log activities
    await Activity.create({
      userId: req.userId,
      resumeId: resume._id,
      resumeName: resume.name,
      type: "upload",
      versionNumber: newVersionNumber,
      targetRole: targetRole || "General"
    });

    await Activity.create({
      userId: req.userId,
      resumeId: resume._id,
      resumeName: resume.name,
      type: "analysis",
      atsScore: aiFeedback.ats_compatibility,
      overallScore: aiFeedback.overall_score,
      versionNumber: newVersionNumber,
      targetRole: targetRole || "General"
    });

    if (aiFeedback.before_after_rewrites?.length > 0) {
      await Activity.create({
        userId: req.userId,
        resumeId: resume._id,
        resumeName: resume.name,
        type: "rewrite",
        versionNumber: newVersionNumber,
        targetRole: targetRole || "General"
      });
    }

    logger.info({ userId: req.userId, resumeId, version: newVersionNumber }, "New version uploaded");
    return res.status(201).json(resume);
  } catch (error) {
    logger.error({ err: error.message }, "Add version failed");
    if (req.file) cleanupFile(req.file.path);
    return res.status(500).json({ message: "Version upload failed. Please try again." });
  }
};

// ─── Get User's Resumes ────────────────────────────────────────────
// GET /api/resumes
export const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ updatedAt: -1 });
    return res.json(resumes);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch resumes" });
  }
};

// ─── Get Resume By ID ──────────────────────────────────────────────
// GET /api/resumes/:id
export const getResumeById = async (req, res) => {
  try {
    // IDOR protection: filter by req.userId
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    return res.json(resume);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch resume" });
  }
};

// ─── Delete Resume ─────────────────────────────────────────────────
// DELETE /api/resumes/:id
export const deleteResume = async (req, res) => {
  try {
    // IDOR protection: filter by req.userId
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Remove files from storage
    resume.versions.forEach((version) => {
      cleanupFile(version.storagePath);
    });

    await Resume.findByIdAndDelete(req.params.id);
    await Activity.deleteMany({ resumeId: req.params.id, userId: req.userId });

    return res.json({ message: "Resume deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete resume" });
  }
};
