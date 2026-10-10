
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';

const inr = (n) => '₹' + n.toLocaleString('en-IN');
const STATUS_COLOR = { placed: 'amber', processing: 'blue', shipped: 'violet', delivered: 'green', cancelled: 'red' };

export default function Orders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get('/orders/mine').then((r) => setOrders(r.data)).catch(() => setOrders([]));
  }, []);

  if (!orders) return <Loader />;
  if (!orders.length) return (
    <main className="section"><div className="empty"><div className="big">📦</div>
      <h3>No orders yet</h3><p>Your purchases will appear here.</p>
      <Link to="/shop" className="btn btn-brand" style={{ marginTop: 14 }}>Start Shopping</Link>
    </div></main>
  );

  return (
    <main className="section">
      <div className="section-head"><h2>My Orders</h2></div>
      {orders.map((o) => (
        <Link to={`/orders/${o._id}`} key={o._id} className="panel order-row">
          <div className="order-imgs">
            {o.items.slice(0, 3).map((i) => <img key={i.product} src={i.image} alt="" />)}
          </div>
          <div className="oi-info">
            <b>{o.items.map((i) => i.name).join(', ').slice(0, 60)}…</b>
            <small style={{ color: 'var(--muted)', display: 'block' }}>
              {new Date(o.createdAt).toLocaleString('en-IN')} • {o.items.reduce((s, i) => s + i.qty, 0)} item(s)
            </small>
          </div>
          <div style={{ textAlign: 'right' }}>
            <b>{inr(o.totalPrice)}</b><br />
            <span className={`pill ${STATUS_COLOR[o.status]}`}>{o.status}</span>
          </div>
        </Link>
      ))}
    </main>
  );
}
