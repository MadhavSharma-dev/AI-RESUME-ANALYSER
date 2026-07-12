import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchResumesList, removeResume } from "../lib/api";
import "./Resumes.css";

function scoreColor(score) {
  if (score >= 80) return "#288c52";
  if (score >= 60) return "#d4881a";
  return "#e53e6d";
}

function Resumes() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedResume, setSelectedResume] = useState(null);
  const [activeVersionNumber, setActiveVersionNumber] = useState(1);

  useEffect(() => {
    fetchResumesList()
      .then(setResumes)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this resume and all its history? This cannot be undone.")) {
      removeResume(id)
        .then(() => {
          setResumes((prev) => prev.filter((r) => r._id !== id));
          if (selectedResume?._id === id) setSelectedResume(null);
        })
        .catch((err) => alert(err.message || "Failed to delete"));
    }
  };

  const handleOpen = (resume) => {
    setSelectedResume(resume);
    setActiveVersionNumber(resume.versions.length);
  };

  const filtered = resumes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.versions.some((v) => v.targetRole?.toLowerCase().includes(search.toLowerCase()))
  );

  const activeVersion = selectedResume?.versions.find(
    (v) => v.versionNumber === activeVersionNumber
  ) || selectedResume?.versions[selectedResume.versions.length - 1];

  return (
    <div className="resumes-page">
      {/* Header */}
      <div className="resumes-header">
        <div>
          <h1 className="resumes-title">My Resumes</h1>
          <p className="resumes-sub">All your uploaded resumes and their AI analysis results.</p>
        </div>
        <button className="resumes-upload-btn" onClick={() => navigate("/upload")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Upload resume
        </button>
      </div>

      {/* Search */}
      <div className="resumes-search-wrap">
        <svg className="resumes-search-icon" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          className="resumes-search"
          type="text"
          placeholder="Search by name or target role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats row */}
      {!loading && resumes.length > 0 && (
        <div className="resumes-stats">
          <span>{resumes.length} resume{resumes.length !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{resumes.reduce((s, r) => s + r.versions.length, 0)} total versions</span>
          <span>·</span>
          <span>
            Avg ATS:{" "}
            {Math.round(
              resumes.reduce((s, r) => {
                const l = r.versions[r.versions.length - 1];
                return s + (l?.atsScore ?? 0);
              }, 0) / resumes.length
            )}
          </span>
        </div>
      )}

      {/* Resume cards grid */}
      {loading ? (
        <p className="resumes-empty">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="resumes-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>{resumes.length === 0 ? "No resumes yet." : "No results for your search."}</p>
          {resumes.length === 0 && (
            <button className="resumes-upload-btn" onClick={() => navigate("/upload")}>
              Upload your first resume
            </button>
          )}
        </div>
      ) : (
        <div className="resumes-grid">
          {filtered.map((resume) => {
            const latest = resume.versions[resume.versions.length - 1];
            const oldest = resume.versions[0];
            const improvement = latest.atsScore - oldest.atsScore;
            return (
              <div key={resume._id} className="resume-card" onClick={() => handleOpen(resume)}>
                <div className="resume-card-top">
                  <div className="resume-card-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="2" width="12" height="16" rx="2" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1.4" />
                      <path d="M8 7h6M8 10h6M8 13h4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M14 2v4h4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="resume-card-actions">
                    <button
                      className="resume-card-btn resume-card-btn--new"
                      title="Upload new version"
                      onClick={(e) => { e.stopPropagation(); navigate(`/upload?resumeId=${resume._id}`); }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </button>
                    <button
                      className="resume-card-btn resume-card-btn--delete"
                      title="Delete resume"
                      onClick={(e) => handleDelete(resume._id, e)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="resume-card-name">{resume.name.replace(/\.[^.]+$/, "")}</div>
                <div className="resume-card-role">{latest.targetRole}</div>

                {/* Sparkline for ATS across versions */}
                <div className="resume-card-sparkline">
                  {resume.versions.map((v, i) => (
                    <div key={i} className="spark-col">
                      <div
                        className="spark-bar"
                        style={{
                          height: `${Math.max(v.atsScore, 4)}%`,
                          background: i === resume.versions.length - 1
                            ? scoreColor(v.atsScore)
                            : "var(--border)"
                        }}
                        title={`V${v.versionNumber}: ATS ${v.atsScore}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="resume-card-footer">
                  <div className="resume-card-scores">
                    <span style={{ color: scoreColor(latest.atsScore), fontWeight: 800 }}>
                      {latest.atsScore}
                    </span>
                    <span className="resume-card-score-lbl">ATS</span>
                  </div>
                  <div className="resume-card-scores">
                    <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      {latest.overallScore}
                    </span>
                    <span className="resume-card-score-lbl">Overall</span>
                  </div>
                  <div className="resume-card-scores">
                    <span style={{ fontWeight: 800, color: improvement >= 0 ? "#288c52" : "#e53e6d" }}>
                      {improvement >= 0 ? "+" : ""}{improvement}
                    </span>
                    <span className="resume-card-score-lbl">Change</span>
                  </div>
                  <span className="resume-card-versions">
                    {resume.versions.length}v
                  </span>
                </div>

                <div className="resume-card-date">
                  Updated {new Date(resume.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail slide-over panel */}
      {selectedResume && (
        <div className="dash-modal-overlay" onClick={() => setSelectedResume(null)}>
          <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="dash-modal-close" onClick={() => setSelectedResume(null)}>✕</button>
            <h2 className="dash-modal-title" title={selectedResume.name}>
              {selectedResume.name.replace(/\.[^.]+$/, "")}
            </h2>

            <div className="version-select-row">
              {selectedResume.versions.map((ver) => (
                <button
                  key={ver.versionNumber}
                  className={`version-pill ${activeVersionNumber === ver.versionNumber ? "active" : ""}`}
                  onClick={() => setActiveVersionNumber(ver.versionNumber)}
                >
                  V{ver.versionNumber} ({ver.atsScore})
                </button>
              ))}
              <button
                className="btn-add-version"
                onClick={() => navigate(`/upload?resumeId=${selectedResume._id}`)}
              >
                ＋ New Version
              </button>
            </div>

            {activeVersion && (
              <div className="modal-details-grid">
                <div className="modal-scores-pane">
                  <span className="modal-score-lbl">Overall Score</span>
                  <span className="modal-score-num">{activeVersion.overallScore}%</span>
                  <span className="modal-score-lbl" style={{ marginTop: "1rem" }}>ATS Score</span>
                  <span className="modal-score-num" style={{ fontSize: "2rem", color: "var(--gold)" }}>
                    {activeVersion.atsScore}%
                  </span>
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
                        <div style={{ height: "6px", width: "100%", backgroundColor: "var(--accent-light)", borderRadius: "3px", marginTop: "0.2rem" }}>
                          <div style={{ height: "100%", width: `${activeVersion.breakdown?.[key] ?? 50}%`, backgroundColor: "var(--accent)", borderRadius: "3px" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-analysis-pane">
                  <div className="modal-feedback-box" style={{ marginTop: 0 }}>
                    <h4>🎯 Target Role</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 700, margin: "0.2rem 0 0 0" }}>{activeVersion.targetRole}</p>
                  </div>
                  <div className="modal-feedback-box" style={{ marginTop: 0 }}>
                    <h4>💪 Strengths</h4>
                    <ul className="modal-feedback-list">
                      {activeVersion.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="modal-feedback-box" style={{ marginTop: 0 }}>
                    <h4>📈 Improvements</h4>
                    <ul className="modal-feedback-list">
                      {activeVersion.improvements?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="modal-feedback-box" style={{ marginTop: 0 }}>
                    <h4>🔍 Keyword Gaps</h4>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                      {activeVersion.keywordGaps?.map((g, i) => (
                        <span key={i} style={{ fontSize: "0.7rem", fontWeight: 700, background: "var(--accent-light)", color: "var(--text-primary)", padding: "0.25rem 0.6rem", borderRadius: "99px" }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeVersion?.beforeAfterRewrites?.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.1rem", marginBottom: "1rem" }}>
                  Before & After Rewrites
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {activeVersion.beforeAfterRewrites.map((r, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--bg-primary)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                      <div>
                        <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", color: "#e53e6d", display: "block", marginBottom: "0.25rem" }}>Original</span>
                        <p style={{ fontSize: "0.75rem", margin: 0, textDecoration: "line-through", color: "var(--text-secondary)" }}>{r.before}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: "0.25rem" }}>Rewrite</span>
                        <p style={{ fontSize: "0.75rem", margin: 0, color: "var(--text-primary)", fontWeight: 600 }}>{r.after}</p>
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

export default Resumes;
