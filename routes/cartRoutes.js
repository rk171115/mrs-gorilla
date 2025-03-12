// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// POST - Create a new cart
router.post('/create', cartController.createCart);
router.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working' });
  });

module.exports = router;