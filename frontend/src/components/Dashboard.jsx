import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Dashboard({ handleLogout, user, resumes, setResumes }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  const handleDelete = (id) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
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
              placeholder="Search resumes, keywords, rewrites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="dash-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <button className="dash-icon-btn" title="Dark mode">🌙</button>
          <button className="dash-icon-btn" title="Notifications">🔔</button>
          <button className="dash-icon-btn dash-icon-btn--logout" title="Logout" onClick={onLogout}>🚪</button>
        </div>
      </div>

      {/* ── Section heading ── */}
      <div className="dash-section-heading">
        <h2>Your Resumes</h2>
        <p>Upload a new one or pick up where you left off.</p>
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
          {filtered.length === 0 && (
            <p className="dash-empty">No resumes yet. Upload one to get started.</p>
          )}
          {filtered.map((resume) => (
            <div key={resume.id} className="dash-resume-item">
              <div className="dash-resume-file-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="2" width="12" height="16" rx="2" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1.4" />
                  <path d="M8 7h6M8 10h6M8 13h4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M14 2v4h4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="dash-resume-info">
                <span className="dash-resume-name">{resume.name}</span>
                <span className="dash-resume-date">Updated {resume.updated}</span>
              </div>
              <div className="dash-resume-meta">
                <span className="dash-resume-versions">
                  🗂 {resume.versions} {resume.versions === 1 ? "version" : "versions"}
                </span>
                <button
                  className="dash-icon-btn dash-delete-btn"
                  title="Delete"
                  onClick={() => handleDelete(resume.id)}
                >🗑</button>
                <button className="dash-icon-btn dash-chevron-btn" title="Open">›</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
