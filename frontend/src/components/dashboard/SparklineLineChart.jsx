export function SparklineLineChart({ strokeColor, curveDirection }) {
  const points = curveDirection === "up" 
    ? "5,20 20,18 35,12 50,15 65,5" 
    : "5,5 20,8 35,15 50,12 65,22";
  return (
    <svg viewBox="0 0 70 25" className="summary-sparkline-wrap">
      <polyline
        fill="none"
        stroke={strokeColor || "var(--navy)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
