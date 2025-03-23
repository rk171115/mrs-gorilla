const express = require('express');
const router = express.Router();
const FeeController = require('../controllers/FeeController');

// Route to calculate order fees
router.post('/calculate', FeeController.calculateFees);

module.exports = router;