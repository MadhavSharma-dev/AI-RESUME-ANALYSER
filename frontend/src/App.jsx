import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Signup from "./components/Signup";
import Login from "./components/Login";
import "./App.css";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<div className="home-placeholder">Home page coming soon...</div>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login/>}/>
        <Route path="/dashboard" element={<Dashboard/>} />
      </Routes>
    </>
  );
}
export default App;