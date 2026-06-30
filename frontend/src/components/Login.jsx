import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    navigate("/Dashboard");
};
  return (
    <div className="page-wrapper">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="subtitle">Login to continue</p>

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
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn-submit" onClick={handleLogin}> Log In</button>


        <p className="auth-footer">
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
