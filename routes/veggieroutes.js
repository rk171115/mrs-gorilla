const express = require('express');
const router = express.Router();
const veggiecontroller = require('../controllers/veggiecontroller'); // Adjust path as needed
const auth = require('../middleware/auth');

// Route to get items by category (POST method)
router.post('/category',auth, veggiecontroller.getItemsByCategory);

// Route to get filtered items by category (POST method)
router.post('/category/filtered',auth, veggiecontroller.getFilteredItems);

module.exports = router;