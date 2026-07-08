import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Signup from "./components/Signup";
import Login from "./components/Login";
import "./App.css";
import Dashboard from "./components/Dashboard";
import UploadResume from "./components/uploadResume";
import Home from "./components/Home";
import { getProfile } from "./lib/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Load user profile on mount if token exists
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--beige-light)", color: "var(--navy)", fontWeight: 600 }}>
        Loading Session...
      </div>
    );
  }

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home isLoggedIn={isLoggedIn} handleLogout={handleLogout} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login handleLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard handleLogout={handleLogout} user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/upload"
          element={isLoggedIn ? <UploadResume /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </>
  );
}

export default App;
