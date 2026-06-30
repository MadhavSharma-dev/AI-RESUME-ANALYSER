import { useState } from "react";

function UploadResume() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert("Please select a resume first.");
      return;
    }

    console.log("Uploaded File:", selectedFile);
  };

  return (
    <div className="upload-container">
      <h2>Upload Your Resume</h2>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
      />

      <br />
      <br />

      {selectedFile && (
        <p>
          Selected File: <strong>{selectedFile.name}</strong>
        </p>
      )}

      <button onClick={handleUpload}>
        Analyze Resume
      </button>
    </div>
  );
}

export default UploadResume;