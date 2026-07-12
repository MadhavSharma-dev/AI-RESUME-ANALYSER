import fs from "fs";
import pdfParse from "pdf-parse";
import Resume from "../models/Resume.js";
import Activity from "../models/Activity.js";

// Helper: Custom AI Mock Engine checking resume content for keywords
const generateMockAnalysis = (text, targetRole) => {
  const hasReact = /react/i.test(text);
  const hasTypeScript = /typescript|ts/i.test(text);
  const hasNode = /node|express/i.test(text);
  const hasAWS = /aws|amazon/i.test(text);

  const keywordScore = Math.min(62 + (hasReact ? 10 : 0) + (hasTypeScript ? 10 : 0) + (hasNode ? 10 : 0) + (hasAWS ? 10 : 0), 100);
  const formatScore = Math.floor(Math.random() * 15) + 70; 
  const impactScore = Math.floor(Math.random() * 20) + 75; 
  const readabilityScore = Math.floor(Math.random() * 15) + 80; 

  const overallScore = Math.round((keywordScore + formatScore + impactScore + readabilityScore) / 4);
  const atsScore = Math.round((keywordScore * 0.4) + (formatScore * 0.2) + (impactScore * 0.3) + (readabilityScore * 0.1));

  const missingKeywords = [];
  if (!hasTypeScript) missingKeywords.push("TypeScript");
  if (!hasAWS) missingKeywords.push("AWS Cloud Services");
  if (!hasNode) missingKeywords.push("Node.js / backend");
  if (missingKeywords.length === 0) {
    missingKeywords.push("GraphQL", "Docker Containers", "CI/CD Pipelines");
  }

  return {
    overall_score: overallScore,
    ats_compatibility: atsScore,
    breakdown: {
      keywords: keywordScore,
      format: formatScore,
      impact: impactScore,
      readability: readabilityScore
    },
    strengths: [
      hasReact ? "Strong frontend foundation using modern library frameworks." : "Clear software engineering engineering patterns.",
      "Clean formatting and clear page layout structures.",
      "Quantifiable impact shown in multiple project bullet accomplishments."
    ],
    improvements: [
      `Structure resume context closer to modern ${targetRole} expectations.`,
      "Increase percentage of technical action verbs in the work history list.",
      "Consolidate education and credentials for quicker ATS parsing."
    ],
    keyword_gaps: missingKeywords.slice(0, 3),
    tone_assessment: "Professional and technical. The voice is clear, but would gain from stronger verbs and active styling.",
    before_after_rewrites: [
      {
        before: "Worked with team to deliver backend software features.",
        after: `Led a cross-functional squad to architect 4 core features, accelerating sprint delivery by 18% for the ${targetRole} role.`
      },
      {
        before: "Responsible for fixing software bugs and maintenance.",
        after: `Resolved 35+ critical software tickets and refactored legacy hooks, cutting load time latency by 24%.`
      }
    ]
  };
};

// Call Gemini API (with Mock Fallback)
const runAiAnalysis = async (text, targetRole) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No GEMINI_API_KEY found, running mock AI engine...");
    return generateMockAnalysis(text, targetRole);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const prompt = `
    You are an expert ATS (Applicant Tracking System) parser and professional resume reviewer.
    Analyze the following resume text in the context of the target job role: "${targetRole}".
    Return a structured JSON response matching this EXACT schema:
    {
      "overall_score": 86,
      "ats_compatibility": 82,
      "breakdown": {
        "keywords": 88,
        "format": 74,
        "impact": 91,
        "readability": 82
      },
      "strengths": ["string", "string", "string"],
      "improvements": ["string", "string", "string"],
      "keyword_gaps": ["string", "string", "string"],
      "tone_assessment": "string",
      "before_after_rewrites": [
        {
          "before": "weak bullet point",
          "after": "quantified strong bullet point"
        }
      ]
    }
    
    Resume Text:
    ${text}

    IMPORTANT: Return ONLY raw JSON. No markdown backticks, no comments, no prefixes.
  `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    let resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean up resultText markdown backticks if present
    if (resultText.includes("```json")) {
      resultText = resultText.split("```json")[1].split("```")[0];
    } else if (resultText.includes("```")) {
      resultText = resultText.split("```")[1].split("```")[0];
    }

    return JSON.parse(resultText.trim());
  } catch (error) {
    console.error("Gemini API call failed, falling back to mock:", error.message);
    return generateMockAnalysis(text, targetRole);
  }
};

