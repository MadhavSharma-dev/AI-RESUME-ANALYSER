import mongoose from "mongoose";

const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  filePath: { type: String, required: true },
  fileName: { type: String, required: true },
  targetRole: { type: String, default: "General" },
  overallScore: { type: Number, default: 0 },
  atsScore: { type: Number, default: 0 },
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
    name: { type: String, required: true }, // base file name
    versions: [versionSchema]
  },
  { timestamps: true }
);

const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;
