import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile, uploadAvatar, getUserStats } from "../../api/auth";
import HeaderUtils from "../common/HeaderUtils";
import "./Settings.css";

function Settings({ user, onUpdateUser, handleLogout }) {
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "Candidate");
  const [email, setEmail] = useState(user?.email || "candidate@roaster.ai");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [stats, setStats] = useState({ uploads: 0, analyses: 0, rewrites: 0 });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
  }, [user]);

  // FIX 2: Fetch real user activity stats from DB
  useEffect(() => {
    getUserStats()
      .then((data) => {
        if (data && typeof data.uploads === "number") {
          setStats(data);
        }
      })
      .catch((err) => console.error("Failed to load user stats", err));
  }, []);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    if (handleLogout) {
      await handleLogout();
    }
    navigate("/login");
  };

  // FIX 1: Avatar Image File Picker & Upload Handler
  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");

    // Validation 1: Allowed image mime types
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(file.type)) {
      setErrorMsg("Only JPG, PNG, and WebP image files are allowed.");
      return;
    }

    // Validation 2: Max file size (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg("File size exceeds 5MB limit. Please select a smaller image.");
      return;
    }

    // Optimistic UI Preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploadingAvatar(true);

    try {
      const updatedUser = await uploadAvatar(file);
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      setAvatarPreview(null);
    } catch (err) {
      setAvatarPreview(null);
      const msg = err.response?.data?.message || err.message || "Failed to upload avatar.";
      setErrorMsg(msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // FIX 3: Profile Form Save with Email Format + MX DNS Check
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address format (e.g. name@domain.com).");
      return;
    }

    setSavingProfile(true);

    try {
      const updated = await updateProfile(name, email);
      if (onUpdateUser) {
        onUpdateUser(updated);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update profile.";
      setErrorMsg(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const initials = (name || "Candidate")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const currentAvatarSrc = avatarPreview || user?.avatarUrl;

  return (
    <div className="settings-page">
      {/* Top Header Row with HeaderUtils */}
      <div className="settings-top-header">
        <div>
          <h1 className="settings-title">Account & Settings</h1>
          <p className="settings-sub">Manage your profile, preferences, and subscription.</p>
        </div>
        <HeaderUtils />
      </div>

      {/* Inline Error Message */}
      {errorMsg && (
        <div className="settings-error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {errorMsg}
        </div>
      )}

      {/* Main Grid */}
      <div className="settings-main-grid">
        {/* Left Column: Avatar Hero Card & Profile Form */}
        <div className="settings-col">
          {/* FIX 1: Avatar Hero Card with Clickable File Upload */}
          <div className="settings-card avatar-hero-card">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarSelect}
              style={{ display: "none" }}
            />
            <div
              className="avatar-circle-wrap"
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile picture"
            >
              {currentAvatarSrc ? (
                <img src={currentAvatarSrc} alt={name} className="avatar-img" />
              ) : (
                <div className="avatar-circle">{initials}</div>
              )}
              <div className="avatar-edit-overlay">
                {uploadingAvatar ? (
                  <span className="avatar-spinner">...</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                )}
              </div>
            </div>
            <div className="avatar-details">
              <h3>{name}</h3>
              <p>{email}</p>
              <span className="badge-pro">PRO CANDIDATE</span>
            </div>
          </div>

          {/* FIX 3: Profile Form Card with Email Editing */}
          <div className="settings-card">
            <h2 className="settings-section-title">Profile Information</h2>
            <form onSubmit={handleSaveProfile} className="settings-form">
              <div className="settings-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="settings-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button type="submit" className="settings-save-btn" disabled={savingProfile}>
                {savingProfile ? "Validating Email..." : saved ? "Saved ✓" : "Save Changes"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Dynamic Usage Stats & Danger Zone */}
        <div className="settings-col">
          {/* FIX 2: Subscription & Real Activity Stats Card */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h2 className="settings-section-title">Usage & Activity Stats</h2>
              <span className="badge-status">Active</span>
            </div>
            <p className="settings-card-sub">Real-time counts from your database activity</p>
            <div className="settings-stats-grid">
              <div className="settings-stat-item">
                <span className="stat-val">{stats.uploads}</span>
                <span className="stat-lbl">Resumes</span>
              </div>
              <div className="settings-stat-item">
                <span className="stat-val">{stats.analyses}</span>
                <span className="stat-lbl">Analyses</span>
              </div>
              <div className="settings-stat-item">
                <span className="stat-val">{stats.rewrites}</span>
                <span className="stat-lbl">Rewrites</span>
              </div>
            </div>
          </div>

          {/* Session & Security Card */}
          <div className="settings-card">
            <h2 className="settings-section-title">Session & Security</h2>
            <p className="settings-card-sub">Manage your active session and sign out securely</p>
            <button 
              type="button" 
              className="settings-logout-action-btn"
              onClick={() => setShowLogoutModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Log Out of Session
            </button>
          </div>

          {/* Danger Zone Card */}
          <div className="settings-card settings-danger-card">
            <h2 className="settings-section-title danger">Danger Zone</h2>
            <p className="settings-danger-text">
              Permanently remove your account, resumes, and analysis history from Resume Roaster.
            </p>
            <button className="settings-danger-btn" type="button" onClick={() => alert("Account deletion requires admin confirmation.")}>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutModal && (
        <div className="settings-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            <h3>Log Out of Resume Roaster?</h3>
            <p>Are you sure you want to log out? Your server-side refresh token cookie will be invalidated and your session closed.</p>
            <div className="settings-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="btn-modal-confirm" onClick={confirmLogout}>
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
