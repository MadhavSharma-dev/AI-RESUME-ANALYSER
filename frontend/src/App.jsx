import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Signup from "./components/Signup";
import "./App.css";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<div className="home-placeholder">Home page coming soon...</div>} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </>
  );
}
export default App;