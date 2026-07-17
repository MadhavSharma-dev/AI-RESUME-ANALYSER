export function AtsReadinessGauge({ score }) {
  // Semi-circle arc details: radius 55, center (80, 70)
  // Arc length is pi * r = 3.1415 * 55 ≈ 172.8
  const radius = 55;
  const strokeWidth = 10;
  const arcLength = Math.PI * radius;
  const strokeOffset = arcLength * (1 - Math.min(score, 100) / 100);

  return (
    <div style={{ position: "relative", width: "160px", height: "100px", margin: "0 auto" }}>
      <svg viewBox="0 0 160 100" style={{ width: "100%", height: "100%" }}>
        {/* Background track */}
        <path
          d="M 25 75 A 55 55 0 0 1 135 75"
          fill="none"
          stroke="rgba(31, 42, 68, 0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active colored arc */}
        <path
          d="M 25 75 A 55 55 0 0 1 135 75"
          fill="none"
          stroke="#C6A75E"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={strokeOffset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      {/* Center text overlay */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "0",
          right: "0",
          textAlign: "center"
        }}
      >
        <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--navy)", fontFamily: "var(--font-display)" }}>
          {score}
        </div>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginTop: "-2px" }}>
          out of 100
        </div>
      </div>
    </div>
  );
}
