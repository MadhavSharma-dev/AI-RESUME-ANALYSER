export function SparklineBarChart() {
  return (
    <svg viewBox="0 0 70 25" className="summary-sparkline-wrap">
      <rect x="2" y="15" width="6" height="10" rx="1.5" fill="#288c52" opacity="0.4" />
      <rect x="12" y="10" width="6" height="15" rx="1.5" fill="#288c52" opacity="0.5" />
      <rect x="22" y="18" width="6" height="7" rx="1.5" fill="#288c52" opacity="0.3" />
      <rect x="32" y="8" width="6" height="17" rx="1.5" fill="#288c52" opacity="0.6" />
      <rect x="42" y="12" width="6" height="13" rx="1.5" fill="#288c52" opacity="0.7" />
      <rect x="52" y="4" width="6" height="21" rx="1.5" fill="#288c52" />
    </svg>
  );
}
