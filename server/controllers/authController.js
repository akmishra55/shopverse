
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signAccessToken, signRefreshToken } = require('../utils/tokens');

const REFRESH_COOKIE = 'sv_rt';
const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

const cookieOpts = () => ({
  httpOnly: true,            // unreadable by JS → XSS can't steal it
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',         // sent only to auth routes — minimal exposure
});

function respondWithTokens(res, user, refreshToken) {
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts());
  return res.json({ accessToken: signAccessToken(user), user: user.toSafeJSON() });
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) throw new ApiError(409, 'Email already registered');
    const user = await User.create({ name, email, password });
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = hash(refreshToken);
    await user.save();
    respondWithTokens(res, user, refreshToken);
  } catch (err) { next(err); }
};

// POST /api/auth/login   (rate-limited at the router level)
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // .select('+password') because the field is hidden by default
    const user = await User.findOne({ email }).select('+password +refreshTokenHash');
    if (!user || !(await user.matchPassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = hash(refreshToken); // rotate on every login
    await user.save();
    respondWithTokens(res, user, refreshToken);
  } catch (err) { next(err); }
};

// POST /api/auth/refresh — rotate refresh token, issue new access token.
// Called silently by the axios interceptor on 401 — users never re-login.
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) throw new ApiError(401, 'No refresh token');

    let decoded;
    try {
      decoded = require('jsonwebtoken').verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw new ApiError(401, 'Refresh token expired — please login again');
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash');
    // Compare hashes — if they differ, the token was already rotated (replay/reuse)
    if (!user || user.refreshTokenHash !== hash(token)) {
      throw new ApiError(401, 'Refresh token reused or revoked — login again');
    }

    const nextToken = signRefreshToken(user);
    user.refreshTokenHash = hash(nextToken);
    await user.save();
    respondWithTokens(res, user, nextToken);
  } catch (err) { next(err); }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (token) {
      const user = await User.findOne({ refreshTokenHash: hash(token) }).select('+refreshTokenHash');
      if (user) { user.refreshTokenHash = null; await user.save(); } // revoke server-side
    }
    res.clearCookie(REFRESH_COOKIE, { ...cookieOpts(), maxAge: 0 });
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.getMe = (req, res) => res.json({ user: req.user.toSafeJSON() });

// PATCH /api/auth/addresses — manage address book
exports.updateAddresses = async (req, res, next) => {
  try {
    req.user.addresses = req.body.addresses || [];
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) { next(err); }
};

// PATCH /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    if (name) req.user.name = name;
    if (password) {
      if (password.length < 6) throw new ApiError(400, 'Password must be ≥ 6 characters');
      req.user.password = password; // pre-save hook re-hashes
    }
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) { next(err); }
};

// bcrypt is required here indirectly via User model — silence linters
void bcrypt;
