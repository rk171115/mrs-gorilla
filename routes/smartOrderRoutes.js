// routes/smartOrderRoutes.js
const express = require('express');
const router = express.Router();
const SmartOrderController = require('../controllers/SmartOrderController');

// ========== SMART ORDER ROUTES ==========

// Main smart order creation endpoint
// Expects: { user_id, booking_id, cart_type, latitude, longitude }
router.post('/smart-order', SmartOrderController.createSmartOrderRequest);

// Update order request status (vendor accepts/rejects)
// Expects: { status, reason? }
router.put('/vendor/:vendorId/order-request/status', SmartOrderController.updateOrderRequestStatus);

// Get all order requests for a specific vendor
router.get('/vendor/:vendorId/orders', SmartOrderController.getVendorOrderRequests);

// Get details of a specific order request
router.get('/order-request/:id/details', SmartOrderController.getOrderRequestDetails);

// Get all pending order requests (admin view)
router.get('/pending-orders', SmartOrderController.getPendingOrderRequests);

// Get warehouse information (debug/admin)
router.get('/warehouses/info', SmartOrderController.getWarehouseInfo);

// ========== ADDITIONAL UTILITY ROUTES ==========

// Get user's order history
router.get('/user/:userId/order-history', SmartOrderController.getUserOrderHistory);

// Cancel order request (user cancellation)
// Expects: { reason? }
router.put('/order-request/:id/cancel', SmartOrderController.cancelOrderRequest);

// Check vendor availability in area
// Expects: { latitude, longitude, cart_type }
router.post('/check-vendor-availability', SmartOrderController.checkVendorAvailability);

module.exports = router;