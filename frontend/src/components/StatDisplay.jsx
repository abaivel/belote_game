export function StatDisplay({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{fontSize: 40}}>{value}</p>
      <p>{label}</p>
    </div>
  );
}