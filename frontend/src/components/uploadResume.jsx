import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { uploadNewResume, uploadResumeVersion } from "../lib/api";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

const LOADING_PHASES = [
  "Extracting document text layout...",
  "Roasting formatting structures...",
  "Comparing skills against target role...",
  "Quantifying achievements and metrics...",
  "Re-writing weak work history bullets..."
];

function UploadResume() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingPhaseIdx, setLoadingPhaseIdx] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // "success" | "error" | null
  const [error, setError] = useState("");

  // Inspect query params for version upload
  const queryParams = new URLSearchParams(window.location.search);
  const resumeId = queryParams.get("resumeId");

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingPhaseIdx((prev) => (prev + 1) % LOADING_PHASES.length);
      }, 1800);
    } else {
      setLoadingPhaseIdx(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setError("");
    setUploadStatus(null);
    setPreviewUrl(null);

    if (!file) return;

    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Only PDF, DOC, and DOCX files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    // Generate preview URL for PDF
    if (file.type === "application/pdf") {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setError("Please select a resume first.");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    const uploadAction = resumeId
      ? uploadResumeVersion(resumeId, selectedFile, targetRole || "General")
      : uploadNewResume(selectedFile, targetRole || "General");

    uploadAction
      .then(() => {
        setUploadStatus("success");
        setIsAnalyzing(false);
        setTimeout(() => navigate("/dashboard"), 1200);
      })
      .catch((err) => {
        setIsAnalyzing(false);
        setError(err.message || "Failed to analyze resume. Please try again.");
        setUploadStatus("error");
      });
  };

  return (
    <div className="upload-page">
      {/* Left — upload form */}
      <div className="upload-form-side">
        <div className="upload-card">
          <h2>{resumeId ? "Upload New Version" : "Upload Your Resume"}</h2>
          <p className="subtitle">Supported formats: PDF, DOC, DOCX (max 5MB)</p>

          {/* Target Role input */}
          <div style={{ width: "100%", textAlign: "left", marginBottom: "1.25rem" }}>
            <label
              htmlFor="target-role"
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--navy)",
                textTransform: "uppercase",
                marginBottom: "0.4rem"
              }}
            >
              Target Job Title / Role
            </label>
            <input
              id="target-role"
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={isAnalyzing}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                fontSize: "0.85rem",
                fontFamily: "var(--font-body)",
                color: "var(--navy)"
              }}
            />
          </div>

          <label htmlFor="resume-upload" className="file-label">
            {selectedFile ? selectedFile.name : "Choose a file..."}
          </label>
          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="file-input"
            disabled={isAnalyzing}
          />

          {error && <p className="upload-error">{error}</p>}

          {uploadStatus === "success" && (
            <p className="upload-success">Analysis complete! Redirecting to dashboard...</p>
          )}

          {isAnalyzing ? (
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <div className="uploader-spinner" style={{
                margin: "0 auto 1rem auto",
                width: "32px",
                height: "32px",
                border: "3px solid rgba(31, 42, 68, 0.1)",
                borderTopColor: "var(--navy)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--navy)", animation: "pulse 1.5s infinite" }}>
                {LOADING_PHASES[loadingPhaseIdx]}
              </p>
            </div>
          ) : (
            <button
              className="btn-submit"
              onClick={handleUpload}
              disabled={!selectedFile}
              style={{ marginTop: "1rem" }}
            >
              {resumeId ? "Roast New Version" : "Analyze Resume"}
            </button>
          )}
        </div>
      </div>

      {/* Right — file preview */}
      <div className="upload-preview-side">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            title="Resume Preview"
            className="resume-preview-frame"
          />
        ) : (
          <div className="preview-placeholder">
            <svg viewBox="0 0 64 64" fill="none" className="preview-placeholder-icon">
              <rect x="8" y="4" width="36" height="48" rx="4" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="2" />
              <path d="M16 18h20M16 26h20M16 34h12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
              <path d="M36 4v12h12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p>Your resume preview will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadResume;
