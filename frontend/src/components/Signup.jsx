import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Signup() {

  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = () => {
    if(
      !name || 
      !email ||
      !phone ||
      ! password ||
      ! confirmPassword
    ){
      alert("Please fill all fields ");
      return
    }
  }

  if(password !== confirmPassword){
    alert("Passwords do not match");
  }
  navigate("/login");

  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        <h1>Create Account</h1>
        <p className="subtitle">Join AI Resume Analyser and land your dream job</p>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            type="text"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button className="btn-submit" onClick={() => {
          handleSignup(); navigate("/login");}}>Create Account </button>

        <p className="login-link" >
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;