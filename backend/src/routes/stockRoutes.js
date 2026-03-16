const express = require('express');
const router = express.Router();
const { getStocks, getStockById, createOrUpdateStock, updateStockQuantity, deleteStock } = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getStocks)
    .post(protect, createOrUpdateStock);

router.route('/:id')
    .get(protect, getStockById)
    .put(protect, updateStockQuantity)
    .delete(protect, deleteStock);

module.exports = router;
