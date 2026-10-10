
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const search = (e) => {
    e.preventDefault();
    nav(`/shop?q=${encodeURIComponent(q)}`);
  };

  return (
    <header>
      <div className="topbar">
        <Link to="/" className="logo">🛍️ Shop<span>Verse</span></Link>
        <form className="search-wrap" onSubmit={search}>
          <span>🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, brands…" />
        </form>
        <nav className="nav-actions">
          {user?.role === 'admin' && (
            <NavLink to="/admin" className="nav-btn"><span className="ico">🛠️</span>Admin</NavLink>
          )}
          {user ? (
            <>
              <NavLink to="/orders" className="nav-btn"><span className="ico">📦</span>Orders</NavLink>
              <NavLink to="/profile" className="nav-btn"><span className="ico">👤</span>{user.name.split(' ')[0]}</NavLink>
              <button className="nav-btn" onClick={logout}><span className="ico">↩️</span>Logout</button>
            </>
          ) : (
            <NavLink to="/login" className="nav-btn"><span className="ico">👤</span>Login</NavLink>
          )}
          <NavLink to="/cart" className="nav-btn badge-wrap">
            <span className="ico">🛒</span>Cart
            {count > 0 && <span className="cart-badge">{count}</span>}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
