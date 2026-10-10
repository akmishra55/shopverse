
export default function Footer() {
  return (
    <footer>
      <div className="foot-inner">
        <div>
          <div className="logo" style={{ marginBottom: 10 }}>🛍️ Shop<span style={{ color: 'var(--accent)' }}>Verse</span></div>
          <p>MERN-stack e-commerce — JWT auth, Stripe payments, MongoDB transactions, Redis caching, Docker.</p>
        </div>
        <div><h4>Shop</h4><a href="/shop">All Products</a><a href="/shop?category=Electronics">Electronics</a><a href="/shop?category=Fashion">Fashion</a></div>
        <div><h4>Account</h4><a href="/orders">My Orders</a><a href="/profile">Profile</a><a href="/cart">Cart</a></div>
        <div><h4>Project</h4><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a><a href="/api/health">API Health</a></div>
      </div>
      <div className="foot-bottom">© 2026 ShopVerse • Built with MERN • Demo payments via Stripe (test mode)</div>
    </footer>
  );
}
