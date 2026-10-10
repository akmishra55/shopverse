
const Order = require('../models/Order');
const Product = require('../models/Product');
const { stripe } = require('../config/stripe');

/**
 * POST /api/payments/webhook  (Stripe → us)
 *
 * The webhook is the SINGLE SOURCE OF TRUTH for payment status.
 * It is: idempotent (safe on retries), signature-verified in production,
 * and works even if the customer's browser closes mid-payment.
 */
exports.stripeWebhook = async (req, res) => {
  let event;
  try {
    if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        req.body, // RAW body — required for signature verification
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // Dev/mock mode: no signature available
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      // $-conditional update = idempotent: retries/de-duplicates are no-ops
      await Order.findOneAndUpdate(
        { stripePaymentIntentId: intent.id, paymentStatus: 'pending' },
        { paymentStatus: 'paid', paidAt: new Date() }
      );
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      await Order.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { paymentStatus: 'failed' }
      );
      // Stock was already decremented at order creation — restore it.
      const order = await Order.findOne({ stripePaymentIntentId: intent.id });
      if (order && order.status !== 'cancelled') {
        await Product.bulkWrite(
          order.items.map((i) => ({
            updateOne: {
              filter: { _id: i.product },
              update: { $inc: { countInStock: i.qty, soldCount: -i.qty } },
            },
          }))
        );
        order.status = 'cancelled';
        await order.save();
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    return res.status(500).json({ received: false });
  }

  // Always ack within Stripe's timeout — failures are logged & retryable
  res.json({ received: true });
};

// GET /api/config — public runtime config (Stripe publishable key)
exports.getPublicConfig = (req, res) =>
  res.json({ stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null, mockMode: !stripe });
