const Warehouse = require('../models/Vendor/Warehouse/warehouse');

class WarehouseController {
  // Find Nearest Warehouse
  static async findNearestWarehouse(req, res) {
    try {
      const { vendorLat, vendorLon } = req.body;

      // Validate input
      if (!vendorLat || !vendorLon) {
        return res.status(400).json({
          success: false,
          message: 'Vendor latitude and longitude are required'
        });
      }

      const nearestWarehouse = await Warehouse.findNearestWarehouse(vendorLat, vendorLon);

      if (!nearestWarehouse) {
        return res.status(404).json({
          success: false,
          message: 'No warehouse found'
        });
      }

      return res.status(200).json({
        success: true,
        warehouse: nearestWarehouse
      });
    } catch (error) {
      console.error('Error in findNearestWarehouse:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to find nearest warehouse',
        error: error.message
      });
    }
  }

  // Create Warehouse
  static async createWarehouse(req, res) {
    try {
      const { warehouse_Name, latitude, longitude, Address } = req.body;

      // Validate input
      if (!warehouse_Name || !latitude || !longitude || !Address) {
        return res.status(400).json({
          success: false,
          message: 'All warehouse details are required'
        });
      }

      const result = await Warehouse.createWarehouse({
        warehouse_Name,
        latitude,
        longitude,
        Address
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error('Error in createWarehouse:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create warehouse',
        error: error.message
      });
    }
  }

  // Get All Warehouses
  static async getAllWarehouses(req, res) {
    try {
      const warehouses = await Warehouse.getAllWarehouses();

      return res.status(200).json({
        success: true,
        warehouses: warehouses
      });
    } catch (error) {
      console.error('Error in getAllWarehouses:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch warehouses',
        error: error.message
      });
    }
  }

  // Update Warehouse
  static async updateWarehouse(req, res) {
    try {
      const { id } = req.params;
      const { warehouse_Name, latitude, longitude, Address } = req.body;

      // Validate input
      if (!id || !warehouse_Name || !latitude || !longitude || !Address) {
        return res.status(400).json({
          success: false,
          message: 'All warehouse details and ID are required'
        });
      }

      const result = await Warehouse.updateWarehouse(id, {
        warehouse_Name,
        latitude,
        longitude,
        Address
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in updateWarehouse:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update warehouse',
        error: error.message
      });
    }
  }

  // Delete Warehouse
  static async deleteWarehouse(req, res) {
    try {
      const { id } = req.params;

      // Validate input
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Warehouse ID is required'
        });
      }

      const result = await Warehouse.deleteWarehouse(id);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteWarehouse:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete warehouse',
        error: error.message
      });
    }
  }
}

module.exports = WarehouseController;