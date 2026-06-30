function Dashboard() {
  return (
    <div className="dashboard-container">
      <h1>Welcome to AI Resume Analyser</h1>
      <p>Upload your resume and get instant AI-powered feedback.</p>

        <div className="top-bar">
        <button>👤 Profile</button>
        <button>🔔 Notifications</button>
        <button>⚙️ Settings</button>
        <button>🌙 Dark Mode</button>
        <button>🚪 Logout</button>
      </div>

       <div className="actions-section">
        <button>📄 View Reports</button>
        <button>📥 Download PDF Report</button>
        <button>📊 Compare Resumes</button>
        <button>🎯 Job Match Analysis</button>
        <button>📝 Generate Cover Letter</button>
        <button>💡 AI Suggestions</button>
      </div>
    </div>
  );
}

export default Dashboard;