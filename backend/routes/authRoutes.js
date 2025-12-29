const express = require('express');
const router = express.Router();
const { register, login, getProfile, googleRegister } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/google-register', googleRegister);
router.post('/login', login);
router.get('/profile', protect, getProfile);

module.exports = router;
