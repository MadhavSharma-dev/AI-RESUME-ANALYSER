import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import favIcon from "../../assets/brand/fav-icon.png";
import "./Landing.css";

function Home({ isLoggedIn, handleLogout }) {
  const navigate = useNavigate();

  // --- Animation States for Slide 1 (Hero) ---
  const [atsScore, setAtsScore] = useState(0);
  const [visibleIssues, setVisibleIssues] = useState(0);
  const [rewriteStage, setRewriteStage] = useState(0); // 0: before, 1: strike-before, 2: show-after

  useEffect(() => {
    // 1. ATS Score Gauge animation (count up 0 to 86)
    const duration = 1200; // ms
    const targetScore = 86;
    const start = performance.now();

    let scoreAnimFrame;
    const animateScore = (timestamp) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quadratic
      const easeProgress = progress * (2 - progress);
      const currentScore = Math.floor(easeProgress * targetScore);
      
      setAtsScore(currentScore);

      if (progress < 1) {
        scoreAnimFrame = requestAnimationFrame(animateScore);
      }
    };
    scoreAnimFrame = requestAnimationFrame(animateScore);

    // 2. Top Issues list fade-in delay (appear one by one)
    const issuesTimer = setInterval(() => {
      setVisibleIssues((prev) => {
        if (prev >= 3) {
          clearInterval(issuesTimer);
          return 3;
        }
        return prev + 1;
      });
    }, 450);

    // 3. AI Rewrite transition delay stages
    const beforeStrikeTimer = setTimeout(() => {
      setRewriteStage(1); // strike through
    }, 900);

    const afterShowTimer = setTimeout(() => {
      setRewriteStage(2); // show rewrite
    }, 1600);

    return () => {
      cancelAnimationFrame(scoreAnimFrame);
      clearInterval(issuesTimer);
      clearTimeout(beforeStrikeTimer);
      clearTimeout(afterShowTimer);
    };
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // SVG Gauge calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.2
  // We want to fill 86% of the circle
  const strokeDashoffset = circumference - (circumference * atsScore) / 100;

  return (
    <div className="home-container">
      {/* ===== HERO SECTION ===== */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Left Column */}
          <div className="hero-left anim-fade-up">
            <div className="hero-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2zm0 3.99L19.53 19H4.47L12 5.99zM13 16h-2v2h2v-2zm0-6h-2v4h2v-4z" />
              </svg>
              Now scoring against ATS 2026 criteria
            </div>
            <h1 className="hero-title">
              Beat the ATS.
              <span>Land more interviews.</span>
            </h1>
            <p className="hero-desc">
              Upload your resume. Get an instant ATS score, fixable issues, and AI-rewritten bullets that actually sound like you — built for engineers, by engineers.
            </p>
            <div className="hero-cta-group">
              <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="btn-upload">
                Upload your resume
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
              <button className="btn-play" onClick={() => scrollToSection("how-it-works")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                See how it works
              </button>
            </div>
            <div className="hero-bullets">
              <span>No credit card required</span>
              <span className="bullet-dot">•</span>
              <span>Free ATS analysis</span>
              <span className="bullet-dot">•</span>
              <span>47,300+ resumes analyzed</span>
            </div>
          </div>

          {/* Right Column (Dynamic Cards) */}
          <div className="hero-right anim-scale-up delay-2">
            {/* Card 1: ATS Readiness */}
            <div className="card-ats-readiness anim-float">
              <div className="card-header-row">
                <div>
                  <div className="card-title-sub">ATS Readiness</div>
                  <div className="card-title-main">Senior_Frontend.pdf</div>
                </div>
                <div className="status-badge">
                  <span className="status-dot"></span>
                  Strong
                </div>
              </div>

              <div className="gauge-container">
                <svg className="gauge-svg" viewBox="0 0 100 100">
                  <circle className="gauge-bg" cx="50" cy="50" r={radius} />
                  <circle
                    className="gauge-fill"
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: strokeDashoffset }}
                  />
                </svg>
                <div className="gauge-text">
                  <span className="gauge-score">{atsScore}</span>
                  <span className="gauge-label">out of 100</span>
                </div>
              </div>

              <div className="vs-badge">
                +1.8 vs V1
              </div>
            </div>

            {/* Floating tags */}
            <div className="floating-tags">
              <span className="tech-tag">+React</span>
              <span className="tech-tag">+TypeScript</span>
              <span className="tech-tag">+AWS</span>
            </div>

            {/* Card 2: Top Issues */}
            <div className="card-top-issues">
              <div className="issues-title-row">
                <div className="issues-icon-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Top issues
                </div>
                <span className="issues-count">5</span>
              </div>
              <div className="issues-list">
                <div className={`issue-item ${visibleIssues >= 1 ? "visible" : ""}`}>
                  <span className="issue-dot red"></span>
                  Weak action verbs
                </div>
                <div className={`issue-item ${visibleIssues >= 2 ? "visible" : ""}`}>
                  <span className="issue-dot yellow"></span>
                  Missing keywords: React, AWS
                </div>
                <div className={`issue-item ${visibleIssues >= 3 ? "visible" : ""}`}>
                  <span className="issue-dot blue"></span>
                  Inconsistent dates
                </div>
              </div>
            </div>

            {/* Card 3: AI Rewrite */}
            <div className="card-ai-rewrite">
              <div className="rewrite-title-row">
                <div className="rewrite-icon-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  AI rewrite
                </div>
                <span className="rewrite-badge">Improved</span>
              </div>
              <div className="rewrite-content">
                <div className="rewrite-label">Before</div>
                <div className={`rewrite-text rewrite-before`} style={{
                  textDecoration: rewriteStage >= 1 ? "line-through" : "none",
                  opacity: rewriteStage >= 1 ? 0.4 : 1
                }}>
                  Worked on dashboards for the team.
                </div>
                
                <div className="rewrite-label" style={{ marginTop: "0.25rem" }}>After</div>
                <div className={`rewrite-text rewrite-after ${rewriteStage >= 2 ? "visible" : ""}`}>
                  Shipped <span className="rewrite-highlight">4 React analytics dashboards</span> used by <span className="rewrite-highlight">12k+ users</span>, cutting load time <span className="rewrite-highlight">38%</span>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="section-wrapper features-section" id="features">
        <span className="section-badge">Features</span>
        <h2 className="section-title">
          Everything your resume
          <span> needs to actually land.</span>
        </h2>
        <p className="section-desc">
          Eight surgical tools built around one workflow: upload, analyze, rewrite, ship.
        </p>

        <div className="features-grid">
          {/* Card 1 (Wide): ATS Score Analysis */}
          <div className="feature-card feature-card-wide">
            <div className="feature-icon-row">
              <div className="feature-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
            <h3 className="feature-card-title">ATS Score Analysis</h3>
            <p className="feature-card-desc">
              Section-level scoring against the same parsers Greenhouse and Lever run.
            </p>
            <div className="feature-visual-area">
              <div className="visual-ats-breakdown">
                <div className="v-breakdown-score-col">
                  <div className="v-breakdown-num">86</div>
                  <div className="v-breakdown-total">/ 100</div>
                  <span className="v-breakdown-badge">+18 pts</span>
                </div>
                <div className="v-breakdown-progress-col">
                  <div className="v-progress-item">
                    <div className="v-progress-info">
                      <span>Keywords</span>
                      <span>88</span>
                    </div>
                    <div className="v-progress-track">
                      <div className="v-progress-bar" style={{ width: "88%" }}></div>
                    </div>
                  </div>
                  <div className="v-progress-item">
                    <div className="v-progress-info">
                      <span>Format</span>
                      <span>74</span>
                    </div>
                    <div className="v-progress-track">
                      <div className="v-progress-bar" style={{ width: "74%" }}></div>
                    </div>
                  </div>
                  <div className="v-progress-item">
                    <div className="v-progress-info">
                      <span>Impact</span>
                      <span>91</span>
                    </div>
                    <div className="v-progress-track">
                      <div className="v-progress-bar" style={{ width: "91%" }}></div>
                    </div>
                  </div>
                  <div className="v-progress-item">
                    <div className="v-progress-info">
                      <span>Readability</span>
                      <span>82</span>
                    </div>
                    <div className="v-progress-track">
                      <div className="v-progress-bar" style={{ width: "82%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: AI Resume Rewrite */}
          <div className="feature-card">
            <div className="feature-icon-row">
              <div className="feature-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
            </div>
            <h3 className="feature-card-title">AI Resume Rewrite</h3>
            <p className="feature-card-desc">
              Bullets rewritten in your voice, with quantified outcomes — not generic fluff.
            </p>
            <div className="feature-visual-area">
              <div className="visual-rewrite">
                <div className="visual-rewrite-before">
                  <strong>Before:</strong> Worked on backend stuff
                </div>
                <div className="visual-rewrite-after">
                  <strong>After:</strong> Built 6 Node services handling 4.2M req/day at p99 &lt;120ms.
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Keyword Optimization */}
          <div className="feature-card">
            <div className="feature-icon-row">
              <div className="feature-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            <h3 className="feature-card-title">Keyword Optimization</h3>
            <p className="feature-card-desc">
              Auto-matches your resume against any job description, surfaces what's missing.
            </p>
            <div className="feature-visual-area">
              <div className="visual-keywords">
                <div className="v-kw-job">JOB: SENIOR FRONTEND @ STRIPE</div>
                <div className="v-kw-tags">
                  <span className="kw-tag checked">✓ React</span>
                  <span className="kw-tag checked">✓ TypeScript</span>
                  <span className="kw-tag checked">✓ Node.js</span>
                  <span className="kw-tag missing">+ GraphQL</span>
                  <span className="kw-tag missing">+ Docker</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Version History */}
          <div className="feature-card">
            <div className="feature-icon-row">
              <div className="feature-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <h3 className="feature-card-title">Version History</h3>
            <p className="feature-card-desc">
              Every iteration scored, dated, and one click away.
            </p>
            <div className="feature-visual-area">
              <div className="visual-versions">
                <div className="v-version-pill">
                  <span className="v-ver-lbl">V1</span>
                  <span className="v-ver-score">62</span>
                </div>
                <div className="v-version-pill">
                  <span className="v-ver-lbl">V2</span>
                  <span className="v-ver-score">78</span>
                </div>
                <div className="v-version-pill active">
                  <span className="v-ver-lbl">V3</span>
                  <span className="v-ver-score">86</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Diff Comparison */}
          <div className="feature-card">
            <div className="feature-icon-row">
              <div className="feature-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5 6h9m0 0l-3-3m3 3l-3 3"></path>
                </svg>
              </div>
            </div>
            <h3 className="feature-card-title">Diff Comparison</h3>
            <p className="feature-card-desc">
              See exactly what changed between V1 and V3 — line by line.
            </p>
            <div className="feature-visual-area">
              <div className="visual-diff">
                <div className="diff-line rem">- helped team</div>
                <div className="diff-line add">+ led 4-person frontend pod</div>
                <div className="diff-line add">+ shipped 12 features in Q3</div>
              </div>
            </div>
          </div>

          {/* Card 6: Analytics Dashboard */}
          <div className="feature-card">
            <div className="feature-icon-row">
              <div className="feature-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"></path>
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                </svg>
              </div>
            </div>
            <h3 className="feature-card-title">Analytics Dashboard</h3>
            <p className="feature-card-desc">
              Track score evolution, keywords matched, and issues resolved over time.
            </p>
            <div className="feature-visual-area">
              <div className="visual-line-chart">
                <svg className="svg-chart" viewBox="0 0 120 40">
                  <path className="chart-path" d="M 10 35 L 25 30 L 45 28 L 65 20 L 85 18 L 105 8" />
                  <g className="chart-dots">
                    <circle cx="10" cy="35" r="3" />
                    <circle cx="25" cy="30" r="3" />
                    <circle cx="45" cy="28" r="3" />
                    <circle cx="65" cy="20" r="3" />
                    <circle cx="85" cy="18" r="3" />
                    <circle cx="105" cy="8" r="3" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Card 7: PDF Export */}
          <div className="feature-card">
            <div className="feature-icon-row">
              <div className="feature-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
            </div>
            <h3 className="feature-card-title">PDF Export</h3>
            <p className="feature-card-desc">
              Rebuilt with a clean ATS-friendly template — never trust your old layout again.
            </p>
            <div className="feature-visual-area">
              <div className="visual-pdf-preview">
                <div className="v-pdf-h"></div>
                <div className="v-pdf-sub"></div>
                <div className="v-pdf-para">
                  <div className="v-pdf-ln w1"></div>
                  <div className="v-pdf-ln w2"></div>
                  <div className="v-pdf-ln w3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section className="section-wrapper how-it-works-section" id="how-it-works">
        <span className="section-badge">How it works</span>
        <h2 className="section-title">
          From upload to interview-ready
          <span> in 3 steps.</span>
        </h2>
        <p className="section-desc">
          No prompt engineering. No ten-step funnels. Drop, analyze, ship.
        </p>

        <div className="steps-container">
          {/* Step 1 */}
          <div className="step-card-wrap">
            <div className="step-card">
              <div className="step-number-bg">01</div>
              <span className="step-badge">Step 01</span>
              <div className="step-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h3 className="step-title">Upload your resume</h3>
              <p className="step-desc">
                Drop a PDF or DOCX. We parse it in seconds — no signup wall, no nonsense.
              </p>
              <div className="step-visual">
                <div className="step-v-file">
                  <svg className="step-v-file-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <div className="step-v-file-info">
                    <div className="step-v-file-name">resume_v3.pdf</div>
                    <div className="step-v-file-size">412 KB • parsing...</div>
                  </div>
                  <span className="step-v-status-badge">live</span>
                </div>
                <div className="step-v-progress">
                  <div className="step-v-progress-bar"></div>
                </div>
              </div>
            </div>
            <div className="step-connector">
              <div className="step-connector-arrow"></div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step-card-wrap">
            <div className="step-card">
              <div className="step-number-bg">02</div>
              <span className="step-badge">Step 02</span>
              <div className="step-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                  <rect x="9" y="9" width="6" height="6"></rect>
                  <line x1="9" y1="1" x2="9" y2="4"></line>
                  <line x1="15" y1="1" x2="15" y2="4"></line>
                  <line x1="9" y1="20" x2="9" y2="23"></line>
                  <line x1="15" y1="20" x2="15" y2="23"></line>
                  <line x1="20" y1="9" x2="23" y2="9"></line>
                  <line x1="20" y1="15" x2="23" y2="15"></line>
                  <line x1="1" y1="9" x2="4" y2="9"></line>
                  <line x1="1" y1="15" x2="4" y2="15"></line>
                </svg>
              </div>
              <h3 className="step-title">AI analyzes & roasts</h3>
              <p className="step-desc">
                Gemini scores against ATS rubrics, surfaces 5 issues + 5 strengths, and drafts rewrites.
              </p>
              <div className="step-visual">
                <div className="step-v-checklist">
                  <div className="step-v-chk-item done">✓ Structure parsed</div>
                  <div className="step-v-chk-item done">✓ ATS rules checked</div>
                  <div className="step-v-chk-item">⟳ Generating rewrites...</div>
                  <div className="step-v-score">
                    <span>Predicted score</span>
                    <span style={{ color: "var(--gold)" }}>82 / 100</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="step-connector">
              <div className="step-connector-arrow"></div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step-card-wrap">
            <div className="step-card">
              <div className="step-number-bg">03</div>
              <span className="step-badge">Step 03</span>
              <div className="step-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <h3 className="step-title">Download optimized PDF</h3>
              <p className="step-desc">
                Apply rewrites, save a new version, and export a clean ATS-friendly PDF.
              </p>
              <div className="step-visual">
                <div className="step-v-pdf">
                  <div className="step-v-pdf-left">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#288c52" }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <div>
                      <div className="step-v-pdf-name">resume_v3_optimized.pdf</div>
                      <div className="step-v-pdf-meta">ATS-ready • 1 page</div>
                    </div>
                  </div>
                  <button className="step-v-dl-btn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                </div>
                <div style={{ textAlign: "left" }}>
                  <span className="step-v-badge-gold">ATS 86</span>
                  <span style={{ fontSize: "0.65rem", color: "#288c52", marginLeft: "0.5rem", fontWeight: 700 }}>+24 pts vs V1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="cta-section">
        <div className="cta-banner">
          <span className="cta-badge">Free forever for your first 3 analyses</span>
          <h2 className="cta-title">
            Stop guessing what
            <span> recruiters actually see.</span>
          </h2>
          <p className="cta-desc">
            Upload your resume now. Get your ATS score, fixable issues, and AI rewrites in under 15 seconds.
          </p>
          <div className="cta-buttons">
            <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="btn-upload">
              Start free ATS analysis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            {!isLoggedIn && (
              <Link to="/login" className="btn-play" style={{ border: "1px solid rgba(232, 220, 200, 0.25)" }}>
                I already have an account
              </Link>
            )}
          </div>
          <p className="cta-subtext">
            No credit card required • We never store your resume PDF
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-container">
          {/* Brand Info */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={favIcon} alt="Resume Roaster" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "8px" }} />
              <span>Resume Roaster</span>
            </div>
            <p className="footer-tagline">
              An AI-powered ATS optimizer designed to help candidates score, improve, and format their engineering resumes.
            </p>
          </div>

          {/* Column 1 */}
          <div className="footer-col">
            <span className="footer-col-title">Product</span>
            <div className="footer-links">
              <button className="footer-link" onClick={() => scrollToSection("features")} style={{ border: "none", background: "none", textAlign: "left" }}>Features</button>
              <button className="footer-link" onClick={() => scrollToSection("how-it-works")} style={{ border: "none", background: "none", textAlign: "left" }}>How it works</button>
              <Link to={isLoggedIn ? "/dashboard" : "/login"} className="footer-link">Dashboard</Link>
              <span className="footer-link" style={{ opacity: 0.5 }}>Pricing</span>
            </div>
          </div>

          {/* Column 2 */}
          <div className="footer-col">
            <span className="footer-col-title">Legal</span>
            <div className="footer-links">
              <span className="footer-link" style={{ cursor: "not-allowed" }}>Privacy Policy</span>
              <span className="footer-link" style={{ cursor: "not-allowed" }}>Terms of Service</span>
              <span className="footer-link" style={{ cursor: "not-allowed" }}>Security</span>
            </div>
          </div>

          {/* Column 3 */}
          <div className="footer-col">
            <span className="footer-col-title">Connect</span>
            <div className="footer-links">
              <span className="footer-link" style={{ cursor: "not-allowed" }}>Twitter / X</span>
              <span className="footer-link" style={{ cursor: "not-allowed" }}>LinkedIn</span>
              <span className="footer-link" style={{ cursor: "not-allowed" }}>GitHub</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Resume Roaster. All rights reserved. Built for developers.</span>
          <div className="footer-socials">
            <span>Made by Google DeepMind</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
