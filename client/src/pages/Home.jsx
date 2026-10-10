
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const CATS = ['Electronics', 'Fashion', 'Home & Living', 'Accessories'];

export default function Home() {
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    api.get('/products/featured').then((r) => setFeatured(r.data)).catch(() => setFeatured([]));
  }, []);

  return (
    <main>
      <div className="hero">
        <div className="hero-card">
          <h1>The Big Festive Sale is Live ⚡</h1>
          <p>Up to 70% off across electronics, fashion, home & more. Free delivery over ₹999 — secured by Stripe.</p>
          <Link to="/shop" className="btn btn-primary">Shop Now →</Link>
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Shop by Category</h2></div>
        <div className="cat-grid">
          {CATS.map((c) => (
            <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} className="cat-tile">
              <span>{c.split(' ')[0] === 'Home' ? '🏠' : c === 'Electronics' ? '💻' : c === 'Fashion' ? '👟' : '🎒'}</span>
              <b>{c}</b>
            </Link>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Featured Products</h2><Link to="/shop" className="link-more">View all →</Link></div>
        {!featured ? <Loader /> : (
          <div className="grid">{featured.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        )}
      </div>

      <div className="section perks">
        <div className="perk">🚚 <b>Fast Delivery</b><br />Free over ₹999</div>
        <div className="perk">🔒 <b>Secure Payments</b><br />Stripe PCI-DSS</div>
        <div className="perk">↩️ <b>Easy Returns</b><br />7-day window</div>
        <div className="perk">🛡️ <b>Buyer Protection</b><br />Full refunds</div>
      </div>
    </main>
  );
}
