const express = require('express');
const router = express.Router();
const veggiecontroller = require('../controllers/veggiecontroller'); // Adjust path as needed

// Route to get items by category (POST method)
router.post('/category', veggiecontroller.getItemsByCategory);

// Route to get filtered items by category (POST method)
router.post('/category/filtered', veggiecontroller.getFilteredItems);

module.exports = router;