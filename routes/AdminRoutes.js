
const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/AdminController');
const auth = require('../middleware/auth');


router.get('/booking', BookingController.getBookingDetails);


module.exports = router;
