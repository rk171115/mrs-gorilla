// routes/billingRoutes.js
const express = require('express');
const BillingController = require('../../controllers/Vendor/BillingController');
// const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have auth middleware

const router = express.Router();

/**
 * @route POST /api/billing
 * @desc Create a new billing with items
 * @access Private (Vendor only)
 */
router.post('/', BillingController.createBilling);

/**
 * @route GET /api/billing/:id
 * @desc Get a specific billing with all details
 * @access Private
 */
router.get('/:id', BillingController.getBillingById);

/**
 * @route GET /api/billing/user/:user_id
 * @desc Get all billings for a specific user
 * @access Private
 */
router.get('/user/:user_id', BillingController.getUserBillings);

/**
 * @route GET /api/billing/vendor/:vendor_id
 * @desc Get all billings for a specific vendor
 * @access Private (Vendor only)
 */
router.get('/vendor/:vendor_id', BillingController.getVendorBillings);

/**
 * @route PATCH /api/billing/:id/payment
 * @desc Update billing payment method
 * @access Private
 */
router.patch('/:id/payment', BillingController.updatePaymentMethod);

module.exports = router;