import mongoose from "mongoose";

/**
 * Version Subdocument Schema — Represents a specific uploaded version of a candidate's
 * resume PDF, including Vercel Blob / local storage path, target role, and raw text stream.
 */
const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  storagePath: { type: String, required: true },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  targetRole: { type: String, default: "General" },
  rawText: { type: String, select: false },
  parsedSections: { type: mongoose.Schema.Types.Mixed }, // Extracted structural section hierarchy
  createdAt: { type: Date, default: Date.now }
});

/**
 * Resume Parent Schema — Links a candidate to their collection of resume versions.
 */
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
