import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

function Login({ handleLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLoginClick = () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }
    // Derive display name from email until backend provides it
    const name = email.split("@")[0];
    handleLogin(name);
    navigate("/dashboard");
  };

  return (
    <div className="page-wrapper">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="subtitle">Login to continue</p>

        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn-submit" onClick={handleLoginClick}>Log In</button>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
