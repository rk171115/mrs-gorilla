const express = require('express');
const router = express.Router();
const { checkOrderStatus, getUserOrders } = require('../controllers/orderStatusController');

// Route to check latest order status for a user
router.get('/order-status/:user_id', checkOrderStatus);

// Route to get all orders for a user (optional)
router.get('/orders/:user_id', getUserOrders);

module.exports = router;