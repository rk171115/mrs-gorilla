// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const ordercartController = require('../controllers/ordercartController');
// const auth = require('../middleware/auth');

// POST - Create a new booking (cart or order)
router.post('/create', ordercartController.createBooking);

// NEW ENDPOINTS for specific cart types
// POST - Create a new fruit cart
router.post('/create-fruit-cart', ordercartController.createFruitCart);

// POST - Create a new vegetable cart
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