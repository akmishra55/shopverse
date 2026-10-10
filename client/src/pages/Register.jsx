
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await register(form.name, form.email, form.password);
      nav('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="panel auth-card" onSubmit={submit}>
        <h2>Create your account 🚀</h2>
        <div className="field"><label>Full name</label>
          <input required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="field"><label>Password (min 6 chars)</label>
          <input type="password" required minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        {error && <p className="error-line">{error}</p>}
        <button className="btn btn-brand full" disabled={busy}>{busy ? 'Creating…' : 'Sign Up'}</button>
        <p className="swap">Already a member? <Link to="/login">Login</Link></p>
      </form>
    </main>
  );
}
