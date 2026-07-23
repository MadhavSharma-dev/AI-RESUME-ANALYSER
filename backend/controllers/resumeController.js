import fs from "fs";
import crypto from "crypto";
import Resume from "../models/Resume.js";
import Analysis from "../models/Analysis.js";
import Activity from "../models/Activity.js";
import { parseFile } from "../services/parser.js";
import { parseResume } from "../services/gemini.js";
import { runEnsemble } from "../services/ensemble.js";
import { verifyContactUrls } from "../services/urlVerifier.js";
import { generateFreshRoastVerdict } from "../services/groq.js";
import { cleanupFile } from "../middleware/upload.js";
import logger from "../utils/logger.js";

// Helper to compute sha256 content hash
const computeContentHash = (parsedSections, targetRole) => {
  const str = JSON.stringify(parsedSections || {}) + ":" + (targetRole || "General").toLowerCase().trim();
  return crypto.createHash("sha256").update(str).digest("hex");
};

// ─── Helper function to map ensemble output to Analysis model ───
const buildAnalysisData = (resumeId, versionNumber, targetRole, ensembleFeedback, contentHash) => {
  return {
    resumeId,
    versionNumber,
    targetRole: targetRole || "General",
    contentHash,
    atsScore: ensembleFeedback.reconciled.atsScore,
    overallScore: ensembleFeedback.reconciled.overallScore,
    breakdown: ensembleFeedback.reconciled.breakdown,
    extendedBreakdown: ensembleFeedback.reconciled.extendedBreakdown,
    issues: ensembleFeedback.reconciled.issues,
    strengths: ensembleFeedback.reconciled.strengths,
    keywords: ensembleFeedback.reconciled.keywords,
    rewrites: ensembleFeedback.reconciled.rewrites,
    verdict: ensembleFeedback.reconciled.verdict,
    modelsUsed: ensembleFeedback.modelsUsed,
    rawModelOutputs: ensembleFeedback.rawOutputs
  };
};

// Helper to inject broken link issues if URLs fail live check
const injectBrokenLinkIssues = (ensembleFeedback, contactLinks = {}) => {
  if (!ensembleFeedback?.reconciled?.issues) return;
  Object.entries(contactLinks).forEach(([platform, info]) => {
    if (info?.url && !info?.isValid) {
      const alreadyPresent = ensembleFeedback.reconciled.issues.some(i => 
        i.title.toLowerCase().includes(platform) || i.description.includes(info.url)
      );
      if (!alreadyPresent) {
        ensembleFeedback.reconciled.issues.unshift({
          severity: "high",
          title: `Broken ${platform.toUpperCase()} URL in Contact Info`,
          description: `The provided ${platform} link "${info.url}" is unreachable (HTTP error or connection timeout). Recruiters and ATS scanners will encounter a dead link.`,
          fix: `Verify and update your ${platform} URL in your resume file to point to a live, public profile.`
        });
      }
    }
  });
};

