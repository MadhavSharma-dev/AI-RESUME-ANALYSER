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
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const location = useLocation();

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

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
        setUser({ name: profile.name, email: profile.email });
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
    setUser({ name: userData.name, email: userData.email });
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
          <div style={{ marginLeft: "120px", flex: 1, display: "flex", flexDirection: "column" }}>
              <AppRoutes isLoggedIn={isLoggedIn} handleLogout={handleLogout} handleLogin={handleLogin} user={user} />
          </div>
        </div>
      ) : (
        <>
          <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
          <AppRoutes isLoggedIn={isLoggedIn} handleLogout={handleLogout} handleLogin={handleLogin} user={user} />
        </>
      )}
    </>
  );
}

export default App;
