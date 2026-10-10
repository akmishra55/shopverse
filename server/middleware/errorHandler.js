
const ApiError = require('../utils/ApiError');

exports.notFound = (req, res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

/** Central error handler — normalizes Mongoose, Zod & thrown errors. */
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'CastError') { status = 400; message = 'Invalid id format'; }
  if (err.code === 11000) { status = 409; message = `Duplicate value for: ${Object.keys(err.keyValue).join(', ')}`; }
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join('; '); }

  if (status === 500) console.error('💥', err);

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && status === 500 ? { stack: err.stack } : {}),
  });
};
