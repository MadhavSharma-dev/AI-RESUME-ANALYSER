import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchResumeDetails, runAnalysis, fetchResumesList, exportResumeFeedbackPdf, uploadResumeVersion } from "../../api/resumes";
import HeaderUtils from "../common/HeaderUtils";
import "./ResumeDetail.css";

const EB_DESCRIPTIONS = {
  content: {
    desc: "Evaluates action verb density, metric quantification (%, $), and bullet impact.",
    tip: "Add specific data points, metrics, and business outcomes to every work experience bullet point."
  },
  sections: {
    desc: "Checks for standard required sections: Summary, Experience, Education, Skills, and Projects.",
    tip: "Use standard headings so ATS scrapers can categorize your data without misfiling information."
  },
  atsEssentials: {
    desc: "Verifies clean layout, font encoding, standard margins, and absence of tables/graphics.",
    tip: "Avoid multi-column tables, text boxes, or embedded images that crash legacy ATS parsers."
  },
  hrRedFlags: {
    desc: "Scans for unexplained employment gaps, job hopping, or lack of quantifiable responsibilities.",
    tip: "Keep employment years/months clear and highlight continuous skill progression."
  },
  discrimination: {
    desc: "Scans for personal attributes (photo, age, marital status, nationality) that cause HR rejections.",
    tip: "100% score means no illegal/discriminatory personal fields found."
  },
  seniority: {
    desc: "Measures strategic leadership, scope of ownership, team management, and executive phrasing.",
    tip: "Use leadership verbs like 'Architected', 'Spearheaded', 'Engineered', and 'Led'."
  },
  tailoring: {
    desc: "Measures direct alignment and keyword density against your specified target role.",
    tip: "Include core technical stack keywords directly from the target job description."
  }
};

