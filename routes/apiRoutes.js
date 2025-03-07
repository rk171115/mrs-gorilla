const express = require('express');
const router = express.Router();
const apiRoutes = require('../controllers/apiRoutes');

// Route to search for items by name
router.post('/search', apiRoutes.searchItem);

module.exports = router;