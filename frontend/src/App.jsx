import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import { AppRoutes } from "./routes";
import { getProfile, refreshSession, logout as apiLogout } from "./api/auth";
const clearAccessToken = () => {};

const APP_SHELL_PATHS = ["/dashboard", "/resumes", "/history", "/analytics", "/settings", "/upload"];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }, []);

  // ─── Session Restore via httpOnly Cookie ──────────────────────
  // On mount, attempt to refresh the access token using the httpOnly
  // refresh cookie. If successful, fetch the user profile. If not,
  // the user needs to log in again. No localStorage token involved.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        await refreshSession();
        const profile = await getProfile();
        setIsLoggedIn(true);
        setUser({ name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl || null });
      } catch {
        // No valid session — user must log in
        clearAccessToken();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser({ name: userData.name, email: userData.email, avatarUrl: userData.avatarUrl || null });
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // Ensure client-side logout even if API call fails
    }
    clearAccessToken();
    setIsLoggedIn(false);
    setUser({ name: "" });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc" }}>
        <div style={{ fontSize: "1rem", color: "#64748b" }}>Loading Resume Roaster...</div>
      </div>
    );
  }

  const useAppShell = APP_SHELL_PATHS.some((p) => location.pathname.startsWith(p));

  return (
    <>
      {isLoggedIn && useAppShell ? (
        <div className="app-main-layout">
          <Sidebar handleLogout={handleLogout} user={user} />
          <div className="app-main-content">
            <AppRoutes isLoggedIn={isLoggedIn} handleLogout={handleLogout} handleLogin={handleLogin} user={user} onUpdateUser={(u) => setUser(u)} />
          </div>
        </div>
      ) : (
        <>
          <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
          <AppRoutes isLoggedIn={isLoggedIn} handleLogout={handleLogout} handleLogin={handleLogin} user={user} onUpdateUser={(u) => setUser(u)} />
        </>
      )}
    </>
  );
}

export default App;
