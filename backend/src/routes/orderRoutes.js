const express = require('express');
const router = express.Router();
const { getOrders, getOrderById, createOrder, updatePaymentStatus, duplicateOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getOrders)
    .post(protect, createOrder);

router.route('/:id')
    .get(protect, getOrderById);

router.put('/:id/payment', protect, updatePaymentStatus);
router.get('/:id/duplicate', protect, duplicateOrder);

module.exports = router;
