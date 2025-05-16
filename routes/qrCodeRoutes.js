// routes/qrCodeRoutes.js
const express = require('express');
const router = express.Router();
const { createQRCode } = require('../controllers/qrCodeController');

/**
 * @route POST /api/qr-codes
 * @desc Create a new Razorpay UPI QR code
 * @access Private
 */
router.post('/', createQRCode);

module.exports = router;