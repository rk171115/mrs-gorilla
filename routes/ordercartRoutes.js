// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const ordercartController = require('../controllers/ordercartController');
// const auth = require('../middleware/auth');

// POST - Create a new booking (cart or order)
// This handles: Z customized cart, order, Z fruit cart, Z vegetable cart
// Address is required in request body for all types
router.post('/create', ordercartController.createBooking);

// NEW COMBINED ENDPOINT for fruit and vegetable carts
// POST - Create fruit or vegetable cart based on cart_type in request body
// Request body should include: user_id, cart_type ('Z fruit cart' or 'Z vegetable cart'), address
router.post('/create-cart', ordercartController.createFruitVegetableCart);

// KEEPING INDIVIDUAL ENDPOINTS for backward compatibility
// POST - Create a new fruit cart (requires user_id and address in request body)
router.post('/create-fruit-cart', ordercartController.createFruitCart);

// POST - Create a new vegetable cart (requires user_id and address in request body)
router.post('/create-vegetable-cart', ordercartController.createVegetableCart);

// GET - Get booking details by ID
router.get('/details/:id', ordercartController.getBookingById);

// GET - Get all bookings by user ID (with optional type filter)
router.get('/user/:userId', ordercartController.getBookingsByUserId);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Booking API test endpoint working' });
});

module.exports = router;