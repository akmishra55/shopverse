
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await login(form.email, form.password);
      nav(loc.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="panel auth-card" onSubmit={submit}>
        <h2>Welcome back 👋</h2>
        <p className="modal-sub">Demo accounts — admin@shopverse.dev / Admin@123 or user@shopverse.dev / User@123</p>
        {loc.search.includes('expired') && <p className="hint">Your session expired — please login again.</p>}
        <div className="field"><label>Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="field"><label>Password</label>
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        {error && <p className="error-line">{error}</p>}
        <button className="btn btn-brand full" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
        <p className="swap">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </main>
  );
}
