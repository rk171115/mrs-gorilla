const WarehouseFinderModel = require('../../models/Vendor/WarehouseFinderModel');

class WarehouseFinderController {
  /**
   * Find warehouse and associated vendors based on location and cart type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async findWarehouseAndVendors(req, res) {
    try {
      const { latitude, longitude, cart_type } = req.body;
      
      // Validate request body
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
          required: ["latitude", "longitude"]
        });
      }
      
      // Validate latitude and longitude format
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          error: "Invalid latitude or longitude format"
        });
      }
      
      // Validate latitude range (-90 to 90)
      if (lat < -90 || lat > 90) {
        return res.status(400).json({
          success: false,
          error: "Latitude must be between -90 and 90"
        });
      }
      
      // Validate longitude range (-180 to 180)
      if (lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          error: "Longitude must be between -180 and 180"
        });
      }
      
      // Validate cart type if provided
      if (cart_type && !['vegetable', 'fruit', 'customized cart'].includes(cart_type.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: "Invalid cart type. Must be 'vegetable', 'fruit', or 'customized cart'"
        });
      }
      
      // Find warehouse based on coordinates
      const warehouse = await WarehouseFinderModel.findWarehouseByLocation(lat, lng);
      
      if (!warehouse) {
        return res.status(404).json({
          success: false,
          error: "No warehouse serves the provided location",
          location: { 
            latitude: lat, 
            longitude: lng 
          },
          message: "Try a different location or contact support"
        });
      }
      
      // If cart_type is provided, find vendors matching that type
      // If cart_type is not provided, get vendor stats for message
      let message;
      
      if (cart_type) {
        // Find vendors associated with the warehouse and matching cart type
        const vendors = await WarehouseFinderModel.findVendorsByWarehouseAndCartType(
          warehouse.id, 
          cart_type.toLowerCase()
        );
        
        message = `Found warehouse serving your location with ${vendors.length} ${cart_type} vendors available`;
      } else {
        // Get vendor count by cart type for this warehouse
        const vendorStats = await WarehouseFinderModel.getVendorStatsByWarehouse(warehouse.id);
        
        message = `Found warehouse serving your location with ${vendorStats.vegetable_vendors} vegetable vendors, ${vendorStats.fruit_vendors} fruit vendors, and ${vendorStats.customized_cart_vendors} customized cart vendors available`;
      }
      
      return res.status(200).json({
        success: true,
        message: message,
        warehouse: {
          id: warehouse.id,
          name: warehouse.warehouse_Name,
          address: warehouse.Address,
          coordinates: {
            latitude: warehouse.latitude,
            longitude: warehouse.longitude
          }
        }
      });
      
    } catch (error) {
      console.error("Error finding warehouse and vendors:", error);
      
      return res.status(500).json({
        success: false,
        error: "Failed to find warehouse and vendors",
        details: error.message
      });
    }
  }

  /**
   * Get all warehouses with their service areas (for debugging/admin)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllWarehousesWithServiceAreas(req, res) {
    try {
      const warehouses = await WarehouseFinderModel.getAllWarehousesWithServiceAreas();
      
      return res.status(200).json({
        success: true,
        total_warehouses: warehouses.length,
        warehouses: warehouses.map(warehouse => ({
          id: warehouse.id,
          name: warehouse.warehouse_Name,
          address: warehouse.Address,
          coordinates: {
            latitude: warehouse.latitude,
            longitude: warehouse.longitude
          },
          service_area: {
            min_latitude: warehouse.min_lat,
            max_latitude: warehouse.max_lat,
            min_longitude: warehouse.min_lng,
            max_longitude: warehouse.max_lng
          }
        }))
      });
      
    } catch (error) {
      console.error("Error getting all warehouses:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch warehouses",
        details: error.message
      });
    }
  }

  /**
   * Test if a location falls within any warehouse service area
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async testLocation(req, res) {
    try {
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: "Latitude and longitude are required"
        });
      }
      
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      const warehouse = await WarehouseFinderModel.findWarehouseByLocation(lat, lng);
      
      return res.status(200).json({
        success: true,
        location: { latitude: lat, longitude: lng },
        warehouse_found: warehouse ? true : false,
        warehouse: warehouse ? {
          id: warehouse.id,
          name: warehouse.warehouse_Name,
          address: warehouse.Address
        } : null
      });
      
    } catch (error) {
      console.error("Error testing location:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to test location",
        details: error.message
      });
    }
  }
}

module.exports = WarehouseFinderController;