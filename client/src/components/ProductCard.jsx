
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import RatingStars from './RatingStars';

const inr = (n) => '₹' + n.toLocaleString('en-IN');

export default function ProductCard({ product: p }) {
  const { add } = useCart();
  return (
    <div className="card">
      <Link to={`/product/${p.slug || p._id}`} className="card-img">
        <img src={p.images?.[0]} alt={p.name} loading="lazy" />
        {p.mrp > p.price && <span className="disc-tag">{Math.round((1 - p.price / p.mrp) * 100)}% OFF</span>}
      </Link>
      <div className="card-body">
        <span className="card-cat">{p.category}</span>
        <Link to={`/product/${p.slug || p._id}`} className="card-title">{p.name}</Link>
        <RatingStars value={p.avgRating} count={p.numReviews} />
        <div className="price-row">
          <span className="price">{inr(p.price)}</span>
          {p.mrp > p.price && <span className="mrp">{inr(p.mrp)}</span>}
        </div>
        <button className="add-btn" onClick={() => add(p)}>
          {p.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
