import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchResumesList } from "../../api/resumes";
import "./HeaderUtils.css";

export default function HeaderUtils({ searchVal, onSearchChange, placeholder = "Search resumes, target roles..." }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [search, setSearch] = useState(searchVal || "");
  const [resumes, setResumes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (searchVal !== undefined) {
      setSearch(searchVal);
    }
  }, [searchVal]);

  // Fetch resumes for global search
  useEffect(() => {
    fetchResumesList()
      .then((data) => setResumes(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  // Global ⌘K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (onSearchChange) onSearchChange(val);
    setShowDropdown(val.trim().length > 0);
  };

  const filteredResumes = resumes.filter((r) => {
    if (!search.trim()) return false;
    const q = search.toLowerCase();
    const nameMatch = r.name && r.name.toLowerCase().includes(q);
    const targetMatch = r.versions && r.versions.some(v => v.targetRole && v.targetRole.toLowerCase().includes(q));
    return nameMatch || targetMatch;
  }).slice(0, 5);

  return (
    <div className="global-header-utils">
      <div className="gh-search-wrap">
        <div className="gh-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={handleChange}
            onFocus={() => { if (search.trim()) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
        </div>

        {/* Live Search Dropdown */}
        {showDropdown && filteredResumes.length > 0 && (
          <div className="gh-search-dropdown">
            {filteredResumes.map((resItem) => (
              <div
                key={resItem._id}
                className="gh-search-item"
                onMouseDown={() => {
                  setSearch("");
                  setShowDropdown(false);
                  navigate(`/resumes/${resItem._id}`);
                }}
              >
                <div>
                  <p className="gh-item-name">{resItem.name.replace(/\.[^.]+$/, "")}</p>
                  <p className="gh-item-sub">
                    {resItem.versions?.length || 1} versions • {resItem.versions?.[resItem.versions.length - 1]?.targetRole || "General"}
                  </p>
                </div>
                <span className="gh-item-action">Open ↗</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="gh-about-btn" onClick={() => navigate("/about")} title="About Resume Roaster">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        About
      </button>
    </div>
  );
}
