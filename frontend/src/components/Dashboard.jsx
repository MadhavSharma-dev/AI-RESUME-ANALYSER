import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { fetchResumesList, removeResume } from "../lib/api";

function Dashboard({ handleLogout, user }) {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Resume Detail panel state
  const [selectedResume, setSelectedResume] = useState(null);
  const [activeVersionNumber, setActiveVersionNumber] = useState(1);

  useEffect(() => {
    fetchResumesList()
      .then((data) => setResumes(data))
      .catch((err) => console.error("Error loading resumes:", err.message))
      .finally(() => setLoading(false));
  }, []);

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  const handleDelete = (id, e) => {
    e.stopPropagation(); // Avoid opening the detail panel
    if (window.confirm("Are you sure you want to delete this resume?")) {
      removeResume(id)
        .then(() => {
          setResumes((prev) => prev.filter((r) => r._id !== id));
          if (selectedResume && selectedResume._id === id) {
            setSelectedResume(null);
          }
        })
        .catch((err) => alert(err.message || "Failed to delete resume"));
    }
  };

  const handleOpenDetails = (resume) => {
    setSelectedResume(resume);
    // Default to the latest version
    const latestVersion = resume.versions.length;
    setActiveVersionNumber(latestVersion);
  };

  const filtered = resumes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    navigate("/upload");
  };

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : "there";

  const activeVersion = selectedResume?.versions.find(
    (v) => v.versionNumber === activeVersionNumber
  ) || selectedResume?.versions[selectedResume.versions.length - 1];

  return (
    <div className="dash-page">
      {/* ── Top greeting row ── */}
      <div className="dash-toprow">
        <div className="dash-greeting">
          <h1>Hello, {displayName}.</h1>
          <p>Sharpen your resume with calm, focused AI insights.</p>
        </div>
        <div className="dash-toprow-actions">
          <div className="dash-search-wrap">
            <svg className="dash-search-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              className="dash-search"
              type="text"
              placeholder="Search resumes, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="dash-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <button className="dash-icon-btn dash-icon-btn--logout" title="Logout" onClick={onLogout}>🚪</button>
        </div>
      </div>

      {/* ── Section heading ── */}
      <div className="dash-section-heading">
        <h2>Your Resumes</h2>
        <p>Upload a new one or click a resume card to review feedback.</p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="dash-columns">
        {/* Left — upload dropzone */}
        <div
          className={`dash-upload-card ${dragOver ? "drag-active" : ""}`}
          onClick={() => navigate("/upload")}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <p className="dash-upload-label">Upload a resume</p>
          <p className="dash-upload-hint">PDF only. We extract the text and create version V1.</p>
          <div className="dash-dropzone">
            <div className="dash-drop-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" fill="var(--accent-light)" />
                <path d="M24 32V20M24 20L19 25M24 20L29 25" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="dash-drop-text">Drop your resume PDF</p>
            <p className="dash-drop-sub">or click to browse &nbsp;·&nbsp; max 5 MB &nbsp;·&nbsp; PDF only</p>
          </div>
        </div>

        {/* Right — resume list */}
        <div className="dash-resume-list">
          {loading ? (
            <p className="dash-empty">Loading your resumes...</p>
          ) : filtered.length === 0 ? (
            <p className="dash-empty">No resumes yet. Upload one to get started.</p>
          ) : (
            filtered.map((resume) => {
              const latestVer = resume.versions[resume.versions.length - 1];
              return (
                <div
                  key={resume._id}
                  className="dash-resume-item"
                  onClick={() => handleOpenDetails(resume)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="dash-resume-file-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="2" width="12" height="16" rx="2" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1.4" />
                      <path d="M8 7h6M8 10h6M8 13h4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M14 2v4h4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="dash-resume-info">
                    <span className="dash-resume-name">{resume.name}</span>
                    <span className="dash-resume-date">
                      Updated {new Date(resume.updatedAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="dash-resume-meta">
                    <span className="dash-resume-versions">
                      🗂 {resume.versions?.length || 1} {resume.versions?.length === 1 ? "version" : "versions"}
                    </span>
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: "var(--beige-light)",
                        color: "var(--navy)"
                      }}
                    >
                      {latestVer?.overallScore || 0}%
                    </span>
                    <button
                      className="dash-icon-btn dash-delete-btn"
                      title="Delete"
                      onClick={(e) => handleDelete(resume._id, e)}
                    >
                      🗑
                    </button>
                    <button className="dash-icon-btn dash-chevron-btn" title="Open">›</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== DETAILED REPORT SLIDE-OVER MODAL ===== */}
      {selectedResume && (
        <div className="dash-modal-overlay" onClick={() => setSelectedResume(null)}>
          <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="dash-modal-close" onClick={() => setSelectedResume(null)}>✕</button>
            <h2 className="dash-modal-title" title={selectedResume.name}>
              {selectedResume.name}
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
                onClick={() => navigate(`/upload?resumeId=${selectedResume._id}`)}
              >
                ＋ Upload New Version
              </button>
            </div>

            {activeVersion && (
              <div className="modal-details-grid">
                {/* Left Side: Score & Breakdown */}
                <div className="modal-scores-pane">
                  <span className="modal-score-lbl">Overall Score</span>
                  <span className="modal-score-num">{activeVersion.overallScore}%</span>
                  <span className="modal-score-lbl" style={{ marginTop: "1rem" }}>ATS Compatibility</span>
                  <span className="modal-score-num" style={{ fontSize: "2rem", color: "var(--gold)" }}>
                    {activeVersion.atsScore}%
                  </span>

                  {/* Progress bars */}
                  <div style={{ width: "100%", marginTop: "1.5rem", textAlign: "left" }}>
                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)" }}>
                        <span>Keywords Match</span>
                        <span>{activeVersion.breakdown?.keywords || 50}%</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", backgroundColor: "rgba(31,42,68,0.08)", borderRadius: "3px", marginTop: "0.2rem" }}>
                        <div style={{ height: "100%", width: `${activeVersion.breakdown?.keywords || 50}%`, backgroundColor: "var(--navy)", borderRadius: "3px" }}></div>
                      </div>
                    </div>
                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)" }}>
                        <span>Formatting</span>
                        <span>{activeVersion.breakdown?.format || 50}%</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", backgroundColor: "rgba(31,42,68,0.08)", borderRadius: "3px", marginTop: "0.2rem" }}>
                        <div style={{ height: "100%", width: `${activeVersion.breakdown?.format || 50}%`, backgroundColor: "var(--navy)", borderRadius: "3px" }}></div>
                      </div>
                    </div>
                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)" }}>
                        <span>Impact & Scope</span>
                        <span>{activeVersion.breakdown?.impact || 50}%</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", backgroundColor: "rgba(31,42,68,0.08)", borderRadius: "3px", marginTop: "0.2rem" }}>
                        <div style={{ height: "100%", width: `${activeVersion.breakdown?.impact || 50}%`, backgroundColor: "var(--navy)", borderRadius: "3px" }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)" }}>
                        <span>Readability</span>
                        <span>{activeVersion.breakdown?.readability || 50}%</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", backgroundColor: "rgba(31,42,68,0.08)", borderRadius: "3px", marginTop: "0.2rem" }}>
                        <div style={{ height: "100%", width: `${activeVersion.breakdown?.readability || 50}%`, backgroundColor: "var(--navy)", borderRadius: "3px" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: AI Feedback Details */}
                <div className="modal-analysis-pane">
                  <div className="modal-feedback-box" style={{ marginTop: 0 }}>
                    <h4>🎯 Target Job Role</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--navy)", fontWeight: 700, margin: "0.2rem 0 0 0" }}>
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
              <div style={{ marginTop: "1rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", color: "var(--navy)", fontSize: "1.1rem", marginBottom: "1rem" }}>
                  Before & After Bullet Rewrites
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {activeVersion.beforeAfterRewrites.map((rewrite, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                        backgroundColor: "var(--bg-secondary)",
                        padding: "1rem",
                        borderRadius: "12px",
                        border: "1px solid var(--border)"
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", color: "#e53e6d", display: "block", marginBottom: "0.25rem" }}>
                          Original
                        </span>
                        <p style={{ fontSize: "0.75rem", margin: 0, textDecoration: "line-through", color: "var(--text-secondary)" }}>
                          {rewrite.before}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: "0.25rem" }}>
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
    </div>
  );
}

export default Dashboard;
