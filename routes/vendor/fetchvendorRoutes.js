const express = require('express');
const router = express.Router();
const vendorController = require('../../controllers/Vendor/vendordetailController');

// Route to get basic vendor information (all or by ID via query parameter)
router.get('/basic-info', vendorController.getVendorBasicInfo);

// Route to get vendor names and IDs (all or by ID via query parameter)
router.get('/vendor-ids', vendorController.getVendorNameAndId);

// New route for explicit ID search in the URL path
router.get('/vendor/:vendorId', vendorController.searchVendorById);

module.exports = router;