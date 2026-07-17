import mongoose from "mongoose";

const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  storagePath: { type: String, required: true },   // UUID-based path on disk
  fileName: { type: String, required: true },       // Original filename (display only)
  mimeType: { type: String, required: true },       // MIME type for parsing
  targetRole: { type: String, default: "General" },
  rawText: { type: String, select: false },         // Parsed text — not returned by default
  overallScore: { type: Number, default: 0 },
  atsScore: { type: Number, default: 0 },
  modelScores: {
    gemini: { type: Number, default: 0 },
    groq: { type: Number, default: 0 },
    mistral: { type: Number, default: 0 }
  },
  breakdown: {
    keywords: { type: Number, default: 0 },
    format: { type: Number, default: 0 },
    impact: { type: Number, default: 0 },
    readability: { type: Number, default: 0 }
  },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  keywordGaps: [{ type: String }],
  toneAssessment: { type: String, default: "" },
  beforeAfterRewrites: [
    {
      before: { type: String },
      after: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    versions: [versionSchema]
  },
  { timestamps: true }
);

const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;
