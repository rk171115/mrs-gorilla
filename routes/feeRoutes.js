const express = require('express');
const router = express.Router();
const FeeController = require('../controllers/FeeController');
const auth = require('../middleware/auth');

// Route to calculate order fees
router.post('/calculate',auth,FeeController.calculateFees);

module.exports = router;