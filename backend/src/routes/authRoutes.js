const express = require('express');
const router = express.Router();
const { registerUser, authUser, changePassword, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.put('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

module.exports = router;