// @desc    Upload new resume & trigger analysis (V1)
// @route   POST /api/resumes/upload
// @access  Private
export const uploadResume = async (req, res) => {
  const { targetRole } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume file" });
    }

    // Extract text from PDF
    let extractedText = "";
    if (req.file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else {
      extractedText = `Uploaded document: ${req.file.originalname}. Technical resume profile contents.`;
    }

    // Trigger AI Analysis
    const aiFeedback = await runAiAnalysis(extractedText, targetRole || "General");

    const versionData = {
      versionNumber: 1,
      filePath: req.file.path,
      fileName: req.file.originalname,
      targetRole: targetRole || "General",
      overallScore: aiFeedback.overall_score,
      atsScore: aiFeedback.ats_compatibility,
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

    // Create new resume entry in MongoDB
    const resume = await Resume.create({
      userId: req.user._id,
      name: req.file.originalname,
      versions: [versionData]
    });

    // Log: upload event (V1 created)
    await Activity.create({
      userId: req.user._id,
      resumeId: resume._id,
      resumeName: req.file.originalname,
      type: "upload",
      versionNumber: 1,
      targetRole: targetRole || "General"
    });

    // Log: analysis event
    await Activity.create({
      userId: req.user._id,
      resumeId: resume._id,
      resumeName: req.file.originalname,
      type: "analysis",
      atsScore: aiFeedback.ats_compatibility,
      overallScore: aiFeedback.overall_score,
      versionNumber: 1,
      targetRole: targetRole || "General"
    });

    // Log: rewrite event (if rewrites were generated)
    if (aiFeedback.before_after_rewrites && aiFeedback.before_after_rewrites.length > 0) {
      await Activity.create({
        userId: req.user._id,
        resumeId: resume._id,
        resumeName: req.file.originalname,
        type: "rewrite",
        versionNumber: 1,
        targetRole: targetRole || "General"
      });
    }

    return res.status(201).json(resume);
  } catch (error) {
    console.error("Upload failed:", error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Upload new version of existing resume
// @route   POST /api/resumes/:id/version
// @access  Private
export const addResumeVersion = async (req, res) => {
  const { targetRole } = req.body;
  const resumeId = req.params.id;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume file" });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Check ownership
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to update this resume" });
    }

    // Extract text from PDF
    let extractedText = "";
    if (req.file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else {
      extractedText = `Uploaded document: ${req.file.originalname}. Technical resume profile contents.`;
    }

    // Trigger AI Analysis
    const aiFeedback = await runAiAnalysis(extractedText, targetRole || "General");

    const newVersionNumber = resume.versions.length + 1;

    const versionData = {
      versionNumber: newVersionNumber,
      filePath: req.file.path,
      fileName: req.file.originalname,
      targetRole: targetRole || "General",
      overallScore: aiFeedback.overall_score,
      atsScore: aiFeedback.ats_compatibility,
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

    // Log: upload event for new version
    await Activity.create({
      userId: req.user._id,
      resumeId: resume._id,
      resumeName: resume.name,
      type: "upload",
      versionNumber: newVersionNumber,
      targetRole: targetRole || "General"
    });

    // Log: analysis event
    await Activity.create({
      userId: req.user._id,
      resumeId: resume._id,
      resumeName: resume.name,
      type: "analysis",
      atsScore: aiFeedback.ats_compatibility,
      overallScore: aiFeedback.overall_score,
      versionNumber: newVersionNumber,
      targetRole: targetRole || "General"
    });

    // Log: rewrite event (if rewrites generated)
    if (aiFeedback.before_after_rewrites && aiFeedback.before_after_rewrites.length > 0) {
      await Activity.create({
        userId: req.user._id,
        resumeId: resume._id,
        resumeName: resume.name,
        type: "rewrite",
        versionNumber: newVersionNumber,
        targetRole: targetRole || "General"
      });
    }

    return res.status(201).json(resume);
  } catch (error) {
    console.error("Add version failed:", error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's resumes
// @route   GET /api/resumes
// @access  Private
export const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    return res.json(resumes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get details of specific resume by ID
// @route   GET /api/resumes/:id
// @access  Private
export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Check ownership
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to view this resume" });
    }

    return res.json(resume);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a resume
// @route   DELETE /api/resumes/:id
// @access  Private
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Check ownership
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to delete this resume" });
    }

    // Remove files from storage
    resume.versions.forEach((version) => {
      if (fs.existsSync(version.filePath)) {
        fs.unlinkSync(version.filePath);
      }
    });

    await Resume.findByIdAndDelete(req.params.id);

    // Delete all activity entries for this resume
    await Activity.deleteMany({ resumeId: req.params.id, userId: req.user._id });

    return res.json({ message: "Resume deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
