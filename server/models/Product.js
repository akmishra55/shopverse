
const mongoose = require('mongoose');
const crypto = require('crypto');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, unique: true, index: true },
    brand: { type: String, default: 'Generic', maxlength: 60 },
    category: { type: String, required: true, index: true },
    description: { type: String, required: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
    // Denormalized for cheap sorting/filtering; updated atomically on review.
    avgRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', brand: 'text' });

productSchema.pre('validate', function (next) {
  if (!this.slug) {
    const base = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    this.slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