// ─── Upload New Resume & Trigger Analysis (V1) ────────────────────
export const uploadResume = async (req, res) => {
  const { targetRole } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume file" });
    }

    // Step 1: Parse file → extract text (raw)
    let extractedText;
    try {
      extractedText = await parseFile(req.file.path, req.file.mimetype);
    } catch (parseErr) {
      cleanupFile(req.file.path);
      return res.status(400).json({ message: parseErr.message });
    }

    // Step 2: Extract Structured Sections via Gemini
    let parsedSections;
    try {
      parsedSections = await parseResume(extractedText);
    } catch (err) {
      cleanupFile(req.file.path);
      return res.status(502).json({ message: "Failed to extract structured sections" });
    }

    // Step 2.5: Verify live contact URLs
    if (parsedSections?.contact) {
      const contactLinks = await verifyContactUrls(parsedSections.contact);
      parsedSections.contactLinks = contactLinks;
    }

    // Step 3: Run AI Ensemble (parallel Groq, Mistral, Gemini)
    let ensembleFeedback;
    try {
      const parsedJsonString = JSON.stringify(parsedSections);
      ensembleFeedback = await runEnsemble(parsedJsonString, targetRole || "General");
      injectBrokenLinkIssues(ensembleFeedback, parsedSections.contactLinks);
    } catch (aiErr) {
      cleanupFile(req.file.path);
      return res.status(502).json({ message: aiErr.message });
    }

    const candidateName = parsedSections?.name?.trim();
    let existingResume = await Resume.findOne({
      userId: req.userId,
      $or: [
        { name: req.file.originalname },
        ...(candidateName ? [{ name: new RegExp(`^${candidateName}`, "i") }] : [])
      ]
    });

    if (existingResume) {
      const newVersionNumber = existingResume.versions.length + 1;
      const versionData = {
        versionNumber: newVersionNumber,
        storagePath: req.file.path,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        targetRole: targetRole || "General",
        rawText: extractedText,
        parsedSections: parsedSections
      };

      existingResume.versions.push(versionData);
      await existingResume.save();

      const contentHash = computeContentHash(parsedSections, targetRole);
      const analysisData = buildAnalysisData(existingResume._id, newVersionNumber, targetRole, ensembleFeedback, contentHash);
      await Analysis.create(analysisData);

      await Activity.create({
        userId: req.userId,
        resumeId: existingResume._id,
        resumeName: existingResume.name,
        type: "upload",
        versionNumber: newVersionNumber,
        targetRole: targetRole || "General"
      });

      await Activity.create({
        userId: req.userId,
        resumeId: existingResume._id,
        resumeName: existingResume.name,
        type: "analysis",
        atsScore: ensembleFeedback.reconciled.atsScore,
        overallScore: ensembleFeedback.reconciled.overallScore,
        versionNumber: newVersionNumber,
        targetRole: targetRole || "General"
      });

      logger.info({ userId: req.userId, resumeId: existingResume._id, version: newVersionNumber }, "Stacked re-uploaded resume as new version");
      return res.status(201).json(existingResume);
    }

    const versionData = {
      versionNumber: 1,
      storagePath: req.file.path,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      targetRole: targetRole || "General",
      rawText: extractedText,
      parsedSections: parsedSections
    };

    const resume = await Resume.create({
      userId: req.userId,
      name: req.file.originalname,
      versions: [versionData]
    });

    const contentHash = computeContentHash(parsedSections, targetRole);
    const analysisData = buildAnalysisData(resume._id, 1, targetRole, ensembleFeedback, contentHash);
    await Analysis.create(analysisData);

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
      atsScore: ensembleFeedback.reconciled.atsScore,
      overallScore: ensembleFeedback.reconciled.overallScore,
      versionNumber: 1,
      targetRole: targetRole || "General"
    });

    logger.info({ userId: req.userId, resumeId: resume._id }, "Resume uploaded and analyzed via ensemble");
    return res.status(201).json(resume);
  } catch (error) {
    logger.error({ err: error.message }, "Upload failed");
    if (req.file) cleanupFile(req.file.path);
    return res.status(500).json({ message: "Upload failed. Please try again." });
  }
};

// ─── Add New Version to Existing Resume ────────────────────────────
export const addResumeVersion = async (req, res) => {
  const { targetRole } = req.body;
  const resumeId = req.params.id;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume file" });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
    if (!resume) {
      cleanupFile(req.file.path);
      return res.status(404).json({ message: "Resume not found" });
    }

    let extractedText;
    try {
      extractedText = await parseFile(req.file.path, req.file.mimetype);
    } catch (parseErr) {
      cleanupFile(req.file.path);
      return res.status(400).json({ message: parseErr.message });
    }

    let parsedSections;
    try {
      parsedSections = await parseResume(extractedText);
    } catch (err) {
      cleanupFile(req.file.path);
      return res.status(502).json({ message: "Failed to extract structured sections" });
    }

    if (parsedSections?.contact) {
      const contactLinks = await verifyContactUrls(parsedSections.contact);
      parsedSections.contactLinks = contactLinks;
    }

    let ensembleFeedback;
    try {
      const parsedJsonString = JSON.stringify(parsedSections);
      ensembleFeedback = await runEnsemble(parsedJsonString, targetRole || "General");
      injectBrokenLinkIssues(ensembleFeedback, parsedSections.contactLinks);
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
      parsedSections: parsedSections
    };

    resume.versions.push(versionData);
    await resume.save();

    const contentHash = computeContentHash(parsedSections, targetRole);
    const analysisData = buildAnalysisData(resume._id, newVersionNumber, targetRole, ensembleFeedback, contentHash);
    await Analysis.create(analysisData);

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
      atsScore: ensembleFeedback.reconciled.atsScore,
      overallScore: ensembleFeedback.reconciled.overallScore,
      versionNumber: newVersionNumber,
      targetRole: targetRole || "General"
    });

    logger.info({ userId: req.userId, resumeId, version: newVersionNumber }, "New version uploaded");
    return res.status(201).json(resume);
  } catch (error) {
    logger.error({ err: error.message }, "Add version failed");
    if (req.file) cleanupFile(req.file.path);
    return res.status(500).json({ message: "Version upload failed. Please try again." });
  }
};

