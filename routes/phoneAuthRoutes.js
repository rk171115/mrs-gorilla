const express = require('express');
const PhoneAuthController = require('../controllers/phoneAuthController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/send-otp', PhoneAuthController.sendOTP);  // Send OTP
router.post('/verify-otp', PhoneAuthController.verifyOTP);  // Verify OTP

// [NEW ROUTE ADDED] Logout route with authentication middleware
router.post('/logout', auth, PhoneAuthController.logout);

module.exports = router;
