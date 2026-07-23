import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import "./Dashboard.css";
import { fetchActivity, fetchDashboardOverview } from "../../api/dashboard";
import { fetchResumesList } from "../../api/resumes";
import { motion, staggerContainer, fadeUpItem, cardHover } from "../../lib/motion";

import { SparklineBarChart } from "./SparklineBarChart";
import { SparklineLineChart } from "./SparklineLineChart";
import { AtsReadinessGauge } from "./AtsReadinessGauge";
import { ScoreEvolutionChart } from "./ScoreEvolutionChart";
import { DashboardModal } from "./DashboardModal";
import HeaderUtils from "../common/HeaderUtils";

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [activity, setActivity] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    data: null,
    title: ""
  });

  const openModal = (type, customData = null, title = "") => {
    setModalState({
      isOpen: true,
      type,
      data: customData || overview,
      title
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    Promise.all([fetchResumesList(), fetchActivity(), fetchDashboardOverview()])
      .then(([resumesData, activityData, overviewData]) => {
        setResumes(resumesData);
        setActivity(activityData);
        setOverview(overviewData);

        // If there are no resumes in MongoDB, enable Demo Mode automatically
        if (resumesData.length === 0) {
          setIsDemoMode(true);
        }
      })
      .catch((err) => console.error("Dashboard fetch error:", err.message))
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : "there";

  // MOCK DATA for Demo Mode (matches User Screenshots)
  const demoStats = {
    resumesCount: 4,
    versionsCount: 8,
    issuesCount: 5,
    keywordsCount: 15,
    keywordsTotal: 17,
    avgAtsScore: 86,
    scoreChange: 12,
    activeResumeName: "Senior Frontend Engineer Resume",
    recentActivity: [
      { _id: "act-1", type: "analysis", resumeName: "Senior Frontend Engineer Resume", atsScore: 86, createdAt: new Date(Date.now() - 1000 * 60 * 15) },
      { _id: "act-2", type: "upload", resumeName: "Senior Frontend Engineer Resume", versionNumber: 3, createdAt: new Date(Date.now() - 1000 * 60 * 120) },
      { _id: "act-3", type: "analysis", resumeName: "Senior Frontend Engineer Resume", atsScore: 74, createdAt: new Date(Date.now() - 1000 * 60 * 600) },
      { _id: "act-4", type: "upload", resumeName: "Senior Frontend Engineer Resume", versionNumber: 2, createdAt: new Date(Date.now() - 1000 * 60 * 1440) }
    ],
    versionsList: [
      { versionNumber: 1, overallScore: 58, targetRole: "Senior Frontend Engineer", tag: "UPLOAD", change: 0 },
      { versionNumber: 2, overallScore: 74, targetRole: "Senior Frontend Engineer", tag: "REWRITE PASS", change: 16 },
      { versionNumber: 3, overallScore: 86, targetRole: "Senior Frontend Engineer", tag: "REWRITE PASS", change: 12 }
    ]
  };

  const hasResumes = resumes.length > 0;
  const activeResume = hasResumes ? resumes[0] : null;

  // Real or Demo Stats
  const stats = {
    resumesCount: hasResumes ? resumes.length : (isDemoMode ? demoStats.resumesCount : 0),
    versionsCount: hasResumes 
      ? resumes.reduce((acc, r) => acc + r.versions.length, 0) 
      : (isDemoMode ? demoStats.versionsCount : 0),
    issuesCount: hasResumes 
      ? (overview?.allIssues?.length || 0)
      : (isDemoMode ? demoStats.issuesCount : 0),
    keywordsCount: hasResumes 
      ? (overview?.keywords?.matched?.length || 0)
      : (isDemoMode ? demoStats.keywordsCount : 0),
    keywordsTotal: hasResumes 
      ? ((overview?.keywords?.matched?.length || 0) + (overview?.keywords?.missing?.length || 0) || 12)
      : (isDemoMode ? demoStats.keywordsTotal : 0),
    avgAtsScore: hasResumes 
      ? (overview?.bestAtsScore || 0) 
      : (isDemoMode ? demoStats.avgAtsScore : 0),
    scoreChange: hasResumes 
      ? (() => {
          if (!overview?.trends || overview.trends.length < 2) return 0;
          return (overview.trends[overview.trends.length - 1].atsScore || 0) - (overview.trends[0].atsScore || 0);
        })()
      : (isDemoMode ? demoStats.scoreChange : 0),
    activeResumeName: hasResumes ? activeResume.name.replace(/\.[^.]+$/, "") : demoStats.activeResumeName
  };

  const dashboardVersions = hasResumes 
    ? activeResume.versions.map((ver, idx, arr) => ({
        versionNumber: ver.versionNumber,
        overallScore: ver.overallScore || ver.atsScore || 50,
        targetRole: ver.targetRole,
        tag: idx === 0 ? "UPLOAD" : "ROAST REWRITE",
        change: idx === 0 ? 0 : (ver.overallScore || 50) - (arr[idx - 1].overallScore || 50)
      })).slice(-3)
    : demoStats.versionsList;

  const displayActivity = hasResumes 
    ? activity.slice(0, 5) 
    : demoStats.recentActivity;

  // Real-time search filtering across resumes, roles, keywords
  const searchFilteredResumes = search.trim() === "" ? [] : resumes.filter((r) => {
    const query = search.toLowerCase();
    const nameMatch = r.name.toLowerCase().includes(query);
    const roleMatch = r.versions.some((v) => v.targetRole?.toLowerCase().includes(query));
    return nameMatch || roleMatch;
  });

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
    const name = act.resumeName ? act.resumeName.replace(/\.[^.]+$/, "") : "Resume";
    if (act.type === "upload") return `V${act.versionNumber} uploaded for ${name}`;
    if (act.type === "analysis") return `AI Roast complete on ${name}`;
    if (act.type === "rewrite") return `Rewrites applied to ${name}`;
    return name;
  }

  return (
    <div className="dash-overview-page">
      {/* Search Header row */}
      <div className="dash-overview-header">
        <div>
          <h1 className="dash-overview-greeting">Hello, {displayName}.</h1>
          <p className="dash-overview-sub">Sharpen your resume with witty, roast-style AI insights.</p>
        </div>
        <HeaderUtils searchVal={search} onSearchChange={setSearch} />
      </div>

      {isDemoMode && (
        <div className="demo-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--gold)" }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span><strong>Demo Mode Active</strong>: You are viewing placeholder data. Upload a resume PDF to get your actual roasts!</span>
          <button className="demo-banner-btn" onClick={() => navigate("/resumes")}>Upload Resume</button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading your roaster board...</p>
      ) : (
        <>
          {/* Row 1: Summary Cards Grid */}
          <motion.div 
            className="dash-summary-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* 1. ATS Score */}
            <motion.div 
              className="dash-card summary-card" 
              variants={fadeUpItem} 
              whileHover={cardHover}
              onClick={() => openModal("ats", overview, "ATS Score Breakdown Across Roasts")}
              style={{ cursor: "pointer" }}
            >
              <div className="summary-title-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>ATS Score</span>
              </div>
              <span className="summary-num">{stats.avgAtsScore}<span> / 100</span></span>
              <div className="summary-bottom">
                <span className="summary-badge">+{stats.scoreChange}%</span>
                <SparklineBarChart />
              </div>
            </motion.div>

            {/* 2. Versions */}
            <motion.div 
              className="dash-card summary-card" 
              variants={fadeUpItem} 
              whileHover={cardHover}
              onClick={() => openModal("versions", overview, "All Resume Versions")}
              style={{ cursor: "pointer" }}
            >
              <div className="summary-title-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
                <span><span>Versions</span></span>
              </div>
              <span className="summary-num">{stats.versionsCount}</span>
              <div className="summary-bottom">
                <span className="summary-badge" style={{ background: "rgba(0,0,0,0.04)", color: "var(--text-secondary)" }}>Active</span>
                <SparklineLineChart strokeColor="#1F2A44" curveDirection="up" />
              </div>
            </motion.div>

            {/* 3. Issues Identified */}
            <motion.div 
              className="dash-card summary-card" 
              variants={fadeUpItem} 
              whileHover={cardHover}
              onClick={() => openModal("issues", overview, "Top Resume Flaws Flagged")}
              style={{ cursor: "pointer" }}
            >
              <div className="summary-title-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Issues Identified</span>
              </div>
              <span className="summary-num">{stats.issuesCount}</span>
              <div className="summary-bottom">
                <span className="summary-badge" style={{ background: "rgba(0,0,0,0.04)", color: "var(--text-secondary)" }}>+0%</span>
                <SparklineLineChart strokeColor="#e53e6d" curveDirection="down" />
              </div>
            </motion.div>

            {/* 4. Keywords Matched */}
            <motion.div 
              className="dash-card summary-card dark-theme" 
              variants={fadeUpItem} 
              whileHover={cardHover}
              onClick={() => openModal("keywords", overview, "Keywords Match Breakdown")}
              style={{ cursor: "pointer" }}
            >
              <div className="summary-title-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Keywords Matched</span>
              </div>
              <span className="summary-num">{stats.keywordsCount}<span> / {stats.keywordsTotal}</span></span>
              <div className="summary-bottom">
                <span className="summary-badge">+1%</span>
                <SparklineLineChart strokeColor="#ffffff" curveDirection="up" />
              </div>
            </motion.div>
          </motion.div>

          {/* Row 2: Middle Section Grid */}
          <motion.div 
            className="dash-middle-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* 1. Score Evolution Chart */}
            <motion.div className="dash-card" style={{ display: "flex", flexDirection: "column" }} variants={fadeUpItem} whileHover={cardHover}>
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">Score Evolution</h3>
                  <p className="card-sub">Chronological ATS score progression across ALL your roasts</p>
                </div>
                <span className="header-status-badge">On track</span>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1rem" }}>
                <ScoreEvolutionChart 
                  dataPoints={overview?.trends} 
                  onPointClick={(point) => openModal("point", { point }, `Roast Point Detail: ${point.resumeName}`)}
                />
              </div>
            </motion.div>

            {/* 2. ATS Readiness Speedometer */}
            <motion.div 
              className="dash-card" 
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} 
              variants={fadeUpItem} 
              whileHover={cardHover}
              onClick={() => openModal("ats", overview, "Peak ATS Readiness Detail")}
            >
              <div style={{ alignSelf: "flex-start", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 className="card-title">ATS Readiness</h3>
                  <span className="header-status-badge" style={{ fontSize: "0.6rem", padding: "0.15rem 0.5rem" }}>
                    {stats.avgAtsScore >= 80 ? "Excellent" : stats.avgAtsScore >= 60 ? "Good" : "Needs Work"}
                  </span>
                </div>
                <p className="card-sub">Highest ATS score across all your resumes</p>
              </div>

              <div style={{ margin: "1rem 0" }}>
                <AtsReadinessGauge score={stats.avgAtsScore} />
              </div>

              <span className="summary-badge" style={{ fontSize: "0.65rem" }}>
                +{stats.scoreChange} vs first roast
              </span>
            </motion.div>

            {/* 3. Candidate Profile Card */}
            <motion.div 
              className="dash-card" 
              variants={fadeUpItem} 
              whileHover={cardHover}
              onClick={() => openModal("profile", { user, ...stats }, "Candidate Roaster Profile")}
              style={{ cursor: "pointer" }}
            >
              <div className="profile-card-content">
                <div className="profile-avatar-wrap">
                  <div className="profile-avatar-initials" style={{ overflow: "hidden", padding: 0 }}>
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      displayName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="profile-avatar-badge" title="Verified Account">✓</div>
                </div>

                <h3 className="profile-name">{displayName}</h3>
                <span className="profile-email">{user?.email || "candidate@roaster.ai"}</span>
                <span className="profile-plan">Pro plan</span>

                <div className="profile-stats-grid">
                  <div className="profile-stat-item">
                    <span className="profile-stat-lbl">Resumes</span>
                    <span className="profile-stat-val">{stats.resumesCount}</span>
                  </div>
                  <div className="profile-stat-item">
                    <span className="profile-stat-lbl">Rewrites</span>
                    <span className="profile-stat-val">{stats.resumesCount * 2}</span>
                  </div>
                  <div className="profile-stat-item">
                    <span className="profile-stat-lbl">Analyses</span>
                    <span className="profile-stat-val">{overview?.analysesCount || stats.versionsCount}</span>
                  </div>
                </div>

                <div className="profile-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="profile-action-btn primary" onClick={() => navigate("/resumes")}>
                    Upload
                  </button>
                  <button className="profile-action-btn" onClick={() => navigate("/analytics")}>
                    Insights
                  </button>
                </div>
                <span className="profile-footer-text">Member since May 2026</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Row 3: Bottom Section Grid */}
          <motion.div 
            className="dash-bottom-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* 1. Resume Versions iteration journey */}
            <motion.div 
              className="dash-card" 
              variants={fadeUpItem} 
              whileHover={cardHover}
              onClick={() => openModal("versions", overview, "Resume Version History")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-header-row" style={{ marginBottom: "1rem" }}>
                <div>
                  <h3 className="card-title">Resume Versions</h3>
                  <p className="card-sub">Your iteration journey, scored</p>
                </div>
                <button className="dash-see-all" onClick={(e) => { e.stopPropagation(); navigate("/resumes"); }} style={{ border: "none", background: "transparent", color: "var(--navy)", fontWeight: 700, cursor: "pointer" }}>
                  View all ↗
                </button>
              </div>

              {/* Node scroller row */}
              <div className="nodes-scroller-row">
                {dashboardVersions.map((node, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", flex: 1, gap: "0.75rem" }}>
                    <div className={`node-card ${index === dashboardVersions.length - 1 ? "active" : ""}`}>
                      <span className="node-lbl">V{node.versionNumber}</span>
                      <div className="node-icon-circle">
                        {index === 0 ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className="node-score">{node.overallScore}<span>/100</span></span>
                        <span className="node-tag">{node.tag}</span>
                        {node.change > 0 && <span className="node-change-tag">+{node.change} pts</span>}
                      </div>
                    </div>
                    {index < dashboardVersions.length - 1 && <span className="node-arrow">→</span>}
                  </div>
                ))}
              </div>

              {/* Version summary text details */}
              <div className="node-latest-panel">
                <div>
                  <h4 className="node-latest-title" title={stats.activeResumeName}>{stats.activeResumeName}</h4>
                  <p className="node-latest-sub">V{dashboardVersions[dashboardVersions.length - 1]?.versionNumber} · {stats.versionsCount} versions</p>
                </div>
                <div>
                  <span className="node-latest-badge">Since V1 +{stats.scoreChange} pts overall</span>
                </div>
                <button className="node-latest-btn" onClick={(e) => { e.stopPropagation(); if (activeResume) navigate(`/resumes/${activeResume._id}`); else navigate("/resumes"); }}>
                  Open Resume 
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>

              {/* Bottom Trajectory Sparklines */}
              <div className="trajectory-section">
                <span className="trajectory-graph-lbl">Score Trajectory (V1 ➔ V{dashboardVersions[dashboardVersions.length - 1]?.versionNumber})</span>
                <div style={{ height: "45px", marginTop: "0.25rem" }}>
                  <svg viewBox="0 0 400 40" style={{ width: "100%", height: "100%" }}>
                    {(() => {
                      const tPoints = dashboardVersions.map((v, idx) => {
                        const x = dashboardVersions.length === 1 
                          ? 200 
                          : 20 + (idx / (dashboardVersions.length - 1)) * 360;
                        const y = 35 - (v.overallScore / 100) * 25;
                        return { x, y, score: v.overallScore };
                      });
                      const tLineD = tPoints.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                      return (
                        <>
                          {dashboardVersions.length >= 2 && (
                            <path
                              d={tLineD}
                              fill="none"
                              stroke="var(--navy, #1f2a44)"
                              strokeWidth="2"
                            />
                          )}
                          {tPoints.map((p, idx) => (
                            <circle
                              key={idx}
                              cx={p.x}
                              cy={p.y}
                              r="3.5"
                              fill="#C6A75E"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* Progress Tier bar */}
              <div className="tier-progress-section">
                <span className="trajectory-graph-lbl">Tier Progress</span>
                <div className="tier-progress-track">
                  <div className="tier-progress-fill" style={{ width: `${stats.avgAtsScore}%` }}></div>
                </div>
                <div className="tier-progress-ticks">
                  <span className="tier-tick-label">0</span>
                  <span className="tier-tick-label">55</span>
                  <span className="tier-tick-label">70</span>
                  <span className="tier-tick-label">85</span>
                  <span className="tier-tick-label">100</span>
                </div>
              </div>
            </motion.div>

            {/* 2. Activity Feed */}
            <motion.div 
              className="dash-card" 
              variants={fadeUpItem} 
              whileHover={cardHover}
              onClick={() => openModal("activity", { displayActivity }, "Recent Activity Timeline")}
              style={{ cursor: "pointer" }}
            >
              <div className="activity-header">
                <h3 className="card-title" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  Activity
                  <span className="activity-badge">{displayActivity.length}</span>
                </h3>
                <p className="card-sub" style={{ margin: 0 }}>Recent moves across your resumes</p>
              </div>

              <div className="activity-feed-list">
                {displayActivity.map((act) => (
                  <div key={act._id} className="activity-feed-item">
                    <div className="activity-item-icon">
                      {act.type === "upload" ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      ) : act.type === "rewrite" ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      )}
                    </div>
                    <div className="activity-item-desc">
                      <span className="activity-item-title">{activityLabel(act)}</span>
                      <span className="activity-item-sub">
                        {act.type === "upload" ? "PDF format parsed successfully" : act.type === "rewrite" ? "Rewrites applied" : "Multi-model review finished"}
                      </span>
                    </div>
                    {act.type === "analysis" && act.atsScore != null && (
                      <span className="activity-item-score-badge">
                        {act.atsScore}
                      </span>
                    )}
                    <span className="activity-item-time">{timeAgo(act.createdAt)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* DASHBOARD DETAIL OVERLAY MODAL */}
      <DashboardModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        data={modalState.data}
        title={modalState.title}
      />
    </div>
  );
}

export default Dashboard;
