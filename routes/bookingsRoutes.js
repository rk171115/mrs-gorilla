const express = require('express');
const router = express.Router();
const BookingsController = require('../controllers/bookingsController');

// Add a new booking
router.post('/add', BookingsController.addBooking);

// Get bookings for a specific user
router.get('/user/:user_id', BookingsController.getUserBookings);

module.exports = router;