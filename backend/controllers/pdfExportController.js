import PDFDocument from "pdfkit";
import Resume from "../models/Resume.js";
import Analysis from "../models/Analysis.js";
import logger from "../utils/logger.js";

/**
 * Controller to export a clean, text-based PDF Feedback Document.
 */
export const exportFeedbackPdf = async (req, res) => {
  const { id } = req.params;
  const { versionNumber, analysisId } = req.query;

  try {
    const resume = await Resume.findOne({ _id: id, userId: req.userId });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const verNum = Number(versionNumber) || resume.versions.length;
    const version = resume.versions.find((v) => v.versionNumber === verNum) || resume.versions[resume.versions.length - 1];

    let analysis = null;
    if (analysisId) {
      analysis = await Analysis.findById(analysisId);
    }
    if (!analysis) {
      analysis = await Analysis.findOne({ resumeId: resume._id, versionNumber: verNum }).sort({ createdAt: -1 });
    }

    const parsed = version?.parsedSections || {};
    const candidateName = parsed.name || resume.name.replace(/\.[^.]+$/, "");
    const cleanFilename = candidateName.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Initialize PDF document
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${cleanFilename}_Feedback.pdf"`
    );

    doc.pipe(res);

    // --- COLOR PALETTE ---
    const navy = "#1f2a44";
    const darkGray = "#333333";
    const lightGray = "#666666";
    const gold = "#d97706";

    // --- HEADER SECTION ---
    doc.fillColor(navy).fontSize(22).font("Helvetica-Bold").text(candidateName);
    if (parsed.title) {
      doc.fontSize(12).font("Helvetica").fillColor(lightGray).text(parsed.title);
    }
    doc.moveDown(0.3);

    // Contact info line
    const contactParts = [];
    if (parsed.contact?.email) contactParts.push(parsed.contact.email);
    if (parsed.contact?.phone) contactParts.push(parsed.contact.phone);
    if (parsed.contact?.location) contactParts.push(parsed.contact.location);

    if (contactParts.length > 0) {
      doc.fontSize(9).font("Helvetica").fillColor(darkGray).text(contactParts.join("  •  "));
    }

    // Validated Social Links
    const linksParts = [];
    if (parsed.contact?.linkedin) linksParts.push(`LinkedIn: ${parsed.contact.linkedin}`);
    if (parsed.contact?.github) linksParts.push(`GitHub: ${parsed.contact.github}`);
    if (parsed.contact?.portfolio) linksParts.push(`Portfolio: ${parsed.contact.portfolio}`);

    if (linksParts.length > 0) {
      doc.moveDown(0.2);
      doc.fontSize(8.5).font("Helvetica-Oblique").fillColor(navy).text(linksParts.join("   |   "));
    }

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
    doc.moveDown(0.8);

    // --- SUMMARY HEADER ---
    doc.fillColor(navy).fontSize(14).font("Helvetica-Bold").text("RESUME ROASTER FEEDBACK SUMMARY");
    doc.fontSize(9.5).font("Helvetica").fillColor(lightGray).text(
      `Target Role: ${analysis?.targetRole || "General"}  |  ATS Readiness Score: ${analysis?.atsScore || 0}/100  |  Version V${verNum}`
    );
    doc.moveDown(1);

    if (analysis) {
      // --- TOP ISSUES SECTION ---
      if (analysis.issues && analysis.issues.length > 0) {
        doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("TOP ISSUES TO FIX");
        doc.moveDown(0.4);

        analysis.issues.forEach((issue, idx) => {
          doc.fillColor(gold).fontSize(9.5).font("Helvetica-Bold").text(`${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
          doc.fillColor(darkGray).fontSize(9).font("Helvetica").text(issue.description);
          if (issue.fix) {
            doc.fillColor("#047857").fontSize(8.5).font("Helvetica-Bold").text(`Action Fix: ${issue.fix}`);
          }
          doc.moveDown(0.5);
        });
        doc.moveDown(0.5);
      }

      // --- STRENGTHS SECTION ---
      if (analysis.strengths && analysis.strengths.length > 0) {
        doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("KEY STRENGTHS");
        doc.moveDown(0.4);
        analysis.strengths.forEach((s) => {
          doc.fillColor(darkGray).fontSize(9).font("Helvetica").text(`• ${s}`);
        });
        doc.moveDown(0.8);
      }

      // --- KEYWORDS SECTION ---
      if (analysis.keywords) {
        doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("KEYWORD ANALYSIS");
        doc.moveDown(0.4);
        if (analysis.keywords.missing && analysis.keywords.missing.length > 0) {
          doc.fillColor("#b91c1c").fontSize(9).font("Helvetica-Bold").text(`Missing Keywords: ${analysis.keywords.missing.join(", ")}`);
        }
        if (analysis.keywords.matched && analysis.keywords.matched.length > 0) {
          doc.fillColor("#047857").fontSize(9).font("Helvetica").text(`Matched Keywords: ${analysis.keywords.matched.join(", ")}`);
        }
        doc.moveDown(0.8);
      }

      // --- REWRITES SECTION ---
      if (analysis.rewrites && analysis.rewrites.length > 0) {
        doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("SUGGESTED BULLET REWRITES");
        doc.moveDown(0.4);
        analysis.rewrites.forEach((rw) => {
          doc.fillColor("#b91c1c").fontSize(8.5).font("Helvetica-Oblique").text(`Original: "${rw.before}"`);
          doc.fillColor("#047857").fontSize(8.5).font("Helvetica-Bold").text(`AI Improved: "${rw.after}"`);
          doc.moveDown(0.4);
        });
      }
    }

    doc.end();
  } catch (error) {
    logger.error({ err: error.message }, "PDF export failed");
    return res.status(500).json({ message: "Failed to generate export PDF" });
  }
};
