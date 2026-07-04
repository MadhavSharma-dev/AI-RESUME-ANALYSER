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

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<div className="home-placeholder">Home page coming soon...</div>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login handleLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard handleLogout={handleLogout} /> : <Navigate to="/login" replace />}
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
