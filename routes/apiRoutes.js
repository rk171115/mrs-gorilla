const express = require('express');
const router = express.Router();
const apiRoutes = require('../controllers/apiRoutes');
const auth = require('../middleware/auth');

// Route to search for items by name
router.post('/search',auth, apiRoutes.searchItem);

module.exports = router;