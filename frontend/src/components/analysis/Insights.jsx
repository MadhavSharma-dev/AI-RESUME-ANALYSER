import { useState, useEffect } from "react";
import { fetchResumesList } from "../../api/resumes";
import { motion, staggerContainer, fadeUpItem, cardHover } from "../../lib/motion";
import HeaderUtils from "../common/HeaderUtils";
import "./Insights.css";

import { ChronologicalScoreTrend } from "./ChronologicalScoreTrend";

function Analytics({ user }) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    fetchResumesList()
      .then((data) => {
        setResumes(data);
        if (data.length === 0) {
          setIsDemoMode(true);
        }
      })
      .catch((err) => console.error("Error fetching resumes:", err.message))
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : "there";

  // MOCK DATA for Demo Mode (matches User Screenshots 4 & 5)
  const demoData = {
    avgAtsScore: 72,
    bestScore: 86,
    bestResumeName: "Senior Frontend Engineer Resume",
    totalAnalyses: 10,
    trendsList: [71, 80, 63, 79, 58, 72, 81, 60, 64, 80],
    recurringIssues: [
      { title: "Generic professional summary", severity: "medium", count: 2 },
      { title: "Management bullets read generic", severity: "high", count: 1 },
      { title: "Missing hiring impact", severity: "high", count: 1 },
      { title: "No team size or velocity claims", severity: "medium", count: 1 },
      { title: "Skills overlap with IC role", severity: "low", count: 1 },
      { title: "Summary doesn't claim a managerial specialty", severity: "low", count: 1 }
    ],
    missedKeywords: [
      { name: "Kubernetes", count: 3 },
      { name: "GraphQL", count: 3 },
      { name: "Design Systems", count: 3 },
      { name: "Calibration", count: 2 },
      { name: "OKRs", count: 2 },
      { name: "Engineering Culture", count: 2 },
      { name: "OpenTelemetry", count: 3 },
      { name: "CI/CD", count: 2 },
      { name: "Distributed Systems", count: 2 },
      { name: "Microservices", count: 2 },
      { name: "gRPC", count: 2 },
      { name: "Performance Optimization", count: 2 }
    ],
    keywordAnchors: [
      { name: "React", count: 10 },
      { name: "Node.js", count: 9 },
      { name: "TypeScript", count: 7 },
      { name: "AWS", count: 4 },
      { name: "JavaScript", count: 4 },
      { name: "GraphQL", count: 3 },
      { name: "Tailwind CSS", count: 3 },
      { name: "Software Engineer", count: 3 },
      { name: "Firebase", count: 3 },
      { name: "Roadmapping", count: 2 },
      { name: "Postgres", count: 2 },
      { name: "Redis", count: 2 }
    ],
    byResume: [
      { name: "Senior Frontend Engineer Resume", latest: 86, best: 86, change: 28, analyses: 3 },
      { name: "Engineering Manager Resume", latest: 83, best: 83, change: 12, analyses: 2 },
      { name: "AlexResume", latest: 82, best: 82, change: 22, analyses: 3 },
      { name: "Full Stack Engineer Resume", latest: 79, best: 79, change: 15, analyses: 2 }
    ]
  };

  // Derive metrics dynamically
  const hasResumes = resumes.length > 0;

  const summary = {
    avgAtsScore: hasResumes
      ? Math.round(resumes.reduce((acc, r) => acc + (r.versions[r.versions.length - 1]?.atsScore || 0), 0) / resumes.length)
      : demoData.avgAtsScore,
    bestScore: hasResumes
      ? resumes.reduce((max, r) => {
          const m = Math.max(...r.versions.map(v => v.atsScore));
          return m > max ? m : max;
        }, 0)
      : demoData.bestScore,
    bestResumeName: hasResumes
      ? (() => {
          let best = { name: "Resume", score: 0 };
          resumes.forEach((r) => {
            const m = Math.max(...r.versions.map(v => v.atsScore));
            if (m > best.score) {
              best = { name: r.name.replace(/\.[^.]+$/, ""), score: m };
            }
          });
          return best.name;
        })()
      : demoData.bestResumeName,
    totalAnalyses: hasResumes
      ? resumes.reduce((acc, r) => acc + r.versions.length, 0)
      : demoData.totalAnalyses
  };

  // Compile chronological trends from DB
  const trends = hasResumes
    ? (() => {
        const allVersions = [];
        resumes.forEach(r => {
          (r.versions || []).forEach(v => {
            allVersions.push({ score: v.atsScore, date: new Date(v.createdAt) });
          });
        });
        // Sort chronologically
        allVersions.sort((a, b) => a.date - b.date);
        return allVersions.map(v => v.score);
      })()
    : demoData.trendsList;

  // Compile Recurring Issues from DB
  const recurringIssues = hasResumes
    ? (() => {
        const issuesMap = {};
        resumes.forEach(r => {
          (r.versions || []).forEach(v => {
            (v.improvements || []).forEach(imp => {
              issuesMap[imp] = (issuesMap[imp] || 0) + 1;
            });
          });
        });
        return Object.entries(issuesMap)
          .map(([title, count]) => {
            // Assign dummy severity for visualization
            let severity = "low";
            if (title.toLowerCase().includes("quantify") || title.toLowerCase().includes("metric")) {
              severity = "high";
            } else if (title.toLowerCase().includes("structure") || title.toLowerCase().includes("format")) {
              severity = "medium";
            }
            return { title, severity, count };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
      })()
    : demoData.recurringIssues;

  // Compile Missed Keywords from DB
  const missedKeywords = hasResumes
    ? (() => {
        const keywordsMap = {};
        resumes.forEach(r => {
          (r.versions || []).forEach(v => {
            (v.keywordGaps || []).forEach(gap => {
              keywordsMap[gap] = (keywordsMap[gap] || 0) + 1;
            });
          });
        });
        return Object.entries(keywordsMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);
      })()
    : demoData.missedKeywords;

  // Compile Keyword Anchors from DB
  const keywordAnchors = hasResumes
    ? (() => {
        const strengthsMap = {};
        resumes.forEach(r => {
          (r.versions || []).forEach(v => {
            (v.strengths || []).forEach(str => {
              // Extract technical nouns where possible for anchors
              const cleaned = str.replace(/Gemini:|Mistral:|Llama 3 \(Groq\):/g, "").trim();
              strengthsMap[cleaned] = (strengthsMap[cleaned] || 0) + 1;
            });
          });
        });
        return Object.entries(strengthsMap)
          .map(([name, count]) => ({ name, count: count * 3 })) // Multiply by 3 for tag weight visual contrast
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);
      })()
    : demoData.keywordAnchors;

  // Compile Resume Table List from DB
  const byResume = hasResumes
    ? resumes.map(r => {
        const versions = r.versions || [];
        const latest = versions.length > 0 ? (versions[versions.length - 1]?.atsScore || 0) : 0;
        const best = versions.length > 0 ? Math.max(...versions.map(v => v.atsScore)) : 0;
        const first = versions.length > 0 ? (versions[0]?.atsScore || 0) : 0;
        return {
          name: r.name.replace(/\.[^.]+$/, ""),
          latest,
          best,
          change: latest - first,
          analyses: versions.length
        };
      })
    : demoData.byResume;

  return (
    <div className="ana-page">
      {/* Header Utilities */}
      <div className="dash-overview-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="dash-overview-greeting">Hello, {displayName}.</h1>
          <p className="dash-overview-sub">Sharpen your resume with calm, focused AI insights.</p>
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
          <span><strong>Demo Mode Active</strong>: You are viewing placeholder data. Analyze your own resume to populate private metrics!</span>
        </div>
      )}

      {/* Main Title Row */}
      <h2 className="ana-page-title">Insights</h2>
      <p className="ana-page-sub">Patterns across all your resumes and analyses.</p>

      {loading && resumes.length > 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading insights...</p>
      ) : (
        <>
          {/* Row 1: Summary Cards */}
          <motion.div 
            className="ana-summary-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="ana-card" variants={fadeUpItem} whileHover={cardHover}>
              <span className="ana-score-lbl">Average ATS Score</span>
              <span className="ana-score-num">{summary.avgAtsScore}<span> / 100</span></span>
            </motion.div>

            <motion.div className="ana-card dark-theme" variants={fadeUpItem} whileHover={cardHover}>
              <span className="ana-score-lbl">Best Score</span>
              <span className="ana-score-num">{summary.bestScore}<span> / 100</span></span>
              <span className="ana-score-sub" title={summary.bestResumeName}>{summary.bestResumeName}</span>
            </motion.div>

            <motion.div className="ana-card" variants={fadeUpItem} whileHover={cardHover}>
              <span className="ana-score-lbl">Total Analyses</span>
              <span className="ana-score-num">{summary.totalAnalyses}</span>
            </motion.div>
          </motion.div>

          {/* Row 2: Score Trend Chart */}
          <motion.div 
            className="ana-card" 
            style={{ marginBottom: "1.5rem" }} 
            variants={fadeUpItem} 
            whileHover={cardHover}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.15 }}
          >
            <h3 className="ana-card-title">Score Trend</h3>
            <p className="ana-card-sub" style={{ margin: "0.2rem 0 1rem 0" }}>Every analysis you've run, chronologically</p>
            <div style={{ marginTop: "1rem" }}>
              <ChronologicalScoreTrend trends={trends} />
            </div>
          </motion.div>

          {/* Row 3: Two Column Layout */}
          <motion.div 
            className="ana-two-col"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Left: Recurring Issues */}
            <motion.div className="ana-card" variants={fadeUpItem} whileHover={cardHover}>
              <h3 className="ana-card-title">Recurring Issues</h3>
              <p className="ana-card-sub">What comes up most often across your analyses</p>

              <div className="issues-list">
                {recurringIssues.length === 0 ? (
                  <p className="ana-card-sub" style={{ margin: 0 }}>No issues recurring! All metrics clear.</p>
                ) : (
                  recurringIssues.map((issue, idx) => (
                    <div key={idx} className="issue-item">
                      <div className="issue-icon-circle">!</div>
                      <div className="issue-desc">
                        <span className="issue-title" title={issue.title}>{issue.title}</span>
                        <div className="issue-meta-row">
                          <span className={`severity-tag ${issue.severity}`}>{issue.severity}</span>
                          <span className="issue-count">{issue.count}x across analyses</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Right: Most Missed Keywords */}
            <motion.div className="ana-card" variants={fadeUpItem} whileHover={cardHover}>
              <h3 className="ana-card-title">Most-Missed Keywords</h3>
              <p className="ana-card-sub">Words ATS expected but didn't see</p>

              <div className="tag-cloud">
                {missedKeywords.length === 0 ? (
                  <p className="ana-card-sub" style={{ margin: 0 }}>Excellent! No keyword gaps identified.</p>
                ) : (
                  missedKeywords.map((kw, idx) => (
                    <span key={idx} className="keyword-pill missed">
                      {kw.name} <span>×{kw.count}</span>
                    </span>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Row 4: Keyword Anchors */}
          <motion.div 
            className="ana-card" 
            style={{ marginBottom: "1.5rem" }} 
            variants={fadeUpItem} 
            whileHover={cardHover}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.3 }}
          >
            <h3 className="ana-card-title">Your Keyword Anchors</h3>
            <p className="ana-card-sub">Words ATS consistently sees on your resumes</p>
            <div className="tag-cloud">
              {keywordAnchors.length === 0 ? (
                <p className="ana-card-sub" style={{ margin: 0 }}>Upload more resume versions to form anchor patterns.</p>
              ) : (
                keywordAnchors.map((kw, idx) => (
                  <span key={idx} className="keyword-pill anchor">
                    {kw.name} <span>×{kw.count}</span>
                  </span>
                ))
              )}
            </div>
          </motion.div>

          {/* Row 5: By Resume Performance Table */}
          <motion.div 
            className="ana-card ana-table-card" 
            variants={fadeUpItem} 
            whileHover={cardHover}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.35 }}
          >
            <h3 className="ana-card-title">By Resume</h3>
            <p className="ana-card-sub">How each of your resumes is performing</p>

            <div className="ana-table-wrap">
              <table className="ana-table">
                <thead>
                  <tr>
                    <th>Resume</th>
                    <th>Latest</th>
                    <th>Best</th>
                    <th>Improvement</th>
                    <th>Analyses</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {byResume.map((item, idx) => (
                    <tr key={idx} onClick={() => navigate("/resumes")}>
                      <td className="table-row-name" title={item.name}>{item.name}</td>
                      <td style={{ fontWeight: 700 }}>{item.latest}</td>
                      <td>{item.best}</td>
                      <td>
                        <span className="table-row-btn" style={{ background: item.change >= 0 ? "rgba(40,140,82,0.1)" : "rgba(229,62,109,0.1)", color: item.change >= 0 ? "#288c52" : "#e53e6d" }}>
                          {item.change >= 0 ? "+" : ""}{item.change}
                        </span>
                      </td>
                      <td>{item.analyses}</td>
                      <td className="table-chevron">›</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

export default Analytics;
