export default function ImportanceBadge({ level }) {
  const diamonds = { critical: 4, high: 3, medium: 2, low: 1 };
  const count = diamonds[level] || 2;
  return (
    <span className={`importance importance--${level}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="importance-diamond" />
      ))}
      <span style={{ marginLeft: 4 }}>{level?.toUpperCase()}</span>
    </span>
  );
}
