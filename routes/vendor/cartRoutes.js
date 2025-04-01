// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const CartController = require('../../controllers/Vendor/CartController');

// Get items based on vendor's cart type
router.get('/vendor/:vendorId/items', CartController.getVendorCartItems);

// Get all available cart types
router.get('/types', CartController.getCartTypes);

// Get all vendors with their cart types
router.get('/vendors', CartController.getVendors);

// Get items by specific type
router.get('/items/type/:type', CartController.getItemsByType);

module.exports = router;