import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/dashboard/Dashboard";
import About from "./components/dashboard/About";
import Resumes from "./components/resume/Resumes";
import ResumeDetail from "./components/resume/ResumeDetail";
import History from "./components/dashboard/History";
import Analytics from "./components/analysis/Insights";
import Settings from "./components/auth/Settings";
import UploadResume from "./components/resume/UploadDropzone";
import Home from "./components/landing/Landing";
import Signup from "./components/auth/Register";
import Login from "./components/auth/Login";

export function AppRoutes({ isLoggedIn, handleLogout, handleLogin, user, onUpdateUser }) {
  return (
    <Routes>
      {/* Public Routes */}
      {!isLoggedIn && (
        <>
          <Route path="/" element={<Home isLoggedIn={isLoggedIn} handleLogout={handleLogout} />} />
          <Route path="/signup" element={<Signup handleLogin={handleLogin} />} />
          <Route path="/login" element={<Login handleLogin={handleLogin} />} />
          <Route path="/about" element={<About user={user} />} />
          <Route path="/settings" element={<Settings user={user} onUpdateUser={onUpdateUser} />} />
          <Route path="/dashboard" element={<Navigate to="/login" replace />} />
          <Route path="/history" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {/* Protected Routes */}
      {isLoggedIn && (
        <>
          <Route path="/dashboard" element={<Dashboard handleLogout={handleLogout} user={user} />} />
          <Route path="/about" element={<About user={user} />} />
          <Route path="/resumes" element={<Resumes user={user} />} />
          <Route path="/resumes/:id" element={<ResumeDetail user={user} />} />
          <Route path="/history" element={<History user={user} />} />
          <Route path="/analytics" element={<Analytics user={user} />} />
          <Route path="/settings" element={<Settings user={user} onUpdateUser={onUpdateUser} handleLogout={handleLogout} />} />
          <Route path="/profile" element={<Navigate to="/settings" replace />} />
          <Route path="/upload" element={<UploadResume />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
}
