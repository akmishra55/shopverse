
export default function RatingStars({ value, count }) {
  return (
    <span className="stars">
      {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}
      {count !== undefined && <small> {Number(value).toFixed(1)} ({count.toLocaleString('en-IN')})</small>}
    </span>
  );
}