const SemiCircleGauge = ({ score }) => {
  const radius = 60;
  const stroke = 12;
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const circumference = Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  let color = "var(--danger)";
  let label = "Poor";
  if (score >= 80) { color = "var(--success)"; label = "Excellent"; }
  else if (score >= 60) { color = "var(--gold)"; label = "Fair"; }
  else if (score >= 40) { color = "var(--warning)"; label = "Needs Work"; }

  return (
    <div className="gauge-container">
      <svg width="150" height="85" viewBox="0 0 150 85">
        <path
          d={`M ${stroke}, 80 a ${radius},${radius} 0 0,1 ${radius * 2},0`}
          fill="none"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${stroke}, 80 a ${radius},${radius} 0 0,1 ${radius * 2},0`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="gauge-content">
        <span className="gauge-score">{score}</span>
        <span className="gauge-label" style={{ color }}>{label}</span>
      </div>
    </div>
  );
};

const RadarChart = ({ data }) => {
  const size = 160;
  const center = size / 2;
  const radius = (size / 2) - 20;
  
  const getPoint = (value, angle) => {
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle - Math.PI / 2);
    const y = center + r * Math.sin(angle - Math.PI / 2);
    return `${x},${y}`;
  };

  const labels = [
    { name: "Keywords", val: data?.keywords || 0 },
    { name: "Formatting", val: data?.format || 0 },
    { name: "Impact", val: data?.impact || 0 },
    { name: "Clarity", val: data?.readability || 0 }
  ];

  const polygonPoints = labels.map((l, i) => getPoint(l.val, (Math.PI * 2 * i) / 4)).join(" ");

  return (
    <div className="radar-container">
      <svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={labels.map((_, i) => getPoint(100 * scale, (Math.PI * 2 * i) / 4)).join(" ")}
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="1"
          />
        ))}
        {labels.map((_, i) => {
          const pt = getPoint(100, (Math.PI * 2 * i) / 4);
          return <line key={i} x1={center} y1={center} x2={pt.split(',')[0]} y2={pt.split(',')[1]} stroke="rgba(0,0,0,0.05)" />;
        })}
        <polygon points={polygonPoints} fill="rgba(66, 99, 235, 0.2)" stroke="var(--primary)" strokeWidth="2" />
        {labels.map((l, i) => {
          const pt = getPoint(l.val, (Math.PI * 2 * i) / 4);
          return <circle key={i} cx={pt.split(',')[0]} cy={pt.split(',')[1]} r="4" fill="var(--primary)" />;
        })}
      </svg>
      <div className="radar-labels">
        <span className="radar-label top">Keywords<br/>{Math.round((labels[0].val / 100) * 25)}/25</span>
        <span className="radar-label right">Formatting<br/>{Math.round((labels[1].val / 100) * 25)}/25</span>
        <span className="radar-label bottom">Impact<br/>{Math.round((labels[2].val / 100) * 25)}/25</span>
        <span className="radar-label left">Clarity<br/>{Math.round((labels[3].val / 100) * 25)}/25</span>
      </div>
    </div>
  );
};

export default function ResumeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeVersionNumber, setActiveVersionNumber] = useState(1);
  const [activeAnalysisId, setActiveAnalysisId] = useState(null);
  
  const [targetRole, setTargetRole] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [activeTab, setActiveTab] = useState("issues");
  const [expandedEbKey, setExpandedEbKey] = useState(null);

  const loadData = async () => {
    try {
      const res = await fetchResumeDetails(id);
      setData(res);
      if (res.resume.versions.length > 0) {
        const latestVer = res.resume.versions[res.resume.versions.length - 1];
        setActiveVersionNumber(latestVer.versionNumber);
        const analysesForVer = res.analyses.filter(a => a.versionNumber === latestVer.versionNumber);
        if (analysesForVer.length > 0) {
          setActiveAnalysisId(analysesForVer[0]._id);
          setTargetRole(analysesForVer[0].targetRole);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRunAnalysis = async () => {
    if (!targetRole.trim()) return;
    setAnalyzing(true);
    try {
      const newAnalysis = await runAnalysis(id, activeVersionNumber, targetRole, true);
      await loadData();
      if (newAnalysis && newAnalysis._id) {
        setActiveAnalysisId(newAnalysis._id);
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUploadNewVersionFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVersion(true);
    try {
      const updatedResume = await uploadResumeVersion(id, file, targetRole || "General");
      await loadData();
      if (updatedResume?.versions?.length > 0) {
        const newVer = updatedResume.versions[updatedResume.versions.length - 1].versionNumber;
        setActiveVersionNumber(newVer);
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to upload new version");
    } finally {
      setUploadingVersion(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const blob = await exportResumeFeedbackPdf(id, activeVersionNumber, activeAnalysisId);
      const url = window.URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setShowPdfModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF preview");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadPdfFile = () => {
    if (!pdfPreviewUrl) return;
    const a = document.createElement("a");
    a.href = pdfPreviewUrl;
    const candidateName = activeVersion?.parsedSections?.name || resume.name.replace(/\.[^.]+$/, "");
    a.download = `${candidateName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Feedback.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!data || !data.resume) return <div className="error-state">Resume not found.</div>;

  const { resume, analyses } = data;
  const activeVersion = resume.versions.find(v => v.versionNumber === activeVersionNumber);
  const availableAnalyses = analyses.filter(a => a.versionNumber === activeVersionNumber);
  const activeAnalysis = availableAnalyses.find(a => a._id === activeAnalysisId) || availableAnalyses[0];
  const extBreakdown = activeAnalysis?.extendedBreakdown || {};

  return (
    <div className="resume-detail-page">
      <header className="rd-header">
        <div className="rd-header-left">
          <Link to="/resumes" className="back-link">← All resumes</Link>
          <div className="rd-title-group">
            <h1>{resume.name}</h1>
            <span className="rd-meta">Updated {new Date(activeVersion?.createdAt || resume.updatedAt).toLocaleDateString()} • {resume.versions.length} versions</span>
          </div>
        </div>
        <div className="rd-header-right" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <HeaderUtils />
          <button className="btn-export-pdf" onClick={handleExportPdf} disabled={exportingPdf}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exportingPdf ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </header>

      <div className="rd-content">
        <div className="rd-main-col">
          <div className="rd-run-analysis-card">
            <div className="ra-col">
              <label>Version</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select 
                  value={activeVersionNumber} 
                  onChange={(e) => {
                    const newVer = Number(e.target.value);
                    setActiveVersionNumber(newVer);
                    const related = analyses.filter(a => a.versionNumber === newVer);
                    if (related.length > 0) setActiveAnalysisId(related[0]._id);
                  }}
                >
                  {resume.versions.map(v => (
                    <option key={v.versionNumber} value={v.versionNumber}>V{v.versionNumber}</option>
                  ))}
                </select>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept=".pdf,.doc,.docx"
                  onChange={handleUploadNewVersionFile}
                />
                <button 
                  className="btn-add-version"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingVersion}
                  title="Upload a new version of this resume (PDF)"
                >
                  {uploadingVersion ? "Uploading..." : "+ New Version"}
                </button>
              </div>
            </div>
            
            {availableAnalyses.length > 1 && (
              <div className="ra-col">
                <label>History</label>
                <select value={activeAnalysisId || ""} onChange={(e) => setActiveAnalysisId(e.target.value)}>
                  {availableAnalyses.map(a => (
                    <option key={a._id} value={a._id}>{a.targetRole}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="ra-col role-input-col">
              <label>Target Role</label>
              <input 
                type="text" 
                value={targetRole} 
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
            <button 
              className="btn-primary analyze-btn" 
              onClick={handleRunAnalysis}
              disabled={analyzing}
            >
              {analyzing ? "Analyzing..." : "Analyze Resume"}
            </button>
          </div>

          {activeAnalysis ? (
            <>
              <div className="rd-results-row">
                <div className="rd-card gauge-card">
                  <h3>ATS Readiness</h3>
                  <SemiCircleGauge score={activeAnalysis.atsScore} />
                </div>
                <div className="rd-card radar-card">
                  <h3>Score Breakdown</h3>
                  <RadarChart data={activeAnalysis.breakdown} />
                </div>
                <div className="rd-card verdict-card">
                  <h3>Roaster Verdict</h3>
                  <p className="verdict-text">{activeAnalysis.verdict}</p>
                  <div className="model-badge">ensemble ({activeAnalysis.modelsUsed.join(" + ")})</div>
                </div>
              </div>

              <div className="rd-tabs-container">
                <div className="rd-tabs-header">
                  {["issues", "strengths", "keywords", "rewrites"].map(tab => (
                    <button 
                      key={tab} 
                      className={`rd-tab ${activeTab === tab ? "active" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                
                <div className="rd-tab-content">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === "issues" && (
                        <div className="tab-issues">
                          {activeAnalysis.issues?.map((iss, idx) => (
                            <div key={idx} className="issue-card">
                              <div className="issue-header">
                                <span className={`severity-tag ${iss.severity}`}>{iss.severity}</span>
                                <h4>{iss.title}</h4>
                              </div>
                              <p className="issue-desc">{iss.description}</p>
                              {iss.fix && <p className="issue-fix"><strong>Fix:</strong> {iss.fix}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      {activeTab === "strengths" && (
                        <div className="tab-strengths">
                          <ul className="bullet-list">
                            {activeAnalysis.strengths?.map((s, idx) => <li key={idx}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {activeTab === "keywords" && (
                        <div className="tab-keywords">
                          <div className="kw-group">
                            <h4>Missing Keywords</h4>
                            <div className="chip-list">
                              {activeAnalysis.keywords?.missing?.map((k, idx) => <span className="chip missing" key={idx}>{k}</span>)}
                            </div>
                          </div>
                          <div className="kw-group">
                            <h4>Matched Keywords</h4>
                            <div className="chip-list">
                              {activeAnalysis.keywords?.matched?.map((k, idx) => <span className="chip matched" key={idx}>{k}</span>)}
                            </div>
                          </div>
                        </div>
                      )}
                      {activeTab === "rewrites" && (
                        <div className="tab-rewrites">
                          {activeAnalysis.rewrites?.map((rw, idx) => (
                            <div className="rewrite-card" key={idx}>
                              <div className="rw-before"><h6>Original</h6><p>{rw.before}</p></div>
                              <div className="rw-after"><h6>AI Suggestion</h6><p>{rw.after}</p></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-analysis"><p>No analysis run for this version yet.</p></div>
          )}

          {activeVersion?.parsedSections && (
            <div className="parsed-sections-panel">
              <div className="ps-header">
                <h3>Parsed Sections (V{activeVersionNumber})</h3>
                <p>Quick preview of what we extracted from the PDF</p>
              </div>
              <div className="ps-body">
                <div className="ps-contact">
                  <h2>{activeVersion.parsedSections.name}</h2>
                  <h4>{activeVersion.parsedSections.title}</h4>
                  <p className="ps-contact-info">
                    {activeVersion.parsedSections.contact?.email && <span>{activeVersion.parsedSections.contact.email}</span>}
                    {activeVersion.parsedSections.contact?.phone && <span> • {activeVersion.parsedSections.contact.phone}</span>}
                    {activeVersion.parsedSections.contact?.location && <span> • {activeVersion.parsedSections.contact.location}</span>}
                  </p>
                  <div className="ps-social-links">
                    {["linkedin", "github", "portfolio", "leetcode"].map((platform) => {
                      const rawUrl = activeVersion.parsedSections.contact?.[platform];
                      const linkInfo = activeVersion.parsedSections.contactLinks?.[platform];
                      if (!rawUrl && !linkInfo?.url) return null;
                      const finalUrl = linkInfo?.url || rawUrl;
                      const isValid = linkInfo?.isValid;

                      return (
                        <a
                          key={platform}
                          href={finalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`social-link-chip ${isValid ? "valid" : "invalid"}`}
                          title={isValid ? `Live ${platform} profile` : `Broken URL: ${finalUrl}`}
                        >
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          {isValid ? " ✓" : " ⚠ Broken"}
                        </a>
                      );
                    })}
                  </div>
                </div>
                
                {activeVersion.parsedSections.summary && (
                  <div className="ps-block">
                    <h5>Summary</h5>
                    <p>{activeVersion.parsedSections.summary}</p>
                  </div>
                )}

                {activeVersion.parsedSections.skills?.length > 0 && (
                  <div className="ps-block">
                    <h5>Skills</h5>
                    <p>{activeVersion.parsedSections.skills.join(" • ")}</p>
                  </div>
                )}

                {activeVersion.parsedSections.experience?.length > 0 && (
                  <div className="ps-block">
                    <h5>Experience</h5>
                    {activeVersion.parsedSections.experience.map((exp, idx) => (
                      <div key={idx} className="ps-exp-item">
                        <h6>{exp.role} <span>at {exp.company}</span> <span className="dates">{exp.dates}</span></h6>
                        <p>{exp.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeVersion.parsedSections.education?.length > 0 && (
                  <div className="ps-block">
                    <h5>Education</h5>
                    {activeVersion.parsedSections.education.map((edu, idx) => (
                      <div key={idx} className="ps-exp-item">
                        <h6>{edu.degree} <span>at {edu.institution}</span> <span className="dates">{edu.dates}</span></h6>
                      </div>
                    ))}
                  </div>
                )}

                {activeVersion.parsedSections.projects?.length > 0 && (
                  <div className="ps-block">
                    <h5>Projects</h5>
                    {activeVersion.parsedSections.projects.map((proj, idx) => (
                      <div key={idx} className="ps-exp-item">
                        <h6>{proj.name} {proj.technologies && <span>({proj.technologies})</span>}</h6>
                        <p>{proj.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(activeVersion.parsedSections.certifications?.length > 0 || activeVersion.parsedSections.certificates?.length > 0) && (
                  <div className="ps-block">
                    <h5>Certificates & Courses</h5>
                    <p>{(activeVersion.parsedSections.certifications || activeVersion.parsedSections.certificates || []).join(" • ")}</p>
                  </div>
                )}

                {activeVersion.parsedSections.awards?.length > 0 && (
                  <div className="ps-block">
                    <h5>Awards & Achievements</h5>
                    <p>{activeVersion.parsedSections.awards.join(" • ")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {activeAnalysis && (
          <div className="rd-side-col">
            <div className="extended-breakdown-card">
              <h3>Extended Breakdown</h3>
              <div className="eb-list">
                {[
                  { key: "content", label: "CONTENT" },
                  { key: "sections", label: "SECTIONS" },
                  { key: "atsEssentials", label: "ATS ESSENTIALS" },
                  { key: "hrRedFlags", label: "HR RED FLAGS" },
                  { key: "discrimination", label: "DISCRIMINATION" },
                  { key: "seniority", label: "SENIORITY" },
                  { key: "tailoring", label: "TAILORING" }
                ].map(({ key, label }) => {
                  const val = extBreakdown[key] || 0;
                  let colorClass = "bad";
                  if (val >= 80) colorClass = "good";
                  else if (val >= 60) colorClass = "warn";
                  const isExpanded = expandedEbKey === key;

                  return (
                    <div key={key}>
                      <div 
                        className={`eb-row ${isExpanded ? "expanded" : ""}`}
                        onClick={() => setExpandedEbKey(isExpanded ? null : key)}
                        style={{ cursor: "pointer" }}
                      >
                        <span className="eb-label">{label}</span>
                        <div className="eb-right">
                          <span className={`eb-badge ${colorClass}`}>{val}%</span>
                          <svg 
                            className="eb-chevron" 
                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="eb-expand-panel">
                          <p className="eb-expand-desc">{EB_DESCRIPTIONS[key]?.desc}</p>
                          <div className="eb-expand-tip">
                            <strong>Recommendation:</strong> {EB_DESCRIPTIONS[key]?.tip}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PDF PREVIEW MODAL */}
      <AnimatePresence>
        {showPdfModal && (
          <motion.div 
            className="pdf-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPdfModal(false)}
          >
            <motion.div 
              className="pdf-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pdf-modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--navy)" }}>PDF Feedback Report Preview</h3>
                  <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>Review your generated feedback report before downloading</p>
                </div>
                <div className="pdf-modal-actions">
                  <button className="btn-primary btn-modal-download" onClick={handleDownloadPdfFile}>
                    Download PDF ⬇
                  </button>
                  <button className="btn-modal-close" onClick={() => setShowPdfModal(false)}>
                    ✕
                  </button>
                </div>
              </div>
              <div className="pdf-modal-body">
                {pdfPreviewUrl ? (
                  <iframe 
                    src={pdfPreviewUrl} 
                    title="PDF Feedback Report Preview"
                    className="pdf-preview-iframe"
                  />
                ) : (
                  <div className="pdf-loading">Generating preview...</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
