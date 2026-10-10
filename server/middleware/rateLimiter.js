
const rateLimit = require('express-rate-limit');

/** Global API limiter — basic DoS protection. */
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests — slow down.' },
});

/** Strict limiter on login/register — defeats online brute-force. */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true, // only failed attempts count
  message: { message: 'Too many attempts — try again in 15 minutes.' },
});
