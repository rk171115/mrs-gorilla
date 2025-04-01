// routes/orderRequestRoutes.js
const express = require('express');
const router = express.Router();
const OrderRequestController = require('../../controllers/Vendor/OrderRequestController');

// Create a new order request
router.post('/', OrderRequestController.createOrderRequest);

// Update the status of an order request
router.put('/:id/status', OrderRequestController.updateOrderRequestStatus);

// Get all order requests for a vendor
router.get('/vendor/:vendorId', OrderRequestController.getVendorOrderRequests);

// Get details of an order request including items
router.get('/:id', OrderRequestController.getOrderRequestDetails);

// Get all pending order requests
router.get('/status/pending', OrderRequestController.getPendingOrderRequests);

module.exports = router;