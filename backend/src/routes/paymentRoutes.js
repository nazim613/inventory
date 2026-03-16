const express = require('express');
const router = express.Router();
const { recordPayment, getPayments } = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, recordPayment);
router.get('/', protect, getPayments);

module.exports = router;
