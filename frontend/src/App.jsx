import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Signup from "./components/Signup";
import Login from "./components/Login";
import "./App.css";
import Dashboard from "./components/Dashboard";
import UploadResume from "./components/uploadResume";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "" });
  const [resumes, setResumes] = useState([]);

  const handleLogin = (name) => {
    setIsLoggedIn(true);
    setUser({ name });
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser({ name: "" });
  };
  const handleResumeUploaded = (file) => {
    const newResume = {
      id: Date.now(),
      name: file.name,
      updated: new Date().toLocaleDateString("en-GB").replace(/\//g, "/"),
      versions: 1,
      file,
    };
    setResumes((prev) => [newResume, ...prev]);
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<div className="home-placeholder">Home page coming soon...</div>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login handleLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard handleLogout={handleLogout} user={user} resumes={resumes} setResumes={setResumes} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/upload"
          element={isLoggedIn ? <UploadResume onResumeUploaded={handleResumeUploaded} /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </>
  );
}

export default App;
