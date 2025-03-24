// // routes/bookingRoutes.js
// const express = require('express');
// const router = express.Router();
// const bookingController = require('../controllers/ordercartController');

// // POST - Create a new booking (cart or order)
// router.post('/create', bookingController.createBooking);

// // GET - Get booking details by ID
// router.get('/details/:id', bookingController.getBookingById);

// // Test endpoint
// router.get('/test', (req, res) => {
//   res.json({ message: 'Booking API test endpoint working' });
// });

// module.exports = router;
// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const ordercartController = require('../controllers/ordercartController');

// POST - Create a new booking (cart or order)
router.post('/create', ordercartController.createBooking);

// GET - Get booking details by ID
router.get('/details/:id', ordercartController.getBookingById);

// GET - Get all bookings by user ID (with optional type filter)
router.get('/user/:userId', ordercartController.getBookingsByUserId);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Booking API test endpoint working' });
});

module.exports = router;