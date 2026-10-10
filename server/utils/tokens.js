
const jwt = require('jsonwebtoken');

// Short-lived access token travels in the Authorization header.
const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

// Long-lived refresh token travels ONLY in an httpOnly cookie (XSS-safe).
const signRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

module.exports = { signAccessToken, signRefreshToken };
