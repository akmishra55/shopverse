
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { cache } = require('../config/redis');

const SORT_WHITELIST = { price: 'price', '-price': '-price', rating: '-avgRating', newest: '-createdAt' };

/**
 * GET /api/products
 * Pagination + filters + sorting, served from Redis when possible.
 * Cache key includes the full query string → no stale or cross-query leaks.
 */
exports.getProducts = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, featured } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(48, parseInt(req.query.limit) || 8);
    const sort = SORT_WHITELIST[req.query.sort] || '-createdAt';

    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const hit = await cache.get(cacheKey);
    if (hit) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(hit));
    }

    const filter = {};
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select('-reviews')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const payload = {
      products,
      page,
      pages: Math.ceil(total / limit),
      total,
    };
    await cache.set(cacheKey, JSON.stringify(payload));
    res.set('X-Cache', 'MISS');
    res.json(payload);
  } catch (err) { next(err); }
};

// GET /api/products/featured — homepage strip
exports.getFeatured = async (req, res, next) => {
  try {
    const key = 'products:featured';
    const hit = await cache.get(key);
    if (hit) return res.json(JSON.parse(hit));
    const products = await Product.find({ isFeatured: true }).limit(8).select('-reviews');
    await cache.set(key, JSON.stringify(products), 600);
    res.json(products);
  } catch (err) { next(err); }
};

// GET /api/products/:id  (accepts ObjectId or slug)
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = /^[0-9a-fA-F]{24}$/.test(id)
      ? await Product.findById(id)
      : await Product.findOne({ slug: id });
    if (!product) throw new ApiError(404, 'Product not found');

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    }).limit(4).select('-reviews');

    res.json({ product, related });
  } catch (err) { next(err); }
};

// POST /api/products/:id/reviews — atomic rating update (no read-modify-write race)
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) throw new ApiError(404, 'Product not found');

    const already = product.reviews.find((r) => r.user.equals(req.user._id));
    if (already) throw new ApiError(409, 'You already reviewed this product');

    const newAvg =
      (product.avgRating * product.numReviews + rating) / (product.numReviews + 1);

    const updated = await Product.findOneAndUpdate(
      { _id: product._id, 'reviews.user': { $ne: req.user._id } }, // race-safe guard
      {
        $push: { reviews: { user: req.user._id, name: req.user.name, rating, comment } },
        $set: { avgRating: Math.round(newAvg * 10) / 10 },
        $inc: { numReviews: 1 },
      },
      { new: true }
    );
    res.status(201).json({ avgRating: updated.avgRating, numReviews: updated.numReviews });
  } catch (err) { next(err); }
};

/* ---------------- Admin ---------------- */

// POST /api/products  (admin)
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    await cache.invalidatePrefix('products:'); // invalidate on write
    res.status(201).json(product);
  } catch (err) { next(err); }
};

// PUT /api/products/:id  (admin)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) throw new ApiError(404, 'Product not found');
    await cache.invalidatePrefix('products:');
    res.json(product);
  } catch (err) { next(err); }
};

// DELETE /api/products/:id  (admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new ApiError(404, 'Product not found');
    await cache.invalidatePrefix('products:');
    res.json({ message: 'Product deleted' });
  } catch (err) { next(err); }
};

// GET /api/products/admin/stats  (admin) — aggregation dashboard
exports.getAdminStats = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const User = require('../models/User');
    const [revenueAgg] = await Order.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'pending'] }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
    ]);

    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } } } },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]);

    const [users, products, pendingOrders, recentOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ status: 'placed' }),
      Order.find().sort('-createdAt').limit(6).populate('user', 'name email'),
    ]);

    res.json({
      revenue: revenueAgg?.revenue || 0,
      orders: revenueAgg?.orders || 0,
      users,
      products,
      pendingOrders,
      topProducts,
      recentOrders,
    });
  } catch (err) { next(err); }
};
