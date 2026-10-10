
import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <main className="section"><div className="empty">
      <div className="big">🧭</div><h3>404 — Page not found</h3>
      <Link to="/" className="btn btn-brand" style={{ marginTop: 14 }}>Go Home</Link>
    </div></main>
  );
}
