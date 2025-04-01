const express = require('express');
const OrderRequestController = require('../../controllers/Vendor/NotificationController');

const router = express.Router();

/**
 * @route POST /api/order-requests
 * @desc Create a new order request and notify vendors
 * @access Public
 */
router.post('/', OrderRequestController.createOrderRequest);

/**
 * @route GET /api/order-requests/:id
 * @desc Get details of a specific order request
 * @access Public
 */
router.get('/:id', OrderRequestController.getOrderRequest);

module.exports = router;