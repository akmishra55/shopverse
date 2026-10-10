
import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ name: user.name, password: '' });
  const [msg, setMsg] = useState('');

  const save = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.patch('/auth/profile', {
        name: form.name,
        ...(form.password && { password: form.password }),
      });
      setUser(data.user);
      setForm({ ...form, password: '' });
      setMsg('✅ Profile updated');
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Update failed'));
    }
  };

  return (
    <main className="section" style={{ maxWidth: 640 }}>
      <div className="panel">
        <div className="profile-head">
          <div className="avatar">{user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
          <div>
            <h3>{user.name}</h3>
            <p className="modal-sub" style={{ margin: 0 }}>{user.email} • {user.role}</p>
          </div>
          <button className="btn btn-outline" style={{ marginLeft: 'auto' }} onClick={logout}>Logout</button>
        </div>
        <form onSubmit={save}>
          <div className="field"><label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>New password (optional)</label>
            <input type="password" placeholder="Leave blank to keep current" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          {msg && <p style={{ marginBottom: 10 }}>{msg}</p>}
          <button className="btn btn-brand">Save Changes</button>
        </form>
      </div>
    </main>
  );
}
