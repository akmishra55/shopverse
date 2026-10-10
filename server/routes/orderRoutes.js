
const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createOrderSchema, orderStatusSchema } = require('../utils/schemas');

router.use(protect); // every order route requires a logged-in user
router.post('/', validate(createOrderSchema), ctrl.createOrder);
router.get('/mine', ctrl.getMyOrders);
router.get('/', adminOnly, ctrl.getOrders);
router.get('/:id', ctrl.getOrderById);
router.patch('/:id/status', adminOnly, validate(orderStatusSchema), ctrl.updateOrderStatus);

module.exports = router;
