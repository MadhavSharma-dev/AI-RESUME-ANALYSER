import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "./Dashboard.css";
import { fetchResumesList, fetchActivity } from "../lib/api";

function StatCard({ label, value, sub, color }) {
  return (
    <div className="dash-stat-card">
      <span className="dash-stat-value" style={{ color: color || "var(--text-primary)" }}>{value}</span>
      <span className="dash-stat-label">{label}</span>
      {sub && <span className="dash-stat-sub">{sub}</span>}
    </div>
  );
}

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchResumesList(), fetchActivity()])
      .then(([r, a]) => { setResumes(r); setActivity(a); })
      .catch((err) => console.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : "there";

  // Derived stats
  const totalVersions = resumes.reduce((s, r) => s + r.versions.length, 0);
  const avgAts = resumes.length
    ? Math.round(resumes.reduce((s, r) => {
        const l = r.versions[r.versions.length - 1];
        return s + (l?.atsScore ?? 0);
      }, 0) / resumes.length)
    : 0;
  const bestResume = resumes.reduce((best, r) => {
    const score = r.versions[r.versions.length - 1]?.atsScore ?? 0;
    return score > (best?.score ?? 0) ? { name: r.name, score } : best;
  }, null);
  const recentActivity = activity.slice(0, 5);

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function activityLabel(act) {
    const name = act.resumeName.replace(/\.[^.]+$/, "");
    if (act.type === "upload") return `${name} — V${act.versionNumber} uploaded`;
    if (act.type === "analysis") return `${name} — analysed (ATS ${act.atsScore})`;
    if (act.type === "rewrite") return `${name} — rewrites generated`;
    return name;
  }

  function scoreColor(s) {
    if (s >= 80) return "#288c52";
    if (s >= 60) return "#d4881a";
    return "#e53e6d";
  }

  return (
    <div className="dash-overview-page">
      {/* Greeting */}
      <div className="dash-overview-header">
        <div>
          <h1 className="dash-overview-greeting">Hello, {displayName}.</h1>
          <p className="dash-overview-sub">Here's a snapshot of your resume activity.</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading...</p>
      ) : (
        <>
          {/* Stats row */}
          <div className="dash-stats-row">
            <StatCard label="Resumes" value={resumes.length} sub="uploaded" />
            <StatCard label="Versions" value={totalVersions} sub="total" />
            <StatCard label="Avg ATS Score" value={resumes.length ? avgAts : "—"} sub="across all resumes" color={resumes.length ? scoreColor(avgAts) : undefined} />
            <StatCard label="Best Score" value={bestResume ? bestResume.score : "—"} sub={bestResume ? bestResume.name.replace(/\.[^.]+$/, "").slice(0, 18) : "no resumes yet"} color={bestResume ? scoreColor(bestResume.score) : undefined} />
          </div>

          {/* Quick actions */}
          <div className="dash-overview-section">
            <h2 className="dash-overview-section-title">Quick actions</h2>
            <div className="dash-quick-actions">
              <div className="dash-quick-card" onClick={() => navigate("/upload")}>
                <div className="dash-quick-icon dash-quick-icon--upload">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <span className="dash-quick-label">Upload resume</span>
                <span className="dash-quick-hint">PDF, DOC, DOCX · max 5MB</span>
              </div>

              <div className="dash-quick-card" onClick={() => navigate("/resumes")}>
                <div className="dash-quick-icon dash-quick-icon--resumes">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="12" y2="17" />
                  </svg>
                </div>
                <span className="dash-quick-label">View resumes</span>
                <span className="dash-quick-hint">{resumes.length} resume{resumes.length !== 1 ? "s" : ""} · {totalVersions} version{totalVersions !== 1 ? "s" : ""}</span>
              </div>

              <div className="dash-quick-card" onClick={() => navigate("/history")}>
                <div className="dash-quick-icon dash-quick-icon--history">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 15" />
                  </svg>
                </div>
                <span className="dash-quick-label">Activity history</span>
                <span className="dash-quick-hint">{activity.length} events logged</span>
              </div>

              <div className="dash-quick-card" onClick={() => navigate("/analytics")}>
                <div className="dash-quick-icon dash-quick-icon--analytics">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <span className="dash-quick-label">Analytics</span>
                <span className="dash-quick-hint">Score breakdowns</span>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="dash-overview-section">
            <div className="dash-overview-section-header">
              <h2 className="dash-overview-section-title">Recent activity</h2>
              <button className="dash-see-all" onClick={() => navigate("/history")}>See all →</button>
            </div>

            {recentActivity.length === 0 ? (
              <p className="dash-no-activity">No activity yet. Upload a resume to get started.</p>
            ) : (
              <div className="dash-recent-list">
                {recentActivity.map((act) => (
                  <div key={act._id} className="dash-recent-item">
                    <span className={`dash-recent-dot dash-recent-dot--${act.type}`} />
                    <span className="dash-recent-text">{activityLabel(act)}</span>
                    {act.type === "analysis" && act.atsScore != null && (
                      <span className="dash-recent-score" style={{ background: scoreColor(act.atsScore) }}>
                        {act.atsScore}
                      </span>
                    )}
                    <span className="dash-recent-time">{timeAgo(act.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
