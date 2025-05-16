// routes/orderBasketRoutes.js
const express = require('express');
const router = express.Router();
const OrderBasketController = require('../controllers/orderBasketController');
// const auth = require('../middleware/auth');

// Place an order from a basket
router.post('/basket', OrderBasketController.orderBasket);

// Get order history for a user
router.get('/user/:user_id', OrderBasketController.getBasketOrderHistory);

// Get details of a specific order
router.get('/:order_id/user/:user_id', OrderBasketController.getBasketOrderDetails);

module.exports = router;