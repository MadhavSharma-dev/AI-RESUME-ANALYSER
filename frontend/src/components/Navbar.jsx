import { Link } from "react-router-dom";
import "../App.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>AI<span>Resume</span></h1>
      </div>
      <div className="navbar-actions">
        <Link to="/login">
          <button className="btn btn-outline">Login</button>
        </Link>
        <Link to="/signup">
          <button className="btn btn-primary">Sign Up</button>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;