const express = require('express');
const PhoneAuthController = require('../controllers/phoneAuthController');

const router = express.Router();

router.post('/send-otp', PhoneAuthController.sendOTP);  // Send OTP
router.post('/verify-otp', PhoneAuthController.verifyOTP);  // Verify OTP

module.exports = router;
