
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';

const inr = (n) => '₹' + n.toLocaleString('en-IN');
const STEPS = ['placed', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch((e) => setError(e.response?.data?.message || 'Not found'));
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [id]);

  if (error) return <main className="section"><div className="empty"><h3>{error}</h3></div></main>;
  if (!order) return <Loader />;

  const stepIdx = order.status === 'cancelled' ? -1 : STEPS.indexOf(order.status);

  return (
    <main className="section" style={{ maxWidth: 860 }}>
      {params.get('placed') && <div className="success-banner">🎉 Order placed successfully! Confirmation sent to your email.</div>}

      <div className="panel">
        <div className="order-top">
          <div>
            <h2 style={{ fontSize: 20 }}>Order #{order._id.slice(-8).toUpperCase()}</h2>
            <small style={{ color: 'var(--muted)' }}>{new Date(order.createdAt).toLocaleString('en-IN')}</small>
          </div>
          <span className={`pill ${order.status === 'cancelled' ? 'red' : 'green'}`}>{order.status}</span>
        </div>

        {order.status !== 'cancelled' && (
          <div className="timeline">
            {STEPS.map((s, i) => (
              <div key={s} className={`tstep ${i <= stepIdx ? 'done' : ''}`}>
                <div className="dot">{i < stepIdx || order.status === 'delivered' ? '✓' : i + 1}</div>
                <small>{s[0].toUpperCase() + s.slice(1)}</small>
              </div>
            ))}
          </div>
        )}

        {order.items.map((i) => (
          <div key={i.product} className="cart-item">
            <img src={i.image} alt="" />
            <div className="ci-info"><div className="ci-title">{i.name}</div>
              <div className="ci-price">{inr(i.price)} × {i.qty}</div></div>
            <b>{inr(i.price * i.qty)}</b>
          </div>
        ))}

        <div className="totals">
          <div className="total-row"><span>Items</span><span>{inr(order.itemsPrice)}</span></div>
          <div className="total-row"><span>Delivery</span><span>{order.shippingPrice === 0 ? 'FREE' : inr(order.shippingPrice)}</span></div>
          <div className="total-row grand"><span>Paid ({order.paymentMethod.toUpperCase()})</span><span>{inr(order.totalPrice)}</span></div>
          <div className="total-row"><span>Payment status</span><span className={`pill ${order.paymentStatus === 'paid' ? 'green' : order.paymentStatus === 'failed' ? 'red' : 'amber'}`}>{order.paymentStatus}</span></div>
        </div>

        <p className="hint">📍 {order.shippingAddress?.label}: {order.shippingAddress?.line}, {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pin} • {order.shippingAddress?.phone}</p>
        <Link to="/shop" className="btn btn-outline" style={{ marginTop: 12 }}>← Continue shopping</Link>
      </div>
    </main>
  );
}
