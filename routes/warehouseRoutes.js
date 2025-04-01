const express = require('express');
const router = express.Router();
const WarehouseController = require('../controllers/warehouseController');

// Find Nearest Warehouse
router.post('/nearest', WarehouseController.findNearestWarehouse);

// Create Warehouse
router.post('/', WarehouseController.createWarehouse);

// Get All Warehouses
router.get('/', WarehouseController.getAllWarehouses);

// Update Warehouse
router.put('/:id', WarehouseController.updateWarehouse);

// Delete Warehouse
router.delete('/:id', WarehouseController.deleteWarehouse);

module.exports = router;