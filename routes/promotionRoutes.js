const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');


// Route to get featured items
router.get('/featured', promotionController.getFeaturedItems);

// Route to get low-priced items
router.get('/low-price', promotionController.getLowPriceItems);

module.exports = router;