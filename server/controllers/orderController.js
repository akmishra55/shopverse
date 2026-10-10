
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { stripe, MOCK_MODE } = require('../config/stripe');

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 49;

/**
 * POST /api/orders — the heart of the platform.
 *
 * Zero-trust pricing: totals are computed HERE from DB prices, never from the client.
 * Overselling protection: stock decrements inside a MongoDB transaction with a
 * `countInStock >= qty` guard, so N concurrent buyers can't take the last unit.
 */
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    // 1. Fetch fresh products for ALL items
    const ids = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: ids } }).session(session);
    if (products.length !== new Set(ids.map(String)).size) {
      throw new ApiError(400, 'One or more products no longer exist');
    }

    // 2. Snapshot items + compute totals server-side
    let itemsPrice = 0;
    const snapshot = items.map((i) => {
      const p = products.find((x) => x._id.equals(i.product));
      if (p.countInStock < i.qty) {
        throw new ApiError(409, `“${p.name}” has only ${p.countInStock} left in stock`);
      }
      itemsPrice += p.price * i.qty;
      return { product: p._id, name: p.name, image: p.images[0], qty: i.qty, price: p.price };
    });
    const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const totalPrice = itemsPrice + shippingPrice;

    // 3. Transaction: decrement stock (guarded) + create the order — all or nothing
    let order;
    await session.withTransaction(async () => {
      const decrements = snapshot.map((s) => ({
        updateOne: {
          filter: { _id: s.product, countInStock: { $gte: s.qty } }, // atomic guard
          update: { $inc: { countInStock: -s.qty, soldCount: s.qty } },
        },
      }));
      const result = await Product.bulkWrite(decrements, { session });
      if (result.modifiedCount !== snapshot.length) {
        throw new ApiError(409, 'Insufficient stock — please review your cart');
      }

      [order] = await Order.create(
        [{
          user: req.user._id,
          items: snapshot,
          shippingAddress,
          paymentMethod,
          itemsPrice,
          shippingPrice,
          totalPrice,
          paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        }],
        { session }
      );
    });

    // 4. Create the Stripe PaymentIntent (after the order exists)
    let clientSecret = null;
    if (paymentMethod === 'card') {
      if (MOCK_MODE) {
        // No API keys → simulate an instant successful charge.
        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        await order.save();
        clientSecret = 'mock_secret_' + order._id;
      } else {
        const intent = await stripe.paymentIntents.create({
          amount: Math.round(totalPrice * 100), // smallest currency unit
          currency: 'inr',
          automatic_payment_methods: { enabled: true },
          metadata: { orderId: String(order._id) },
        });
        order.stripePaymentIntentId = intent.id;
        await order.save();
        clientSecret = intent.client_secret;
      }
    }

    res.status(201).json({ order, clientSecret });
  } catch (err) {
    next(err);
  } finally {
    await session.endSession();
  }
};

// GET /api/orders/mine — current user's orders (newest first)
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.json(orders);
  } catch (err) { next(err); }
};

// GET /api/orders — admin: all orders with pagination
exports.getOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 15;
    const [orders, total] = await Promise.all([
      Order.find().sort('-createdAt').skip((page - 1) * limit).limit(limit).populate('user', 'name email'),
      Order.countDocuments(),
    ]);
    res.json({ orders, page, pages: Math.ceil(total / limit), total });
  } catch (err) { next(err); }
};

// GET /api/orders/:id — owner or admin only
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) throw new ApiError(404, 'Order not found');
    const isOwner = order.user._id.equals(req.user._id);
    if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'Access denied');
    res.json(order);
  } catch (err) { next(err); }
};

/** Valid forward moves in the order state machine. */
const NEXT_STATUS = {
  placed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

// PATCH /api/orders/:id/status — admin state machine w/ stock restore on cancel
exports.updateOrderStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { status } = req.body;
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new ApiError(404, 'Order not found');

      if (!NEXT_STATUS[order.status].includes(status)) {
        throw new ApiError(409, `Cannot move order from “${order.status}” to “${status}”`);
      }

      order.status = status;
      if (status === 'delivered') { order.deliveredAt = new Date(); order.paymentStatus = 'paid'; }
      if (status === 'cancelled') {
        // Restore inventory for every line item
        const restores = order.items.map((i) => ({
          updateOne: {
            filter: { _id: i.product },
            update: { $inc: { countInStock: i.qty, soldCount: -i.qty } },
          },
        }));
        await Product.bulkWrite(restores, { session });
        order.paymentStatus = 'refunded';
      }
      await order.save({ session });
      res.locals.order = order;
    });
    res.json(res.locals.order);
  } catch (err) {
    next(err);
  } finally {
    await session.endSession();
  }
};