// ─── Re-Analyze Existing Version for a New Role / Force Re-analysis ───
export const reAnalyze = async (req, res) => {
  const { versionNumber, targetRole, force } = req.body;
  const resumeId = req.params.id;

  try {
    const resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const version = resume.versions.find((v) => v.versionNumber === Number(versionNumber));
    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    if (!version.parsedSections) {
      return res.status(400).json({ message: "No parsed sections found for this version. Please re-upload." });
    }

    // Ensure live URL check exists on parsedSections
    if (version.parsedSections.contact && !version.parsedSections.contactLinks) {
      version.parsedSections.contactLinks = await verifyContactUrls(version.parsedSections.contact);
      resume.markModified("versions");
      await resume.save();
    }

    const contentHash = computeContentHash(version.parsedSections, targetRole);

    // Find baseline analysis for this version and role
    const baselineAnalysis = await Analysis.findOne({
      resumeId: resume._id,
      versionNumber: version.versionNumber,
      targetRole: targetRole || "General"
    }).sort({ createdAt: 1 });

    if (baselineAnalysis) {
      // KEEP SCORE BREAKDOWN STABLE, GENERATE FRESH ROASTER VERDICT 🔥
      const freshVerdict = await generateFreshRoastVerdict(
        JSON.stringify(version.parsedSections),
        targetRole || "General",
        baselineAnalysis.atsScore
      );

      const newAnalysis = await Analysis.create({
        resumeId: resume._id,
        versionNumber: version.versionNumber,
        targetRole: targetRole || "General",
        contentHash,
        atsScore: baselineAnalysis.atsScore,
        overallScore: baselineAnalysis.overallScore,
        breakdown: baselineAnalysis.breakdown,
        extendedBreakdown: baselineAnalysis.extendedBreakdown,
        issues: baselineAnalysis.issues,
        strengths: baselineAnalysis.strengths,
        keywords: baselineAnalysis.keywords,
        rewrites: baselineAnalysis.rewrites,
        verdict: freshVerdict,
        modelsUsed: baselineAnalysis.modelsUsed,
        rawModelOutputs: baselineAnalysis.rawModelOutputs
      });

      await Activity.create({
        userId: req.userId,
        resumeId: resume._id,
        resumeName: resume.name,
        type: "analysis",
        atsScore: baselineAnalysis.atsScore,
        overallScore: baselineAnalysis.overallScore,
        versionNumber: version.versionNumber,
        targetRole: targetRole || "General"
      });

      logger.info({ userId: req.userId, resumeId, versionNumber: version.versionNumber }, "Re-analyzed with stable score breakdown & fresh Roaster Verdict 🔥");
      return res.status(201).json(newAnalysis);
    }

    // Initial analysis if none exists yet
    let ensembleFeedback;
    try {
      const parsedJsonString = JSON.stringify(version.parsedSections);
      ensembleFeedback = await runEnsemble(parsedJsonString, targetRole || "General");
      injectBrokenLinkIssues(ensembleFeedback, version.parsedSections.contactLinks);
    } catch (aiErr) {
      return res.status(502).json({ message: aiErr.message });
    }

    const analysisData = buildAnalysisData(resume._id, version.versionNumber, targetRole, ensembleFeedback, contentHash);
    const analysis = await Analysis.create(analysisData);

    await Activity.create({
      userId: req.userId,
      resumeId: resume._id,
      resumeName: resume.name,
      type: "analysis",
      atsScore: ensembleFeedback.reconciled.atsScore,
      overallScore: ensembleFeedback.reconciled.overallScore,
      versionNumber: version.versionNumber,
      targetRole: targetRole || "General"
    });

    logger.info({ userId: req.userId, resumeId }, "Initial analysis generated via ensemble");
    return res.status(201).json(analysis);
  } catch (error) {
    logger.error({ err: error.message }, "Re-analyze failed");
    return res.status(500).json({ message: "Analysis failed. Please try again." });
  }
};

// ─── Get User's Resumes ────────────────────────────────────────────
export const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ updatedAt: -1 });
    
    // We also need to fetch analyses to give the frontend the overall scores
    // for the list view since we decoupled them from the Resume model.
    const resumesWithLatestAnalysis = await Promise.all(resumes.map(async (resume) => {
      const latestVer = resume.versions[resume.versions.length - 1];
      const latestAnalysis = await Analysis.findOne({
        resumeId: resume._id,
        versionNumber: latestVer.versionNumber
      }).sort({ createdAt: -1 });

      const resumeObj = resume.toObject();
      if (latestAnalysis) {
        // Mock the old structure so the old list view doesn't break
        resumeObj.versions[resumeObj.versions.length - 1].overallScore = latestAnalysis.overallScore;
        resumeObj.versions[resumeObj.versions.length - 1].atsScore = latestAnalysis.atsScore;
        resumeObj.versions[resumeObj.versions.length - 1].targetRole = latestAnalysis.targetRole;
      }
      return resumeObj;
    }));

    return res.json(resumesWithLatestAnalysis);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch resumes" });
  }
};

// ─── Get Resume By ID (With Analyses) ──────────────────────────────
export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const analyses = await Analysis.find({ resumeId: req.params.id }).sort({ createdAt: -1 });

    return res.json({ resume, analyses });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch resume" });
  }
};

// ─── Delete Resume ─────────────────────────────────────────────────
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    resume.versions.forEach((version) => {
      cleanupFile(version.storagePath);
    });

    await Resume.findByIdAndDelete(req.params.id);
    await Analysis.deleteMany({ resumeId: req.params.id });
    await Activity.deleteMany({ resumeId: req.params.id, userId: req.userId });

    return res.json({ message: "Resume deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete resume" });
  }
};
