import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchActivity, backfillActivity } from "../../api/dashboard";
import HeaderUtils from "../common/HeaderUtils";
import "./History.css";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - target) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

function groupByDay(activities) {
  const groups = {};
  activities.forEach((act) => {
    const d = new Date(act.createdAt);
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(act);
  });
  // Sort keys descending
  return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function scoreColor(score) {
  if (score >= 80) return "#288c52";
  if (score >= 60) return "#d4881a";
  return "#e53e6d";
}

// ── Icons ─────────────────────────────────────────────────────────────────────

import { ActivityTypeIcon } from "./ActivityTypeIcon";

// ── Component ─────────────────────────────────────────────────────────────────

const FILTERS = ["all", "upload", "analysis", "rewrite"];
const FILTER_LABELS = { all: "All", upload: "Uploads", analysis: "Analyses", rewrite: "Rewrites" };

function History({ user }) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchActivity()
      .then(async (data) => {
        if (data.length === 0) {
          // No activity yet — backfill from existing resumes
          await backfillActivity().catch(() => {});
          const refreshed = await fetchActivity().catch(() => []);
          setActivities(refreshed);
        } else {
          setActivities(data);
        }
      })
      .catch((err) => console.error("Failed to load activity:", err.message))
      .finally(() => setLoading(false));
  }, []);

  // Counts per filter (for badges)
  const counts = useMemo(() => {
    const c = { all: activities.length, upload: 0, analysis: 0, rewrite: 0 };
    activities.forEach((a) => { c[a.type] = (c[a.type] || 0) + 1; });
    return c;
  }, [activities]);

  // Apply filter + search
  const filtered = useMemo(() => {
    return activities.filter((a) => {
      const matchesFilter = filter === "all" || a.type === filter;
      const matchesSearch =
        search === "" ||
        a.resumeName.toLowerCase().includes(search.toLowerCase()) ||
        (a.targetRole && a.targetRole.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [activities, filter, search]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : "there";

  function activityLabel(act) {
    const shortName = act.resumeName.replace(/\.[^.]+$/, ""); // strip extension
    if (act.type === "upload") {
      return {
        title: `${shortName} uploaded`,
        sub: `Parsed and version V${act.versionNumber} created`
      };
    }
    if (act.type === "analysis") {
      return {
        title: `Analysis complete on ${shortName}`,
        sub: `ATS score ${act.atsScore ?? "—"} / 100`
      };
    }
    if (act.type === "rewrite") {
      return {
        title: `V${act.versionNumber} created for ${shortName}`,
        sub: "Rewrites applied to previous version"
      };
    }
    return { title: act.resumeName, sub: "" };
  }

  return (
    <div className="hist-page">
      {/* ── Header ── */}
      <div className="hist-header">
        <div>
          <h1 className="hist-greeting">Hello, {displayName}.</h1>
          <p className="hist-subtitle">Sharpen your resume with calm, focused AI insights.</p>
        </div>

        <HeaderUtils searchVal={search} onSearchChange={setSearch} />
      </div>

      {/* ── Section heading ── */}
      <div className="hist-section">
        <h2 className="hist-section-title">History</h2>
        <p className="hist-section-sub">Everything you've done across your resumes, in time order.</p>
      </div>

      {/* ── Filter tabs ── */}
      <div className="hist-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`hist-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "rewrite" && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.3rem" }}>
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            )}
            {f === "upload" && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.3rem" }}>
                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
            {FILTER_LABELS[f]}
            <span className="hist-filter-count">{counts[f] || 0}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="hist-empty">Loading history...</div>
      ) : grouped.length === 0 ? (
        <div className="hist-empty">
          {activities.length === 0
            ? "No activity yet. Upload a resume to get started."
            : "No results match your search."}
        </div>
      ) : (
        grouped.map(([dayKey, items]) => (
          <div key={dayKey} className="hist-day-group">
            <div className="hist-day-header">
              <span className="hist-day-label">{formatDateLabel(dayKey)}</span>
              <span className="hist-day-count">{items.length}</span>
            </div>

            <div className="hist-items">
              {items.map((act) => {
                const { title, sub } = activityLabel(act);
                return (
                  <div
                    key={act._id}
                    className="hist-item"
                    onClick={() => navigate(`/dashboard`)}
                    title="Open resume"
                  >
                    <ActivityTypeIcon type={act.type} />

                    <div className="hist-item-body">
                      <span className="hist-item-title">{title}</span>
                      <span className="hist-item-sub">{sub}</span>
                    </div>

                    <div className="hist-item-right">
                      {/* ATS score badge for analysis events */}
                      {act.type === "analysis" && act.atsScore != null && (
                        <span
                          className="hist-score-badge"
                          style={{ background: scoreColor(act.atsScore) }}
                        >
                          {act.atsScore}
                        </span>
                      )}

                      {/* Version badge for upload/rewrite events */}
                      {act.type === "upload" && act.versionNumber != null && (
                        <span className="hist-version-badge hist-version-badge--upload">
                          V{act.versionNumber}
                        </span>
                      )}
                      {act.type === "rewrite" && act.versionNumber != null && (
                        <span className="hist-version-badge hist-version-badge--rewrite">
                          V{act.versionNumber} created
                        </span>
                      )}

                      <span className="hist-item-time">{timeAgo(act.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default History;
