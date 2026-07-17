import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchResumesList, removeResume, uploadNewResume, uploadResumeVersion } from "../../api/resumes";
import { motion, staggerContainer, fadeUpItem, cardHover } from "../../lib/motion";
import "./Resumes.css";

const UPLOADER_PHASES = [
  "Reading document structure...",
  "Comparing skills against target role...",
  "Querying Gemini, Groq, and Mistral...",
  "Consolidating scores and bullet rewrites..."
];

function Resumes({ user }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Selection / Modal state
  const [selectedResume, setSelectedResume] = useState(null);
  const [activeVersionNumber, setActiveVersionNumber] = useState(1);

  // Uploader state
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhaseIdx, setUploadPhaseIdx] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check query params for version upload
  const queryParams = new URLSearchParams(window.location.search);
  const queryResumeId = queryParams.get("resumeId");

  useEffect(() => {
    loadResumes();
  }, []);

  useEffect(() => {
    let interval;
    if (isUploading) {
      interval = setInterval(() => {
        setUploadPhaseIdx((prev) => (prev + 1) % UPLOADER_PHASES.length);
      }, 1600);
    } else {
      setUploadPhaseIdx(0);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const loadResumes = () => {
    setLoading(true);
    fetchResumesList()
      .then((data) => {
        setResumes(data);
        if (data.length === 0) {
          setIsDemoMode(true);
        } else {
          setIsDemoMode(false);
        }
      })
      .catch((err) => console.error("Error loading resumes:", err.message))
      .finally(() => setLoading(false));
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this resume and all its version history? This cannot be undone.")) {
      removeResume(id)
        .then(() => {
          setResumes((prev) => prev.filter((r) => r._id !== id));
          if (selectedResume?._id === id) setSelectedResume(null);
          // If empty, return to demo
          if (resumes.length <= 1) {
            setIsDemoMode(true);
          }
        })
        .catch((err) => alert(err.message || "Failed to delete"));
    }
  };

  const handleOpen = (resume) => {
    setSelectedResume(resume);
    setActiveVersionNumber(resume.versions.length);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setUploadError("");
    const ext = "." + file.name.split(".").pop().toLowerCase();
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const allowedExtensions = [".pdf", ".doc", ".docx"];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      setUploadError("Only PDF, DOC, and DOCX files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError("");

    const action = queryResumeId
      ? uploadResumeVersion(queryResumeId, selectedFile, targetRole || "General")
      : uploadNewResume(selectedFile, targetRole || "General");

    action
      .then(() => {
        setSelectedFile(null);
        setTargetRole("");
        setIsUploading(false);
        // Clear query parameters
        if (queryResumeId) {
          navigate("/resumes");
        }
        loadResumes();
      })
      .catch((err) => {
        setIsUploading(false);
        setUploadError(err.message || "Failed to analyze resume.");
      });
  };

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : "there";

  // MOCK DATA for Demo Mode (matches User Screenshots)
  const demoResumes = [
    {
      _id: "demo-res-1",
      name: "Senior Frontend Engineer Resume.pdf",
      updatedAt: "2026-05-27T18:30:00.000Z",
      versions: [
        {
          versionNumber: 1,
          fileName: "Senior Frontend Engineer Resume_v1.pdf",
          filePath: "",
          targetRole: "Senior Frontend Engineer",
          overallScore: 58,
          atsScore: 56,
          modelScores: { gemini: 62, groq: 54, mistral: 58 },
          breakdown: { keywords: 60, format: 54, impact: 52, readability: 66 },
          strengths: ["Clean professional formatting", "Standard typography sizing"],
          improvements: ["Structure descriptions using quantified impact numbers", "List Certifications and Tools closer to the top header"],
          keywordGaps: ["TypeScript", "AWS Cloud", "GraphQL"],
          toneAssessment: "Formal and technical, but slightly passive.",
          beforeAfterRewrites: [
            { before: "Worked with team to deliver backend software features.", after: "Led a cross-functional squad to ship 4 core API features, accelerating sprint delivery by 18%." }
          ]
        },
        {
          versionNumber: 2,
          fileName: "Senior Frontend Engineer Resume_v2.pdf",
          filePath: "",
          targetRole: "Senior Frontend Engineer",
          overallScore: 74,
          atsScore: 72,
          modelScores: { gemini: 76, groq: 72, mistral: 74 },
          breakdown: { keywords: 76, format: 74, impact: 70, readability: 78 },
          strengths: ["Strong description impact statements", "Optimized work bullets layout"],
          improvements: ["Introduce cloud methodologies keywords", "Align summary section closer to role expectations"],
          keywordGaps: ["AWS Cloud", "Docker Containers"],
          toneAssessment: "Technical and action-oriented.",
          beforeAfterRewrites: [
            { before: "Responsible for fixing bugs and maintenance.", after: "Resolved 35+ blocker issues and optimized legacy hooks, cutting load time latency by 24%." }
          ]
        },
        {
          versionNumber: 3,
          fileName: "Senior Frontend Engineer Resume_final.pdf",
          filePath: "",
          targetRole: "Senior Frontend Engineer",
          overallScore: 86,
          atsScore: 84,
          modelScores: { gemini: 88, groq: 84, mistral: 86 },
          breakdown: { keywords: 90, format: 80, impact: 88, readability: 86 },
          strengths: ["Outstanding active verb density", "Excellent formatting parse compatibility", "High keywords alignment to senior title"],
          improvements: ["Include minor credentials references", "Standardize padding margins for single page print formats"],
          keywordGaps: ["GraphQL"],
          toneAssessment: "Highly professional and executive-styled.",
          beforeAfterRewrites: [
            { before: "Responsible for team management and documentation.", after: "Led 5 engineers in sprint deliveries and authored 12 API modules documentation, raising test coverage to 85%." }
          ]
        }
      ]
    },
    {
      _id: "demo-res-2",
      name: "Full Stack Engineer Resume.pdf",
      updatedAt: "2026-05-21T14:20:00.000Z",
      versions: [
        {
          versionNumber: 1,
          fileName: "Full Stack Engineer Resume.pdf",
          filePath: "",
          targetRole: "Full Stack Engineer",
          overallScore: 68,
          atsScore: 65,
          modelScores: { gemini: 70, groq: 64, mistral: 70 },
          breakdown: { keywords: 70, format: 62, impact: 64, readability: 76 },
          strengths: ["Clear section boundaries", "Solid full-stack project items"],
          improvements: ["Detail database queries optimizations"],
          keywordGaps: ["Kubernetes", "Redis"],
          toneAssessment: "Descriptive and technical.",
          beforeAfterRewrites: []
        },
        {
          versionNumber: 2,
          fileName: "Full Stack Engineer Resume_v2.pdf",
          filePath: "",
          targetRole: "Full Stack Engineer",
          overallScore: 79,
          atsScore: 78,
          modelScores: { gemini: 82, groq: 76, mistral: 79 },
          breakdown: { keywords: 82, format: 76, impact: 78, readability: 82 },
          strengths: ["Strong description points", "Consolidated technical skillset tags"],
          improvements: ["Integrate system design practices"],
          keywordGaps: ["Kubernetes"],
          toneAssessment: "Action-oriented and professional.",
          beforeAfterRewrites: []
        }
      ]
    },
    {
      _id: "demo-res-3",
      name: "Engineering Manager Resume.pdf",
      updatedAt: "2026-05-16T11:10:00.000Z",
      versions: [
        {
          versionNumber: 1,
          fileName: "Engineering Manager Resume.pdf",
          filePath: "",
          targetRole: "Engineering Manager",
          overallScore: 72,
          atsScore: 70,
          modelScores: { gemini: 75, groq: 68, mistral: 73 },
          breakdown: { keywords: 72, format: 70, impact: 68, readability: 80 },
          strengths: ["Clear timeline milestones"],
          improvements: ["Highlight team scale and sprint metrics"],
          keywordGaps: ["CI/CD Pipelines", "OKRs Mapping"],
          toneAssessment: "Management focused but slightly wordy.",
          beforeAfterRewrites: []
        },
        {
          versionNumber: 2,
          fileName: "Engineering Manager Resume_final.pdf",
          filePath: "",
          targetRole: "Engineering Manager",
          overallScore: 83,
          atsScore: 82,
          modelScores: { gemini: 85, groq: 80, mistral: 84 },
          breakdown: { keywords: 85, format: 80, impact: 82, readability: 86 },
          strengths: ["Strong metrics references", "Clear agile development keywords"],
          improvements: ["Trim summaries to keep layout under 2 pages"],
          keywordGaps: ["CI/CD Pipelines"],
          toneAssessment: "Executive and direct.",
          beforeAfterRewrites: []
        }
      ]
    },
    {
      _id: "demo-res-4",
      name: "Startup Founder Resume.pdf",
      updatedAt: "2026-05-09T09:45:00.000Z",
      versions: [
        {
          versionNumber: 1,
          fileName: "Startup Founder Resume.pdf",
          filePath: "",
          targetRole: "Startup Founder / PM",
          overallScore: 79,
          atsScore: 77,
          modelScores: { gemini: 82, groq: 74, mistral: 81 },
          breakdown: { keywords: 78, format: 78, impact: 82, readability: 80 },
          strengths: ["Excellent entrepreneur achievements", "Strong business numbers metrics"],
          improvements: ["Add standard technology stack certifications"],
          keywordGaps: ["System Architecture", "Cloud Services"],
          toneAssessment: "Highly proactive and value-oriented.",
          beforeAfterRewrites: []
        }
      ]
    }
  ];

  const activeResumesList = isDemoMode ? demoResumes : resumes;
  
  const filtered = activeResumesList.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.versions.some((v) => v.targetRole?.toLowerCase().includes(search.toLowerCase()))
  );

  const activeVersion = selectedResume?.versions.find(
    (v) => v.versionNumber === activeVersionNumber
  ) || selectedResume?.versions[selectedResume.versions.length - 1];

  const targetUpdatingResume = queryResumeId 
    ? activeResumesList.find(r => r._id === queryResumeId)
    : null;

  return (
    <div className="resumes-page">
      {/* Tab search utilities bar */}
      <div className="dash-overview-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="dash-overview-greeting">Hello, {displayName}.</h1>
          <p className="dash-overview-sub">Sharpen your resume with calm, focused AI insights.</p>
        </div>
        <div className="header-utils">
          <div className="header-search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search resumes, keywords, rewrites..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="header-search-kbd">⌘ K</span>
          </div>
          <button className="header-btn" title="Toggle theme">🌙</button>
          <button className="header-btn" title="Notifications">🔔</button>
        </div>
      </div>

      {isDemoMode && (
        <div className="demo-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--gold)" }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span><strong>Demo Mode Active</strong>: You are viewing placeholder data. Upload a resume PDF on the left to populate your own workspace!</span>
        </div>
      )}

      {/* Main Title Row */}
      <h2 className="resumes-page-title">Your Resumes</h2>
      <p className="resumes-page-sub">Upload a new one or pick up where you left off.</p>

      {/* Split Dual Grid layout */}
      <motion.div 
        className="resumes-split-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Left Side: Upload Card */}
        <motion.div className="upload-card-wrapper" variants={fadeUpItem} whileHover={cardHover}>
          <h3>{queryResumeId ? "Upload New Version" : "Upload a resume"}</h3>
          <p className="sub">PDF, DOC, DOCX formats. We extract text and run analyses.</p>

          {targetUpdatingResume && (
            <div className="selected-file-banner" style={{ background: "var(--beige-light)", color: "var(--navy)", border: "1px solid var(--gold)", marginBottom: "1rem" }}>
              Updating: {targetUpdatingResume.name}
            </div>
          )}

          {/* Role input group */}
          <div className="role-input-group">
            <label htmlFor="target-role">Target Job Title / Role</label>
            <input
              id="target-role"
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Drag & drop box */}
          <div
            className={`dropzone-box ${dragActive ? "drag-active" : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              disabled={isUploading}
            />

            <div className="dropzone-icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            <p className="dropzone-title">Drop your resume PDF</p>
            <p className="dropzone-sub">or click to browse &nbsp;·&nbsp; max 5 MB</p>

            {selectedFile && (
              <div className="selected-file-banner">
                Selected: {selectedFile.name}
              </div>
            )}
          </div>

          {uploadError && <p className="error-text">{uploadError}</p>}

          <button
            className="btn-upload-submit"
            disabled={!selectedFile || isUploading}
            onClick={handleUploadSubmit}
          >
            {isUploading ? "Analyzing..." : (queryResumeId ? "Roast New Version" : "Roast Resume")}
          </button>

          {queryResumeId && !isUploading && (
            <button 
              className="btn-upload-submit" 
              style={{ background: "transparent", color: "var(--navy)", border: "1px solid var(--border)", marginTop: "0.5rem" }}
              onClick={() => navigate("/resumes")}
            >
              Cancel Version Update
            </button>
          )}
        </motion.div>

        {/* Right Side: Resumes Stack */}
        <div className="resumes-list-stack">
          {loading && resumes.length > 0 ? (
            <p className="resumes-empty">Loading resumes...</p>
          ) : filtered.length === 0 ? (
            <div className="resumes-empty" style={{ background: "#ffffff", padding: "3rem 1rem", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.04)" }}>
              No resumes found. Try uploading one on the left!
            </div>
          ) : (
            filtered.map((resume) => {
              const latestVer = resume.versions[resume.versions.length - 1];
              return (
                <motion.div
                  key={resume._id}
                  className="resume-item-card"
                  variants={fadeUpItem}
                  whileHover={cardHover}
                  onClick={() => handleOpen(resume)}
                >
                  <div className="item-icon-square">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="8" y1="13" x2="16" y2="13" />
                    </svg>
                  </div>

                  <div className="item-info">
                    <span className="item-name">{resume.name.replace(/\.[^.]+$/, "")}</span>
                    <span className="item-date">
                      Updated {new Date(resume.updatedAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>

                  <span className="item-badge-count">
                    🗂 {resume.versions?.length || 1} {resume.versions?.length === 1 ? "version" : "versions"}
                  </span>

                  <button
                    className="item-btn-delete"
                    title="Delete resume"
                    onClick={(e) => handleDelete(resume._id, e)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>

                  <span className="item-chevron">›</span>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* ===== DETAILED REPORT SLIDE-OVER MODAL ===== */}
      {selectedResume && (
        <div className="dash-modal-overlay" onClick={() => setSelectedResume(null)}>
          <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="dash-modal-close" onClick={() => setSelectedResume(null)}>✕</button>
            <h2 className="dash-modal-title" title={selectedResume.name}>
              {selectedResume.name.replace(/\.[^.]+$/, "")}
            </h2>

            {/* Version Selection Row */}
            <div className="version-select-row">
              {selectedResume.versions.map((ver) => (
                <button
                  key={ver.versionNumber}
                  className={`version-pill ${activeVersionNumber === ver.versionNumber ? "active" : ""}`}
                  onClick={() => setActiveVersionNumber(ver.versionNumber)}
                >
                  V{ver.versionNumber} ({ver.overallScore}%)
                </button>
              ))}

              <button
                className="btn-add-version"
                onClick={() => {
                  setSelectedResume(null);
                  navigate(`/resumes?resumeId=${selectedResume._id}`);
                }}
              >
                ＋ New Version
              </button>
            </div>

            {activeVersion && (
              <div className="modal-details-grid">
                {/* Left Side: Score & Breakdown */}
                <div className="modal-scores-pane">
                  <span className="modal-score-lbl">Overall Score</span>
                  <span className="modal-score-num">{activeVersion.overallScore}%</span>
                  <span className="modal-score-lbl" style={{ marginTop: "1rem" }}>ATS Score</span>
                  <span className="modal-score-num" style={{ fontSize: "2rem", color: "var(--gold)" }}>
                    {activeVersion.atsScore}%
                  </span>

                  {/* Comparative Model Scores Comparison Badge */}
                  {activeVersion.modelScores && (
                    <div style={{ marginTop: "1.25rem", width: "100%", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "1.25rem" }}>
                      <span className="modal-score-lbl" style={{ fontSize: "0.65rem", display: "block", marginBottom: "0.6rem", letterSpacing: "0.5px" }}>Model Comparisons</span>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.4rem" }}>
                        <div style={{ background: "rgba(31, 42, 68, 0.03)", border: "1px solid rgba(31, 42, 68, 0.05)", padding: "0.4rem 0.2rem", borderRadius: "8px", flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>Gemini</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>{activeVersion.modelScores.gemini}%</div>
                        </div>
                        <div style={{ background: "rgba(31, 42, 68, 0.03)", border: "1px solid rgba(31, 42, 68, 0.05)", padding: "0.4rem 0.2rem", borderRadius: "8px", flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>Groq</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>{activeVersion.modelScores.groq}%</div>
                        </div>
                        <div style={{ background: "rgba(31, 42, 68, 0.03)", border: "1px solid rgba(31, 42, 68, 0.05)", padding: "0.4rem 0.2rem", borderRadius: "8px", flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>Mistral</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>{activeVersion.modelScores.mistral}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress bars */}
                  <div style={{ width: "100%", marginTop: "1.5rem", textAlign: "left" }}>
                    {[
                      { label: "Keywords", key: "keywords" },
                      { label: "Formatting", key: "format" },
                      { label: "Impact", key: "impact" },
                      { label: "Readability", key: "readability" }
                    ].map(({ label, key }) => (
                      <div key={key} style={{ marginBottom: "0.8rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          <span>{label}</span>
                          <span>{activeVersion.breakdown?.[key] ?? 50}%</span>
                        </div>
                        <div style={{ height: "6px", width: "100%", backgroundColor: "rgba(31,42,68,0.06)", borderRadius: "3px", marginTop: "0.2rem" }}>
                          <div style={{ height: "100%", width: `${activeVersion.breakdown?.[key] ?? 50}%`, backgroundColor: "var(--navy)", borderRadius: "3px" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side: AI Feedback Details */}
                <div className="modal-analysis-pane">
                  <div className="modal-feedback-box" style={{ marginTop: 0 }}>
                    <h4>🎯 Target Role</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 700, margin: "0.2rem 0 0 0" }}>
                      {activeVersion.targetRole}
                    </p>
                  </div>

                  <div className="modal-feedback-box" style={{ marginTop: 0 }}>
                    <h4>💪 core strengths</h4>
                    <ul className="modal-feedback-list">
                      {activeVersion.strengths?.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="modal-feedback-box" style={{ marginTop: 0 }}>
                    <h4>📈 areas to improve</h4>
                    <ul className="modal-feedback-list">
                      {activeVersion.improvements?.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="modal-feedback-box" style={{ marginTop: 0 }}>
                    <h4>🔍 missing keyword gaps</h4>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                      {activeVersion.keywordGaps?.map((gap, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            backgroundColor: "var(--beige-light)",
                            color: "var(--navy)",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "99px"
                          }}
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bullet Rewrites comparison */}
            {activeVersion && activeVersion.beforeAfterRewrites?.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", color: "var(--navy)", fontSize: "1.1rem", marginBottom: "1.1rem" }}>
                  Before & After Bullet Rewrites
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {activeVersion.beforeAfterRewrites.map((rewrite, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1.25rem",
                        backgroundColor: "var(--bg-secondary, #faf9f6)",
                        padding: "1.25rem",
                        borderRadius: "12px",
                        border: "1px solid rgba(0,0,0,0.03)"
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", color: "#e53e6d", display: "block", marginBottom: "0.35rem" }}>
                          Original
                        </span>
                        <p style={{ fontSize: "0.75rem", margin: 0, textDecoration: "line-through", color: "var(--text-secondary)" }}>
                          {rewrite.before}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", color: "#C6A75E", display: "block", marginBottom: "0.35rem" }}>
                          Roaster Rewrite
                        </span>
                        <p style={{ fontSize: "0.75rem", margin: 0, color: "var(--navy)", fontWeight: 600 }}>
                          {rewrite.after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== FULL-SCREEN LOADING POPUP OVERLAY ===== */}
      {isUploading && (
        <div className="uploader-loading-overlay">
          <div className="uploader-loading-card">
            <div className="loading-pulse-container">
              <div className="pulse-circle"></div>
              <div className="spinner-ring"></div>
            </div>
            
            <h3>Analyzing Resume</h3>
            <p className="sub-title">Running multi-model consensus parsing...</p>

            <div className="stages-checklist">
              {UPLOADER_PHASES.map((phase, idx) => {
                const isCompleted = uploadPhaseIdx > idx;
                const isActive = uploadPhaseIdx === idx;
                const isPending = uploadPhaseIdx < idx;
                return (
                  <div key={idx} className={`stage-row ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""} ${isPending ? "pending" : ""}`}>
                    <span className="stage-icon">
                      {isCompleted ? "✓" : (isActive ? "→" : "•")}
                    </span>
                    <span className="stage-text">{phase}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Resumes;
