import mongoose from "mongoose";

// Each user action (upload, analysis, rewrite) is stored as an Activity document
const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true
    },
    resumeName: { type: String, required: true },
    type: {
      type: String,
      enum: ["upload", "analysis", "rewrite"],
      required: true
    },
    // For analysis events
    atsScore: { type: Number, default: null },
    overallScore: { type: Number, default: null },
    // For version / rewrite events
    versionNumber: { type: Number, default: null },
    targetRole: { type: String, default: "" }
  },
  { timestamps: true }
);

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
