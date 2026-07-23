import mongoose from "mongoose";

const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  storagePath: { type: String, required: true },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  targetRole: { type: String, default: "General" }, // The role provided during the original upload
  rawText: { type: String, select: false },
  parsedSections: { type: mongoose.Schema.Types.Mixed }, // Structured JSON extracted by Gemini parsing step
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
