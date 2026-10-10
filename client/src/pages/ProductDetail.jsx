
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import RatingStars from '../components/RatingStars';
import Loader from '../components/Loader';

const inr = (n) => '₹' + n.toLocaleString('en-IN');

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const [data, setData] = useState(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('desc');
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [msg, setMsg] = useState('');

  const load = () => api.get(`/products/${id}`).then((r) => setData(r.data));
  useEffect(() => { setData(null); setQty(1); load(); }, [id]);

  if (!data) return <Loader />;
  const { product: p, related } = data;

  const submitReview = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post(`/products/${p._id}/reviews`, review);
      setReview({ rating: 5, comment: '' });
      setMsg('✅ Review submitted — thanks!');
      load();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Could not submit review'));
    }
  };

  return (
    <main className="section">
      <p className="crumbs"><Link to="/">Home</Link> / <Link to={`/shop?category=${p.category}`}>{p.category}</Link> / {p.name.slice(0, 40)}…</p>
      <div className="pd-grid">
        <div className="pd-gallery">
          <img src={p.images?.[0]} alt={p.name} />
        </div>
        <div>
          <span className="card-cat">{p.brand} • {p.category}</span>
          <h1 className="pd-title">{p.name}</h1>
          <RatingStars value={p.avgRating} count={p.numReviews} />
          <div className="pd-price">
            {inr(p.price)}
            {p.mrp > p.price && <><span className="mrp">{inr(p.mrp)}</span>
            <span className="off">{Math.round((1 - p.price / p.mrp) * 100)}% off</span></>}
          </div>
          <p className="stock-line">{p.countInStock > 0 ? `✅ In stock (${p.countInStock} left)` : '❌ Out of stock'}</p>
          <p className="pd-desc">{p.description}</p>
          <div className="qty-row">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <b>{qty}</b>
              <button onClick={() => setQty(Math.min(10, qty + 1))}>+</button>
            </div>
            <button className="btn btn-brand" disabled={p.countInStock === 0} onClick={() => add(p, qty)}>Add to Cart</button>
          </div>
          <p className="perk-line">🚚 Free delivery over ₹999 &nbsp;•&nbsp; ↩️ 7-day returns &nbsp;•&nbsp; 🛡️ 1-year warranty</p>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'desc' ? 'tab active' : 'tab'} onClick={() => setTab('desc')}>Description</button>
        <button className={tab === 'reviews' ? 'tab active' : 'tab'} onClick={() => setTab('reviews')}>Reviews ({p.reviews.length})</button>
      </div>

      {tab === 'desc' ? (
        <p className="pd-desc" style={{ maxWidth: 760 }}>{p.description} Designed for everyday reliability with premium materials and rigorous quality testing.</p>
      ) : (
        <div style={{ maxWidth: 760 }}>
          {p.reviews.length === 0 && <p className="pd-desc">No reviews yet — be the first!</p>}
          {p.reviews.map((r) => (
            <div key={r._id} className="review">
              <div className="rev-head"><b>{r.name}</b><RatingStars value={r.rating} /><small>{new Date(r.createdAt).toLocaleDateString('en-IN')}</small></div>
              <p>{r.comment}</p>
            </div>
          ))}
          {user && (
            <form className="review-form" onSubmit={submitReview}>
              <h4>Write a review</h4>
              <select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
              <textarea rows="3" placeholder="Share your experience…" value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })} required />
              <button className="btn btn-brand">Submit Review</button>
              {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
            </form>
          )}
        </div>
      )}

      {related.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 40 }}><h2>Related Products</h2></div>
          <div className="grid">{related.map((r) => <ProductCard key={r._id} product={r} />)}</div>
        </>
      )}
    </main>
  );
}
