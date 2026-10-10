
/**
 * Stripe is OPTIONAL. Without STRIPE_SECRET_KEY the API runs in
 * "mock payment mode": PaymentIntents are faked and orders are
 * marked paid instantly, so the full flow runs with zero config.
 */
const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const MOCK_MODE = !stripe;
if (MOCK_MODE) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set — running in MOCK PAYMENT MODE');
}

module.exports = { stripe, MOCK_MODE };
