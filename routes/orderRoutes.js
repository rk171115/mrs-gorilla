// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// POST - Create a new order
router.post('/order', orderController.createOrder);

// GET - Get order details by ID
router.get('/order/:id', orderController.getOrderById);

module.exports = router;