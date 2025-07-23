const express = require('express');
const router = express.Router();
const BookingsController = require('../controllers/bookingsController');
const auth = require('../middleware/auth');

// Add a new booking
router.post('/add',auth, BookingsController.addBooking);

router.get('/bookings', BookingsController.getAllBookings);
// Get bookings for a specific user
router.get('/user/:user_id',auth,BookingsController.getUserBookings);

module.exports = router;
