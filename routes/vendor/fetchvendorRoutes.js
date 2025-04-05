const express = require('express');
const router = express.Router();
const vendorController = require('../../controllers/Vendor/vendordetailController');

// GET routes
router.get('/basic-info', vendorController.getVendorBasicInfo);
router.get('/vendor-ids', vendorController.getVendorNameAndId);
router.get('/vendor/:vendorId', vendorController.searchVendorById);

// POST route to create a new vendor
router.post('/vendor', vendorController.createVendor);

// PUT route to update vendor details
router.put('/vendor/:vendorId', vendorController.updateVendor);

// DELETE route to delete a vendor
router.delete('/vendor/:vendorId', vendorController.deleteVendor);

module.exports = router;