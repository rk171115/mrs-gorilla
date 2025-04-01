const express = require('express');
const router = express.Router();
const vendorController = require('../../controllers/Vendor/vendordetailController');

// Route to get basic vendor information
router.get('/basic-info', vendorController.getVendorBasicInfo);

// Route to get vendor names and IDs
router.get('/vendor-ids', vendorController.getVendorNameAndId);

module.exports = router;