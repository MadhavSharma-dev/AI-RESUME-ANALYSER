import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { sidebarLinkHover } from "../../lib/motion";
import favIcon from "../../assets/brand/fav-icon.png";
import "./Sidebar.css";

const MotionNavLink = motion.create(NavLink);

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    tooltip: "Command Center",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    to: "/resumes",
    label: "Resumes",
    tooltip: "Resume Vault",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="12" y2="17" />
      </svg>
    )
  },
  {
    to: "/history",
    label: "History",
    tooltip: "Past Roasts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
    )
  },
  {
    to: "/analytics",
    label: "Analytics",
    tooltip: "Analytics Lab",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    )
  }
];

function Sidebar({ user }) {
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={favIcon} alt="Resume Roaster" className="sidebar-logo-img" />
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <div key={item.to} className="sidebar-tooltip-wrapper">
              <MotionNavLink
                to={item.to}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
                aria-label={item.tooltip}
                whileHover={sidebarLinkHover}
              >
                {item.icon}
              </MotionNavLink>
              <span className="sidebar-tooltip">{item.tooltip}</span>
            </div>
          ))}
        </nav>

        {/* Bottom: settings + profile avatar */}
        <div className="sidebar-bottom">
          {/* Settings */}
          <div className="sidebar-tooltip-wrapper">
            <MotionNavLink
              to="/settings"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              aria-label="Settings"
              whileHover={sidebarLinkHover}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </MotionNavLink>
            <span className="sidebar-tooltip">Settings</span>
          </div>

          {/* Profile Avatar */}
          <div className="sidebar-tooltip-wrapper">
            <MotionNavLink
              to="/settings"
              className={({ isActive }) => `sidebar-avatar-link ${isActive ? "active" : ""}`}
              aria-label="Your Profile"
              whileHover={{ scale: 1.08 }}
            >
              <div className="sidebar-avatar">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name || "Avatar"} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  initials
                )}
              </div>
            </MotionNavLink>
            <span className="sidebar-tooltip">Your Profile</span>
          </div>
        </div>
      </aside>

      {/* Touch-Friendly Mobile Bottom Nav for <= 768px */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `mobile-bottom-item ${isActive ? "active" : ""}`}
            aria-label={item.label}
          >
            <div className="mobile-bottom-icon">{item.icon}</div>
            <span className="mobile-bottom-label">{item.label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/settings"
          className={({ isActive }) => `mobile-bottom-item ${isActive ? "active" : ""}`}
          aria-label="Settings"
        >
          <div className="mobile-bottom-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <span className="mobile-bottom-label">Settings</span>
        </NavLink>
      </nav>
    </>
  );
}

export default Sidebar;
