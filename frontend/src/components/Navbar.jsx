import { Link, useNavigate } from "react-router-dom";
import "../App.css";

function Navbar({ isLoggedIn, handleLogout }) {
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <h1>AI<span>Resume</span></h1>
        </Link>
      </div>
      <div className="navbar-actions">
        {isLoggedIn ? (
          <>
            <span>My Account</span>
            <button className="btn btn-danger" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/signup" className="btn btn-primary">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
