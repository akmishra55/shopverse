
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Loader from '../../components/Loader';

const empty = { name: '', brand: '', category: 'Electronics', description: '', price: '', mrp: '', countInStock: 10, images: '', isFeatured: false };

export default function AdminProducts() {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = (page = 1) => api.get('/products', { params: { page, limit: 20, sort: 'newest' } }).then((r) => setData(r.data));
  useEffect(() => { load(); }, []);

  const startEdit = (p) => {
    setEditing(p || 'new');
    setError('');
    setForm(p ? { ...p, images: (p.images || []).join(', ') } : empty);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      price: Number(form.price), mrp: form.mrp ? Number(form.mrp) : undefined,
      countInStock: Number(form.countInStock),
      images: String(form.images).split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editing === 'new') await api.post('/products', payload);
      else await api.put(`/products/${editing._id}`, payload);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    load();
  };

  if (!data) return <Loader />;

  return (
    <main className="section">
      <div className="section-head">
        <h2>Manage Products</h2>
        <button className="btn btn-brand" onClick={() => startEdit(null)}>+ Add Product</button>
      </div>

      {editing && (
        <form className="panel" onSubmit={save} style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>{editing === 'new' ? 'New Product' : 'Edit Product'}</h3>
          <div className="form-row">
            <div className="field grow"><label>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Brand</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['Electronics', 'Fashion', 'Home & Living', 'Accessories'].map((c) => <option key={c}>{c}</option>)}
              </select></div>
            <div className="field"><label>Price (₹) *</label>
              <input required type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="field"><label>MRP</label>
              <input type="number" min="0" value={form.mrp || ''} onChange={(e) => setForm({ ...form, mrp: e.target.value })} /></div>
            <div className="field"><label>Stock *</label>
              <input required type="number" min="0" value={form.countInStock} onChange={(e) => setForm({ ...form, countInStock: e.target.value })} /></div>
          </div>
          <div className="field"><label>Description *</label>
            <textarea rows="2" required minLength="10" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="field"><label>Image URLs (comma-separated)</label>
            <input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} /></div>
          <label className="check"><input type="checkbox" checked={!!form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured on homepage</label>
          {error && <p className="error-line">{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="btn btn-brand">{editing === 'new' ? 'Create' : 'Save Changes'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="panel">
        {data.products.map((p) => (
          <div key={p._id} className="cart-item">
            <img src={p.images?.[0]} alt="" style={{ width: 56, height: 56 }} />
            <div className="ci-info">
              <div className="ci-title">{p.name}</div>
              <small style={{ color: 'var(--muted)' }}>₹{p.price.toLocaleString('en-IN')} • stock {p.countInStock} • {p.category}{p.isFeatured ? ' • ⭐ featured' : ''}</small>
            </div>
            <button className="btn btn-ghost mini" onClick={() => startEdit(p)}>Edit</button>
            <button className="btn btn-danger mini" onClick={() => del(p._id)}>Delete</button>
          </div>
        ))}
      </div>
    </main>
  );
}
