import { useState } from "react";
import "./Settings.css";

function Settings({ user }) {
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // Placeholder — wire to API when profile update endpoint exists
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-sub">Manage your account and preferences.</p>
      </div>

      <div className="settings-card">
        <h2 className="settings-section-title">Profile</h2>
        <form onSubmit={handleSave} className="settings-form">
          <div className="settings-field">
            <label>Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="settings-field">
            <label>Email</label>
            <input type="email" value={email} disabled />
          </div>
          <button type="submit" className="settings-save-btn">
            {saved ? "Saved ✓" : "Save changes"}
          </button>
        </form>
      </div>

      <div className="settings-card">
        <h2 className="settings-section-title">Danger Zone</h2>
        <p className="settings-danger-text">
          Deleting your account is permanent. All resumes and history will be lost.
        </p>
        <button className="settings-danger-btn" type="button" disabled>
          Delete account
        </button>
      </div>
    </div>
  );
}

export default Settings;
