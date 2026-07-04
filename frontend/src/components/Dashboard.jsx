import { useNavigate } from "react-router-dom";
import "../App.css";

function Dashboard({ handleLogout }) {
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to AI Resume Analyser</h1>
        <p>Upload your resume and get instant AI-powered feedback.</p>
      </div>

      <div className="top-bar">
        <button className="btn btn-outline">👤 Profile</button>
        <button className="btn btn-outline">🔔 Notifications</button>
        <button className="btn btn-outline">⚙️ Settings</button>
        <button className="btn btn-outline">🌙 Dark Mode</button>
        <button className="btn btn-danger" onClick={onLogout}>🚪 Logout</button>
      </div>

      <div className="actions-section">
        <button className="action-card" onClick={() => navigate("/upload")}>
          <span className="action-icon">📄</span>
          <span>Upload Resume</span>
        </button>
        <button className="action-card">
          <span className="action-icon">📥</span>
          <span>Download PDF Report</span>
        </button>
        <button className="action-card">
          <span className="action-icon">📊</span>
          <span>Compare Resumes</span>
        </button>
        <button className="action-card">
          <span className="action-icon">🎯</span>
          <span>Job Match Analysis</span>
        </button>
        <button className="action-card">
          <span className="action-icon">📝</span>
          <span>Generate Cover Letter</span>
        </button>
        <button className="action-card">
          <span className="action-icon">💡</span>
          <span>AI Suggestions</span>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
