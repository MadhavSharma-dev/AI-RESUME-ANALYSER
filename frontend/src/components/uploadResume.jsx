import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

function UploadResume({ onResumeUploaded }) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // "success" | "error" | null
  const [error, setError] = useState("");

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

    // TODO: replace with real API call
    console.log("Uploading file:", selectedFile.name);
    setUploadStatus("success");

    if (onResumeUploaded) {
      onResumeUploaded(selectedFile);
    }

    // Navigate back to dashboard after short delay
    setTimeout(() => navigate("/dashboard"), 1500);
  };

  return (
    <div className="upload-page">
      {/* Left — upload form */}
      <div className="upload-form-side">
        <div className="upload-card">
          <h2>Upload Your Resume</h2>
          <p className="subtitle">Supported formats: PDF, DOC, DOCX (max 5MB)</p>

          <label htmlFor="resume-upload" className="file-label">
            {selectedFile ? selectedFile.name : "Choose a file..."}
          </label>
          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="file-input"
          />

          {error && <p className="upload-error">{error}</p>}

          {uploadStatus === "success" && (
            <p className="upload-success">Resume uploaded! Redirecting to dashboard...</p>
          )}

          <button
            className="btn-submit"
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            Analyze Resume
          </button>
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
