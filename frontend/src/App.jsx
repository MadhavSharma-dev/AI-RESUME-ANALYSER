import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Signup from "./components/Signup";
import Login from "./components/Login";
import "./App.css";
import Dashboard from "./components/Dashboard";
import UploadResume from "./components/uploadResume";
import Home from "./components/Home";
import History from "./components/History";
import Analytics from "./components/Analytics";
import Settings from "./components/Settings";
import Resumes from "./components/Resumes";
import { getProfile } from "./lib/api";

const APP_SHELL_PATHS = ["/dashboard", "/resumes", "/history", "/analytics", "/settings", "/upload"];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const location = useLocation();

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getProfile()
        .then((profile) => {
          setIsLoggedIn(true);
          setUser({ name: profile.name, email: profile.email });
        })
        .catch((err) => {
          console.error("Profile check failed:", err.message);
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser({ name: userData.name, email: userData.email });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser({ name: "" });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", fontWeight: 600 }}>
        Loading Session...
      </div>
    );
  }

  const useAppShell = APP_SHELL_PATHS.some((p) => location.pathname.startsWith(p));

  return (
    <>
      {isLoggedIn && useAppShell ? (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
          <Sidebar handleLogout={handleLogout} user={user} theme={theme} toggleTheme={toggleTheme} />
          <div style={{ marginLeft: "60px", flex: 1, display: "flex", flexDirection: "column" }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard handleLogout={handleLogout} user={user} />} />
              <Route path="/resumes" element={<Resumes user={user} />} />
              <Route path="/history" element={<History user={user} />} />
              <Route path="/analytics" element={<Analytics user={user} />} />
              <Route path="/settings" element={<Settings user={user} />} />
              <Route path="/upload" element={<UploadResume />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      ) : (
        <>
          <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Home isLoggedIn={isLoggedIn} handleLogout={handleLogout} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login handleLogin={handleLogin} />} />
            <Route path="/dashboard" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
            <Route path="/history" element={isLoggedIn ? <Navigate to="/history" replace /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      )}
    </>
  );
}

export default App;
