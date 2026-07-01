import '../styles/ProfileStats.css';

export function StatDisplay({ value, label }) {
  return (
    <div className='div-stat div-single-stat'>
      <p style={{fontSize: 40}}>{value}</p>
      <p>{label}</p>
    </div>
  );
}