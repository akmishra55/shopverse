
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Loader from '../../components/Loader';

const inr = (n) => '₹' + n.toLocaleString('en-IN');
const NEXT = { placed: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  const load = () => api.get('/products/admin/stats').then((r) => setStats(r.data));
  useEffect(() => { load(); }, []);

  const advance = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status });
    load();
  };

  if (!stats) return <Loader />;
  const { recentOrders } = stats;

  return (
    <main className="section">
      <div className="section-head"><h2>Admin Dashboard 🛠️</h2><Link to="/admin/products" className="btn btn-outline">Manage Products</Link></div>

      <div className="stat-grid">
        <div className="stat-card"><small>Total Revenue</small><b>{inr(stats.revenue)}</b></div>
        <div className="stat-card"><small>Orders</small><b>{stats.orders}</b></div>
        <div className="stat-card"><small>Pending</small><b>{stats.pendingOrders}</b></div>
        <div className="stat-card"><small>Users</small><b>{stats.users}</b></div>
        <div className="stat-card"><small>Products</small><b>{stats.products}</b></div>
      </div>

      <div className="admin-cols">
        <div className="panel">
          <h3 style={{ marginBottom: 12 }}>Recent Orders</h3>
          {recentOrders.map((o) => (
            <div key={o._id} className="admin-order">
              <div>
                <b>#{o._id.slice(-8).toUpperCase()}</b> — {o.user?.name}<br />
                <small style={{ color: 'var(--muted)' }}>{o.items.reduce((s, i) => s + i.qty, 0)} items • {inr(o.totalPrice)} • <span className="pill amber">{o.status}</span></small>
              </div>
              <div className="admin-btns">
                {NEXT[o.status].map((s) => (
                  <button key={s} className={`btn mini ${s === 'cancelled' ? 'btn-danger' : 'btn-ghost'}`}
                    onClick={() => advance(o._id, s)}>
                    {s === 'delivered' ? '✓ Deliver' : s[0].toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3 style={{ marginBottom: 12 }}>Top Products</h3>
          {stats.topProducts.map((t, i) => (
            <div key={t._id} className="admin-order">
              <span>{i + 1}. {t._id.slice(0, 40)}</span>
              <b>{t.qty} sold • {inr(t.revenue)}</b>
            </div>
          ))}
          {!stats.topProducts.length && <p className="modal-sub">No sales yet.</p>}
        </div>
      </div>
    </main>
  );
}
