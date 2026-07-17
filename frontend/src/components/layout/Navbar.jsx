import { Link, useNavigate, useLocation } from "react-router-dom";
import "../../App.css";
import "../landing/Landing.css"; // Ensure floating capsule styling is loaded

function Navbar({ isLoggedIn, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Hide Navbar completely on Login and Signup pages
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  // If on Home Page, render the floating capsule navbar
  if (location.pathname === "/") {
    return (
      <div className="nav-capsule-container">
        <nav className="nav-capsule">
          <div className="nav-logo">
            <div className="nav-logo-icon">R</div>
            <span>Resume Roaster</span>
          </div>

          <div className="nav-links">
            <button className="nav-link" onClick={() => scrollToSection("features")}>Features</button>
            <button className="nav-link" onClick={() => scrollToSection("how-it-works")}>How it works</button>
            {isLoggedIn ? (
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            ) : (
              <span className="nav-link" style={{ cursor: "not-allowed", opacity: 0.5 }}>Pricing</span>
            )}
          </div>

          <div className="nav-actions">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="btn-capsule">Dashboard</Link>
                <button className="nav-link" onClick={onLogout}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-signin">Sign in</Link>
                <Link to="/signup" className="btn-capsule">
                  Get started
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    );
  }

  // Render the standard dashboard/auth navbar otherwise
  return (
    <nav className="navbar" style={{ backgroundColor: "#ffffff", borderBottom: "1px solid rgba(31, 42, 68, 0.08)", padding: "0 2rem" }}>
      <div className="navbar-brand">
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div className="nav-logo-icon" style={{ width: "32px", height: "32px", fontSize: "1.15rem", borderRadius: "10px" }}>R</div>
          <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--navy)", fontSize: "1.15rem" }}>Resume Roaster</span>
        </Link>
      </div>
      <div className="navbar-actions">
        {isLoggedIn ? (
          <>
            <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)" }}>My Account</span>
            <button className="btn btn-danger" onClick={onLogout} style={{ border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)" }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline" style={{ border: "1px solid var(--navy)", color: "var(--navy)" }}>Login</Link>
            <Link to="/signup" className="btn btn-primary" style={{ backgroundColor: "var(--navy)", color: "#ffffff" }}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
