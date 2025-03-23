// routes/vendorAuthRoutes.js
const express = require('express');
const router = express.Router();
const VendorAuthController = require('../../controllers/Vendor/vendorAuthController');

// Check if phone number exists
router.post('/check-phone', VendorAuthController.checkPhoneNumber);

// Send OTP to vendor's phone (for login only)
router.post('/send-otp', VendorAuthController.sendOTP);

// Verify OTP for login
router.post('/verify-login-otp', VendorAuthController.verifyLoginOTP);

// Register a new vendor
router.post('/register', VendorAuthController.registerVendor);

// Verify vendorId and passkey for direct login
router.post('/verify-credentials', VendorAuthController.verifyCredentials);

module.exports = router;
