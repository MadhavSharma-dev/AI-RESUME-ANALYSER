import React from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardModal.css";

export function DashboardModal({ isOpen, onClose, type, data, title }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigate = (resumeId) => {
    onClose();
    if (resumeId) {
      navigate(`/resumes/${resumeId}`);
    } else {
      navigate("/resumes");
    }
  };

  return (
    <div className="dash-modal-backdrop" onClick={onClose}>
      <div className="dash-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="dash-modal-header">
          <div>
            <h2 className="dash-modal-title">{title || "Roaster Insights Detail"}</h2>
            <p className="dash-modal-subtitle">Live breakdown from your resume roasts</p>
          </div>
          <button className="dash-modal-close-btn" onClick={onClose}>✕</button>
        </header>

        <div className="dash-modal-body">
          {/* ATS SCORE BREAKDOWN MODAL */}
          {type === "ats" && (
            <div className="modal-section">
              <p className="modal-desc">Detailed ATS score breakdown across your analyzed resume versions:</p>
              <div className="modal-list">
                {data?.trends?.length > 0 ? (
                  data.trends.map((item, idx) => (
                    <div className="modal-list-card" key={idx}>
                      <div className="mlc-left">
                        <span className="mlc-title">{item.resumeName}</span>
                        <span className="mlc-sub">V{item.versionNumber} • {item.targetRole || "General Role"} • {new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <div className="mlc-right">
                        <span className="mlc-score">{item.atsScore}% ATS</span>
                        <button className="mlc-btn" onClick={() => handleNavigate(item.resumeId)}>View Roast ↗</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-modal-text">No analyses found yet. Upload a resume to start roasting!</p>
                )}
              </div>
            </div>
          )}

          {/* VERSIONS LIST MODAL */}
          {type === "versions" && (
            <div className="modal-section">
              <p className="modal-desc">All version iterations across your active resumes:</p>
              <div className="modal-list">
                {data?.versionsList?.length > 0 ? (
                  data.versionsList.map((ver, idx) => (
                    <div className="modal-list-card" key={idx}>
                      <div className="mlc-left">
                        <span className="mlc-title">{ver.resumeName} (V{ver.versionNumber})</span>
                        <span className="mlc-sub">Target: {ver.targetRole || "General"} • Uploaded {new Date(ver.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mlc-right">
                        <button className="mlc-btn" onClick={() => handleNavigate(ver.resumeId)}>Jump to Version ↗</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-modal-text">No versions logged yet. Time to drop your first PDF!</p>
                )}
              </div>
            </div>
          )}

          {/* ISSUES IDENTIFIED MODAL */}
          {type === "issues" && (
            <div className="modal-section">
              <p className="modal-desc">Flaws flagged across your recent resume roasts:</p>
              <div className="modal-issues-list">
                {data?.allIssues?.length > 0 ? (
                  data.allIssues.map((issue, idx) => (
                    <div className="modal-issue-card" key={idx}>
                      <div className="mic-header">
                        <span className={`severity-tag ${issue.severity}`}>{issue.severity}</span>
                        <h4 className="mic-title">{issue.title}</h4>
                      </div>
                      <p className="mic-desc">{issue.description}</p>
                      {issue.fix && (
                        <div className="mic-fix">
                          <strong>Fix Suggestion:</strong> {issue.fix}
                        </div>
                      )}
                      <span className="mic-meta">Flagged on {issue.resumeName} (V{issue.versionNumber})</span>
                    </div>
                  ))
                ) : (
                  <p className="empty-modal-text">No critical flaws detected! Your resumes are looking razor sharp.</p>
                )}
              </div>
            </div>
          )}

          {/* KEYWORDS MATCHED MODAL */}
          {type === "keywords" && (
            <div className="modal-section">
              <div className="kw-split-grid">
                <div className="kw-pane">
                  <h4 className="kw-pane-title green">✓ Matched Keywords ({data?.keywords?.matched?.length || 0})</h4>
                  <div className="kw-chips">
                    {data?.keywords?.matched?.map((kw, idx) => (
                      <span className="kw-chip matched" key={idx}>{kw}</span>
                    ))}
                    {(!data?.keywords?.matched || data.keywords.matched.length === 0) && (
                      <span className="empty-modal-text">No matched keywords extracted yet.</span>
                    )}
                  </div>
                </div>
                <div className="kw-pane">
                  <h4 className="kw-pane-title red">✗ Missing Keywords ({data?.keywords?.missing?.length || 0})</h4>
                  <div className="kw-chips">
                    {data?.keywords?.missing?.map((kw, idx) => (
                      <span className="kw-chip missing" key={idx}>{kw}</span>
                    ))}
                    {(!data?.keywords?.missing || data.keywords.missing.length === 0) && (
                      <span className="empty-modal-text">No missing keywords gaps found!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SINGLE POINT DETAIL MODAL */}
          {type === "point" && data?.point && (
            <div className="modal-section">
              <div className="modal-point-card">
                <div className="mpc-score-badge">{data.point.atsScore}% ATS</div>
                <h3>{data.point.resumeName}</h3>
                <p><strong>Version:</strong> V{data.point.versionNumber}</p>
                <p><strong>Target Role:</strong> {data.point.targetRole || "General"}</p>
                <p><strong>Analyzed On:</strong> {new Date(data.point.date).toLocaleString()}</p>
                <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={() => handleNavigate(data.point.resumeId)}>
                  Open This Analysis ↗
                </button>
              </div>
            </div>
          )}

          {/* PROFILE / ACCOUNT DETAILS MODAL */}
          {type === "profile" && (
            <div className="modal-section">
              <div className="modal-point-card">
                <h3>{data?.user?.name || "Candidate"}</h3>
                <p><strong>Email:</strong> {data?.user?.email}</p>
                <p><strong>Account Tier:</strong> Pro Plan (Unlimited Roasts)</p>
                <p><strong>Total Resumes:</strong> {data?.resumesCount || 0}</p>
                <p><strong>Total Iterations:</strong> {data?.versionsCount || 0}</p>
                <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={() => handleNavigate()}>
                  Manage Resumes ↗
                </button>
              </div>
            </div>
          )}

          {/* ACTIVITY FEED MODAL */}
          {type === "activity" && (
            <div className="modal-section">
              <p className="modal-desc">Complete activity timeline of uploads and roasts:</p>
              <div className="modal-list">
                {data?.displayActivity?.map((act, idx) => (
                  <div className="modal-list-card" key={idx}>
                    <div className="mlc-left">
                      <span className="mlc-title">{act.resumeName}</span>
                      <span className="mlc-sub">{act.type.toUpperCase()} • {new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                    {act.atsScore != null && (
                      <div className="mlc-right">
                        <span className="mlc-score">{act.atsScore}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
