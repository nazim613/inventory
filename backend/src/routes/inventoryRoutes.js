const express = require('express');
const router = express.Router();
const { getInventoryHistory } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getInventoryHistory);

module.exports = router;
