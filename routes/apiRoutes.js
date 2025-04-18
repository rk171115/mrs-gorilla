const express = require('express');
const router = express.Router();
const ApiController = require('../controllers/apiRoutes.js');
const auth = require('../middleware/auth');

// Route to get all items
router.get('/all', ApiController.getAllItems);

// Route to search for items by name
router.post('/search', auth, ApiController.searchItem);

module.exports = router;