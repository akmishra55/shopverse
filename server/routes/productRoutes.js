
const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { reviewSchema, productSchema } = require('../utils/schemas');

// Admin stats must be matched BEFORE '/:id'
router.get('/admin/stats', protect, adminOnly, ctrl.getAdminStats);

router.get('/', ctrl.getProducts);
router.get('/featured', ctrl.getFeatured);
router.get('/:id', ctrl.getProduct);
router.post('/:id/reviews', protect, validate(reviewSchema), ctrl.addReview);

router.post('/', protect, adminOnly, validate(productSchema), ctrl.createProduct);
router.put('/:id', protect, adminOnly, validate(productSchema), ctrl.updateProduct);
router.delete('/:id', protect, adminOnly, ctrl.deleteProduct);

module.exports = router;
