const express = require('express');
const router = express.Router();
const {
    getManufacturers,
    getManufacturerById,
    getManufacturerProducts,
    createManufacturer,
    updateManufacturer,
    deleteManufacturer
} = require('../controllers/manufacturerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getManufacturers)
    .post(protect, createManufacturer);

router.route('/:id')
    .get(protect, getManufacturerById)
    .put(protect, updateManufacturer)
    .delete(protect, deleteManufacturer);

router.get('/:id/products', protect, getManufacturerProducts);

module.exports = router;
