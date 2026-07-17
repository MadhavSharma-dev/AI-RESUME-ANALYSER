export function ChronologicalScoreTrend({ trends }) {
  // trends is an array of scores, e.g. [71, 80, 63, 79, 58, 72, 81, 60, 64, 80]
  const data = trends?.length >= 2 ? trends : [71, 80, 63, 79, 58, 72, 81, 60, 64, 80];
  
  const height = 130;
  const width = 800;
  const paddingX = 40;
  const graphWidth = 720;
  const graphHeight = 80;
  const bottomY = 110;

  const points = data.map((score, index) => {
    const x = paddingX + (index / (data.length - 1)) * graphWidth;
    const y = bottomY - (score / 100) * graphHeight;
    return { x, y, score, index };
  });

  const lineD = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${lineD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

  return (
    <div style={{ width: "100%", height: "150px" }}>
      <svg viewBox="0 0 800 140" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1F2A44" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1F2A44" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1="30" y1="30" x2="770" y2="30" stroke="rgba(0,0,0,0.02)" strokeWidth="1" />
        <line x1="30" y1="70" x2="770" y2="70" stroke="rgba(0,0,0,0.02)" strokeWidth="1" />
        <line x1="30" y1="110" x2="770" y2="110" stroke="rgba(0,0,0,0.04)" strokeWidth="1.5" />

        {/* Shaded Area */}
        <path d={areaD} fill="url(#trendGrad)" />

        {/* Line Curve */}
        <path d={lineD} fill="none" stroke="#1F2A44" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Markers */}
        {points.map((p) => (
          <g key={p.index}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="#C6A75E" stroke="#ffffff" strokeWidth="2" />
            <text x={p.x} y="128" textAnchor="middle" fontSize="0.68rem" fontWeight="700" fill="var(--text-secondary)">
              #{p.index + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
