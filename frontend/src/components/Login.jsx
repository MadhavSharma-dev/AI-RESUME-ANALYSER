import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import { login } from "../lib/api";

function Login({ handleLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isExiting, setIsExiting] = useState(false);

  // Slideshow state
  const [activeSet, setActiveSet] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSet((prev) => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleLoginClick = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    login(email, password)
      .then((data) => {
        // Store JWT token
        localStorage.setItem("token", data.token);

        // Trigger the drop down exit animation
        setIsExiting(true);

        setTimeout(() => {
          handleLogin({ name: data.name, email: data.email });
          navigate("/dashboard");
        }, 650);
      })
      .catch((err) => {
        alert(err.message || "Login failed. Please verify your credentials.");
      });
  };

  return (
    <div className={`auth-page-container ${isExiting ? "exit-active" : ""}`}>
      {/* LEFT COLUMN: LOGIN FORM */}
      <div className="auth-left-pane">
        <div className="auth-form-card">
          <div className="auth-logo-icon">R</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Login to continue your analysis.</p>

          <form onSubmit={handleLoginClick}>
            {/* Email */}
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="login-email">Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-input-group" style={{ marginBottom: "1.75rem" }}>
              <label className="auth-label" htmlFor="login-password">Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  id="login-password"
                  className="auth-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-auth-submit">
              Sign in
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>

          <p className="auth-footer-nav">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>

          <p className="auth-legal-disclaimer">
            By logging in, you agree to our terms.<br />
            We protect your resume data with bank-grade encryption.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: MARKETING & SLIDESHOW */}
      <div className="auth-right-pane">
        <div className="auth-mkt-header">
          <div className="auth-mkt-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.25rem" }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            AI Resume Roaster
          </div>
          <h2 className="auth-mkt-title">Your resume,<br />intelligently sharpened.</h2>
          <p className="auth-mkt-desc">
            Drop your PDF, get an ATS score, fix what's weak, and land interviews — powered by AI.
          </p>
        </div>

        {/* Dynamic Slideshow of reviewers/metrics */}
        <div className="auth-slideshow-wrap">
          <div className="auth-slides-container">
            {/* --- SET 0: ATS METRICS CARDS --- */}
            <div className={`auth-slide-card left-card ${activeSet === 0 ? "" : "hidden"}`} style={{ display: activeSet === 0 ? "block" : "none" }}>
              <div className="auth-card-lbl">Version History</div>
              <div className="auth-card-head">
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>82 / 100</span>
                <span className="auth-badge-p green">V1 → V3</span>
              </div>
              <div className="auth-chart-row">
                <svg viewBox="0 0 100 30" width="100%" height="100%">
                  <path d="M 10 25 L 40 20 L 70 18 L 90 8" fill="none" stroke="#288c52" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="10" cy="25" r="2.5" fill="#288c52" />
                  <circle cx="40" cy="20" r="2.5" fill="#288c52" />
                  <circle cx="70" cy="18" r="2.5" fill="#288c52" />
                  <circle cx="90" cy="8" r="3" fill="var(--gold)" stroke="#ffffff" strokeWidth="1" />
                </svg>
              </div>
              <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>
                Score improved across versions
              </div>
            </div>

            <div className={`auth-slide-card center-card ${activeSet === 0 ? "" : "hidden"}`} style={{ display: activeSet === 0 ? "block" : "none" }}>
              <div className="auth-card-lbl">Critical Issues</div>
              <div className="auth-card-head" style={{ marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>ATS Check</span>
                <span className="auth-badge-p red">5 found</span>
              </div>
              <div className="auth-issue-list">
                <div className="auth-issue-item">
                  <span className="auth-issue-bullet"><span className="auth-issue-circle high"></span>Missing impact metrics</span>
                  <span className="auth-issue-severity high">High</span>
                </div>
                <div className="auth-issue-item">
                  <span className="auth-issue-bullet"><span className="auth-issue-circle med"></span>Generic action verbs</span>
                  <span className="auth-issue-severity med">Med</span>
                </div>
                <div className="auth-issue-item">
                  <span className="auth-issue-bullet"><span className="auth-issue-circle high"></span>No keyword density</span>
                  <span className="auth-issue-severity high">High</span>
                </div>
              </div>
              <button className="auth-card-action-btn" type="button">
                <span className="auth-card-action-btn-icon">✓</span>
                Apply fixes
              </button>
            </div>

            <div className={`auth-slide-card right-card ${activeSet === 0 ? "" : "hidden"}`} style={{ display: activeSet === 0 ? "block" : "none" }}>
              <div className="auth-card-lbl">AI Rewrite</div>
              <div className="auth-card-head">
                <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>Bullet Roaster</span>
                <span className="auth-badge-p gold">Suggested</span>
              </div>
              <div className="auth-rewrite-block">
                <div className="auth-rewrite-orig">Worked with team to deliver projects.</div>
                <div className="auth-rewrite-sugg">
                  Led 5 engineers to ship 3 features, driving a 30% lift in monthly retention.
                </div>
              </div>
              <button className="auth-card-action-btn" type="button">
                <span className="auth-card-action-btn-icon" style={{ backgroundColor: "#288c52" }}>✓</span>
                Bullet improved
              </button>
            </div>

            {/* --- SET 1: CANDIDATE REVIEWS CARDS --- */}
            <div className={`auth-slide-card left-card ${activeSet === 1 ? "" : "hidden"}`} style={{ display: activeSet === 1 ? "block" : "none" }}>
              <div className="auth-card-lbl">Candidate Review</div>
              <div className="auth-card-head">
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Marcus K.</span>
                <span className="auth-badge-p green">Invited</span>
              </div>
              <p className="auth-review-quote">
                "Before, my resume was dry. After using the AI rewrites, I got interviews at Netflix and Stripe!"
              </p>
              <div className="auth-review-role">Software Engineer</div>
            </div>

            <div className={`auth-slide-card center-card ${activeSet === 1 ? "" : "hidden"}`} style={{ display: activeSet === 1 ? "block" : "none" }}>
              <div className="auth-card-lbl">Recruiter Feedback</div>
              <div className="auth-card-head">
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Sarah L.</span>
                <span className="auth-badge-p gold">Verified</span>
              </div>
              <p className="auth-review-quote">
                "The ATS parser check is spot-on. Verified Greenhouse layouts correctly and saved me hours."
              </p>
              <div className="auth-review-role">Talent Acquisition Specialist</div>
            </div>

            <div className={`auth-slide-card right-card ${activeSet === 1 ? "" : "hidden"}`} style={{ display: activeSet === 1 ? "block" : "none" }}>
              <div className="auth-card-lbl">Manager Review</div>
              <div className="auth-card-head">
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>David W.</span>
                <span className="auth-badge-p red">100% Match</span>
              </div>
              <p className="auth-review-quote">
                "Quantified bullets make resumes stand out. This roaster highlights exactly what we look for."
              </p>
              <div className="auth-review-role">VP of Engineering</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
