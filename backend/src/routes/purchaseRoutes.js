const express = require('express');
const router = express.Router();
const { createPurchase, getPurchases, getPurchaseById, updatePaymentStatus } = require('../controllers/purchaseController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createPurchase);
router.get('/', protect, getPurchases);
router.get('/:id', protect, getPurchaseById);
router.put('/:id/payment', protect, admin, updatePaymentStatus);

module.exports = router;
