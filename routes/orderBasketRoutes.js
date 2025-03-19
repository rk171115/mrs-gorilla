// routes/orderBasketRoutes.js
const express = require('express');
const router = express.Router();
const OrderBasketController = require('../controllers/orderBasketController');

// Place an order from a basket
router.post('/orders/basket', OrderBasketController.orderBasket);

// Get order history for a user
router.get('/orders/user/:user_id', OrderBasketController.getBasketOrderHistory);

// Get details of a specific order
router.get('/orders/:order_id/user/:user_id', OrderBasketController.getBasketOrderDetails);

module.exports = router;