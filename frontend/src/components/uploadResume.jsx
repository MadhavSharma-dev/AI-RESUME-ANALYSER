import { useState } from "react";
import "../App.css";

const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

function UploadResume() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // "success" | "error" | null
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setError("");
    setUploadStatus(null);

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
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setError("Please select a resume first.");
      return;
    }

    // TODO: replace with real API call, e.g.:
    // const formData = new FormData();
    // formData.append("resume", selectedFile);
    // await fetch("/api/upload", { method: "POST", body: formData });

    console.log("Uploading file:", selectedFile.name);
    setUploadStatus("success");
  };

  return (
    <div className="upload-container">
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
          <p className="upload-success">Resume uploaded successfully! Analysis in progress...</p>
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
  );
}

export default UploadResume;
