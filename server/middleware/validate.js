
const ApiError = require('../utils/ApiError');

/**
 * validate(schema) → runs a Zod schema against { body, query, params }.
 * Rejects malformed input BEFORE it ever reaches a controller.
 */
exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return next(new ApiError(400, msg));
  }
  next();
};
