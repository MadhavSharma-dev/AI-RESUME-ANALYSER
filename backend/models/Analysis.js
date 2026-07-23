import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    versionNumber: { type: Number, required: true },
    targetRole: { type: String, default: "General" },
    contentHash: { type: String, index: true },
    
    // Overall scores
    atsScore: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
    
    // Score Breakdowns
    breakdown: {
      keywords: { type: Number, default: 0 },
      format: { type: Number, default: 0 },
      impact: { type: Number, default: 0 },
      readability: { type: Number, default: 0 }
    },
    
    // New Extended Breakdown (7 metrics)
    extendedBreakdown: {
      content: { type: Number, default: 0 },
      sections: { type: Number, default: 0 },
      atsEssentials: { type: Number, default: 0 },
      hrRedFlags: { type: Number, default: 0 },
      discrimination: { type: Number, default: 0 },
      seniority: { type: Number, default: 0 },
      tailoring: { type: Number, default: 0 }
    },

    // Detailed feedback
    issues: [
      {
        severity: { type: String, enum: ["high", "medium", "low"], default: "medium" },
        title: { type: String, required: true },
        description: { type: String, required: true },
        fix: { type: String, required: true }
      }
    ],
    strengths: [{ type: String }],
    keywords: {
      matched: [{ type: String }],
      missing: [{ type: String }]
    },
    rewrites: [
      {
        before: { type: String },
        after: { type: String }
      }
    ],
    verdict: { type: String, default: "" },

    // Tracking the ensemble execution
    modelsUsed: [{ type: String }],
    rawModelOutputs: {
      gemini: { type: mongoose.Schema.Types.Mixed },
      groq: { type: mongoose.Schema.Types.Mixed },
      mistral: { type: mongoose.Schema.Types.Mixed }
    }
  },
  { timestamps: true }
);

// Compound index to quickly find all analyses for a specific resume version
analysisSchema.index({ resumeId: 1, versionNumber: 1 });

const Analysis = mongoose.model("Analysis", analysisSchema);
export default Analysis;
