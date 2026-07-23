export function ScoreEvolutionChart({ dataPoints, versionScores, onPointClick }) {
  // If dataPoints provided (from real backend overview), use them; otherwise fallback to versionScores or default
  const rawList = dataPoints?.length > 0 
    ? dataPoints 
    : (versionScores?.length >= 2 ? versionScores.map((s, idx) => ({ atsScore: s, versionNumber: idx + 1 })) : [
        { atsScore: 58, versionNumber: 1, resumeName: "Senior Frontend Engineer Resume" },
        { atsScore: 74, versionNumber: 2, resumeName: "Senior Frontend Engineer Resume" },
        { atsScore: 86, versionNumber: 3, resumeName: "Senior Frontend Engineer Resume" }
      ]);

  const paddingX = 40;
  const graphWidth = 380;
  const graphHeight = 80;
  const bottomY = 100;

  const points = rawList.map((item, index) => {
    const score = item.atsScore ?? item.overallScore ?? 0;
    const x = rawList.length === 1 
      ? paddingX + graphWidth / 2 
      : paddingX + (index / (rawList.length - 1)) * graphWidth;
    const y = bottomY - (score / 100) * graphHeight;
    return { x, y, score, item, label: item.versionNumber ? `V${item.versionNumber}` : `#${index + 1}` };
  });

  const lineD = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${lineD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

  return (
    <svg viewBox="0 0 460 120" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F2A44" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#1F2A44" stopOpacity="0.00" />
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      <line x1="30" y1="20" x2="430" y2="20" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
      <line x1="30" y1="60" x2="430" y2="60" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
      <line x1="30" y1="100" x2="430" y2="100" stroke="rgba(0,0,0,0.04)" strokeWidth="1.5" />

      {/* Shaded Area */}
      <path d={areaD} fill="url(#chartGrad)" />

      {/* Trend Line */}
      <path d={lineD} fill="none" stroke="#1F2A44" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Markers & Labels */}
      {points.map((p, idx) => (
        <g 
          key={idx} 
          style={{ cursor: "pointer" }}
          onClick={() => onPointClick && onPointClick(p.item)}
        >
          {/* Label score above */}
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="0.75rem" fontWeight="800" fill="var(--navy)">
            {p.score}
          </text>
          {/* Inner circle */}
          <circle cx={p.x} cy={p.y} r="6" fill="#C6A75E" stroke="#ffffff" strokeWidth="2" />
          {/* Version text below */}
          <text x={p.x} y="115" textAnchor="middle" fontSize="0.65rem" fontWeight="700" fill="var(--text-secondary)">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
