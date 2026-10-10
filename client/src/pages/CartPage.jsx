
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const inr = (n) => '₹' + n.toLocaleString('en-IN');

export default function CartPage() {
  const { items, setQty, subtotal, shipping, total, clear } = useCart();
  const nav = useNavigate();

  if (!items.length) return (
    <main className="section"><div className="empty"><div className="big">🛒</div>
      <h3>Your cart is empty</h3><p>Add some products to get started.</p>
      <Link to="/shop" className="btn btn-brand" style={{ marginTop: 14 }}>Browse Products</Link>
    </div></main>
  );

  return (
    <main className="section">
      <div className="section-head"><h2>Shopping Cart ({items.length} items)</h2>
        <button className="btn btn-outline" onClick={clear}>Clear cart</button></div>
      <div className="cart-layout">
        <div className="panel">
          {items.map((i) => (
            <div key={i._id} className="cart-item">
              <img src={i.image} alt={i.name} />
              <div className="ci-info">
                <div className="ci-title">{i.name}</div>
                <div className="ci-price">{inr(i.price)}</div>
                <div className="qty">
                  <button onClick={() => setQty(i._id, i.qty - 1)}>−</button><b>{i.qty}</b>
                  <button onClick={() => setQty(i._id, Math.min(10, i.qty + 1))}>+</button>
                </div>
              </div>
              <b>{inr(i.price * i.qty)}</b>
            </div>
          ))}
        </div>
        <div className="panel summary">
          <h3>Order Summary</h3>
          <div className="total-row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
          <div className="total-row"><span>Delivery</span><span>{shipping === 0 ? <b className="free">FREE</b> : inr(shipping)}</span></div>
          {shipping > 0 && <p className="hint">Add {inr(999 - subtotal)} more for free delivery 🎉</p>}
          <div className="total-row grand"><span>Total</span><span>{inr(total)}</span></div>
          <button className="btn btn-primary full" onClick={() => nav('/checkout')}>Proceed to Checkout →</button>
          <p className="secure">🔒 256-bit SSL • Stripe secure checkout</p>
        </div>
      </div>
    </main>
  );
}
