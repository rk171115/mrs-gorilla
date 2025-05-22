const express = require('express');
const router = express.Router();
const WarehouseFinderController = require('../../controllers/Vendor/WarehouseFinderController');

/**
 * @route POST /api/warehouse-finder/find-warehouse-vendors
 * @desc Find warehouse and associated vendors based on location and cart type
 * @access Public
 * @body {number} latitude - User's latitude
 * @body {number} longitude - User's longitude  
 * @body {string} [cart_type] - Type of cart needed (vegetable/fruit/customized cart) - Optional
 */
router.post('/find-warehouse-vendors', WarehouseFinderController.findWarehouseAndVendors);

/**
 * @route GET /api/warehouse-finder/warehouses
 * @desc Get all warehouses with their service areas (for debugging/admin)
 * @access Public
 */
router.get('/warehouses', WarehouseFinderController.getAllWarehousesWithServiceAreas);

/**
 * @route POST /api/warehouse-finder/test-location
 * @desc Test if a location falls within any warehouse service area
 * @access Public
 * @body {number} latitude - Test latitude
 * @body {number} longitude - Test longitude
 */
router.post('/test-location', WarehouseFinderController.testLocation);

module.exports = router;