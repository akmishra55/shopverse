
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/** Verifies the short-lived access token and attaches the fresh user doc. */
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Not authorized — no token provided');

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'Account no longer exists');
    req.user = user;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(401, 'Session expired — please login again'));
  }
};

/** Gate for admin-only routes (must run AFTER protect). */
exports.adminOnly = (req, res, next) =>
  req.user?.role === 'admin'
    ? next()
    : next(new ApiError(403, 'Admin access required'));
