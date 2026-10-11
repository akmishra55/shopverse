
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';

const inr = (n) => '₹' + n.toLocaleString('en-IN');

function CheckoutForm({ config, onDone }) {
  const { items, total, shipping, clear } = useCart();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [form, setForm] = useState({
    line: '', city: '', state: '', pin: '', phone: '',
    label: 'Home',
    ...(user?.addresses?.[0] || {}),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');

    try {
      // 1. Create the order server-side (transaction + stock guard happens there)
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ product: i._id, qty: i.qty })),
        shippingAddress: form,
        paymentMethod: 'card',
      });

      // 2. Confirm the Stripe PaymentIntent (skipped entirely in mock mode)
      if (!data.clientSecret?.startsWith('mock_')) {
        const result = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: { card: elements.getElement(CardElement), billing_details: { name: user.name } },
        });
        if (result.error) {
          setError(result.error.message);
          setBusy(false);
          return;
        }
      }

      clear();
      onDone(data.order._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Order failed — please try again');
      setBusy(false);
    }
  };

  return (
    <form className="checkout-grid" onSubmit={submit}>
      <div className="panel">
        <h3>Delivery Address</h3>
        <div className="form-row">
          <div className="field"><label>Label</label>
            <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}>
              <option>Home</option><option>Office</option><option>Other</option>
            </select></div>
          <div className="field grow"><label>Address</label>
            <input required value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} placeholder="Flat, street, area" /></div>
        </div>
        <div className="form-row">
          <div className="field"><label>City</label>
            <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="field"><label>State</label>
            <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="field"><label>PIN (6 digits)</label>
            <input required pattern="\d{6}" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} /></div>
          <div className="field"><label>Phone (10 digits)</label>
            <input required pattern="\d{10}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>

        {!config.mockMode && (
          <>
            <h3 style={{ marginTop: 18 }}>Card Details</h3>
            <div className="field"><label>Card</label>
              <div className="card-element"><CardElement options={{ style: { base: { fontSize: '15px' } } } } /></div>
            </div>
          </>
        )}
        {config.mockMode && <p className="hint">💡 Stripe keys not configured — running in <b>mock payment mode</b>. Charges are simulated.</p>}
        {error && <p className="error-line">{error}</p>}
      </div>

      <div className="panel summary">
        <h3>Summary</h3>
        {items.map((i) => (
          <div key={i._id} className="total-row"><span>{i.name.slice(0, 34)}{i.name.length > 34 ? '…' : ''} ×{i.qty}</span><span>{inr(i.price * i.qty)}</span></div>
        ))}
        <div className="total-row"><span>Delivery</span><span>{shipping === 0 ? 'FREE' : inr(shipping)}</span></div>
        <div className="total-row grand"><span>Total</span><span>{inr(total)}</span></div>
        <button className="btn btn-primary full" disabled={busy || (!config.mockMode && !stripe)}>
          {busy ? 'Processing…' : `Pay ${inr(total)} →`}
        </button>
        <p className="secure">🔒 PCI-DSS • 3-D Secure • Webhook-verified</p>
      </div>
    </form>
  );
}

export default function Checkout() {
  const [config, setConfig] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [placedId, setPlacedId] = useState(null);
  const { items } = useCart();
  const { user, booting } = useAuth();

  useEffect(() => {
    api.get('/config').then((r) => {
      setConfig(r.data);
      if (r.data.stripePublishableKey) setStripePromise(loadStripe(r.data.stripePublishableKey));
    });
  }, []);

  if (booting || !config) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: '/checkout' }} replace />;
  if (placedId) return <Navigate to={`/orders/${placedId}?placed=1`} replace />;
  if (!items.length) return <Navigate to="/cart" replace />;

  return (
    <main className="section">
      <div className="section-head"><h2>Secure Checkout 🔒</h2></div>
            <Elements stripe={stripePromise}>
        <CheckoutForm config={config} onDone={setPlacedId} />
      </Elements>
    </main>
  );
}
