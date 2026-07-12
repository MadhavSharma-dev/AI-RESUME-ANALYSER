import { useState, useEffect } from "react";
import { fetchResumesList } from "../lib/api";
import "./Analytics.css";

function ScoreBar({ label, value, color }) {
  return (
    <div className="ana-bar-row">
      <span className="ana-bar-label">{label}</span>
      <div className="ana-bar-track">
        <div
          className="ana-bar-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="ana-bar-value">{value}</span>
    </div>
  );
}

function ResumeCard({ resume }) {
  const latest = resume.versions[resume.versions.length - 1];
  const oldest = resume.versions[0];
  const improvement = latest.atsScore - oldest.atsScore;

  return (
    <div className="ana-card">
      <div className="ana-card-header">
        <div className="ana-card-name">{resume.name.replace(/\.[^.]+$/, "")}</div>
        <div className="ana-card-meta">
          {resume.versions.length} version{resume.versions.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Score sparkline */}
      <div className="ana-sparkline">
        {resume.versions.map((v, i) => (
          <div key={i} className="ana-spark-col">
            <div
              className="ana-spark-bar"
              style={{
                height: `${v.atsScore}%`,
                background: v.versionNumber === latest.versionNumber
                  ? "var(--navy, #1f2a44)"
                  : "rgba(31,42,68,0.15)"
              }}
              title={`V${v.versionNumber}: ${v.atsScore}`}
            />
            <span className="ana-spark-label">V{v.versionNumber}</span>
          </div>
        ))}
      </div>

      {/* Scores */}
      <div className="ana-scores">
        <div className="ana-score-item">
          <span className="ana-score-num" style={{ color: "var(--navy, #1f2a44)" }}>
            {latest.atsScore}
          </span>
          <span className="ana-score-lbl">ATS Score</span>
        </div>
        <div className="ana-score-item">
          <span className="ana-score-num" style={{ color: "var(--gold, #c89f3c)" }}>
            {latest.overallScore}
          </span>
          <span className="ana-score-lbl">Overall</span>
        </div>
        <div className="ana-score-item">
          <span
            className="ana-score-num"
            style={{ color: improvement >= 0 ? "#288c52" : "#e53e6d" }}
          >
            {improvement >= 0 ? "+" : ""}{improvement}
          </span>
          <span className="ana-score-lbl">Change</span>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="ana-breakdown">
        <ScoreBar label="Keywords" value={latest.breakdown?.keywords ?? 0} color="#1f2a44" />
        <ScoreBar label="Format" value={latest.breakdown?.format ?? 0} color="#288c52" />
        <ScoreBar label="Impact" value={latest.breakdown?.impact ?? 0} color="#d4881a" />
        <ScoreBar label="Readability" value={latest.breakdown?.readability ?? 0} color="#5b77c9" />
      </div>

      <div className="ana-role">
        <span>Target role:</span> {latest.targetRole}
      </div>
    </div>
  );
}

function Analytics({ user }) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumesList()
      .then(setResumes)
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const avgAts = resumes.length
    ? Math.round(
        resumes.reduce((sum, r) => {
          const latest = r.versions[r.versions.length - 1];
          return sum + (latest?.atsScore ?? 0);
        }, 0) / resumes.length
      )
    : 0;

  const totalVersions = resumes.reduce((sum, r) => sum + r.versions.length, 0);

  return (
    <div className="ana-page">
      <div className="ana-header">
        <h1 className="ana-title">Analytics</h1>
        <p className="ana-sub">Performance breakdown across all your resumes.</p>
      </div>

      {/* Summary stat pills */}
      <div className="ana-stats-row">
        <div className="ana-stat">
          <span className="ana-stat-num">{resumes.length}</span>
          <span className="ana-stat-lbl">Resumes</span>
        </div>
        <div className="ana-stat">
          <span className="ana-stat-num">{totalVersions}</span>
          <span className="ana-stat-lbl">Versions</span>
        </div>
        <div className="ana-stat">
          <span className="ana-stat-num">{avgAts}</span>
          <span className="ana-stat-lbl">Avg ATS Score</span>
        </div>
      </div>

      {loading ? (
        <p className="ana-empty">Loading analytics...</p>
      ) : resumes.length === 0 ? (
        <p className="ana-empty">Upload a resume to see analytics here.</p>
      ) : (
        <div className="ana-grid">
          {resumes.map((r) => (
            <ResumeCard key={r._id} resume={r} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Analytics;
