import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>AI<span>Resume</span></h1>
      </div>
      <div className="navbar-actions">
        {isLoggedIn ? (
          <>
            <span>Welcome, User</span>
            <button className="btn btn-danger" onClick={() => setIsLoggedIn(false)}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-outline" onClick={() => setIsLoggedIn(true)}>
              Login
            </button>
            <Link to="/signup">
              <button className="btn btn-primary">Sign Up</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
