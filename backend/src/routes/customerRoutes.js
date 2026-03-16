const express = require('express');
const router = express.Router();
const {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerProducts
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCustomers)
    .post(protect, createCustomer);

router.route('/:id')
    .get(protect, getCustomerById)
    .put(protect, updateCustomer)
    .delete(protect, deleteCustomer);
router.route('/:id/products')
    .get(protect, getCustomerProducts);

module.exports = router;
