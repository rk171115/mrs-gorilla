const OrderRequestModel = require('../../models/Vendor/NotificationModel');

class OrderRequestController {
  /**
   * Create a new order request and notify vendors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createOrderRequest(req, res) {
    try {
      const { user_id, order_id, latitude, longitude, cart_type } = req.body;
      
      // Validate request body
      if (!user_id || !order_id || !latitude || !longitude || !cart_type) {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["user_id", "order_id", "latitude", "longitude", "cart_type"]
        });
      }
      
      // Validate cart type
      if (!['vegetable', 'fruit'].includes(cart_type)) {
        return res.status(400).json({
          error: "Invalid cart type. Must be 'vegetable' or 'fruit'"
        });
      }
      
      // Find warehouse based on coordinates
      const warehouse = await OrderRequestModel.findWarehouseByLocation(latitude, longitude);
      
      if (!warehouse) {
        return res.status(404).json({
          error: "No warehouse serves the provided location",
          location: { latitude, longitude }
        });
      }
      
      // Find vendors associated with the warehouse and matching cart type
      const vendors = await OrderRequestModel.findVendorsByWarehouseAndCartType(
        warehouse.id, 
        cart_type
      );
      
      if (vendors.length === 0) {
        return res.status(404).json({
          error: `No vendors with ${cart_type} cart type found in the serving warehouse`,
          warehouse_id: warehouse.id,
          warehouse_name: warehouse.warehouse_Name
        });
      }
      
      // Extract all vendor IDs
      const vendorIds = vendors.map(vendor => vendor.id);
      
      // Create order requests for all matching vendors
      const result = await OrderRequestModel.createOrderRequests({
        userId: user_id,
        orderId: order_id,
        vendorIds: vendorIds
      });
      
      return res.status(201).json({
        message: `Order requests created and notifications sent to ${vendors.length} vendors`,
        warehouse: {
          id: warehouse.id,
          name: warehouse.warehouse_Name,
          address: warehouse.Address
        },
        order_requests_count: result.vendorCount,
        notified_vendors: vendors.map(v => ({
          id: v.id,
          name: v.Name,
          cart_type: v.cart_type,
          vehicle_no: v.VehicleNo
        }))
      });
      
    } catch (error) {
      console.error("Error creating order request:", error);
      
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
          error: "Invalid user_id, order_id, or vendor_id. Make sure they exist in their respective tables."
        });
      }
      
      return res.status(500).json({
        error: "Failed to create order request",
        details: error.message
      });
    }
  }

  /**
   * Get order request details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getOrderRequest(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Order request ID is required" });
      }
      
      const orderRequest = await OrderRequestModel.getOrderRequestDetails(id);
      
      if (!orderRequest) {
        return res.status(404).json({ error: "Order request not found" });
      }
      
      return res.status(200).json({
        order_request: orderRequest
      });
      
    } catch (error) {
      console.error("Error retrieving order request:", error);
      return res.status(500).json({
        error: "Failed to retrieve order request",
        details: error.message
      });
    }
  }
  
  /**
   * Get all order requests for a specific booking
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getOrderRequestsByBooking(req, res) {
    try {
      const { booking_id } = req.params;
      
      if (!booking_id) {
        return res.status(400).json({ error: "Booking ID is required" });
      }
      
      const orderRequests = await OrderRequestModel.getOrderRequestsByBookingId(booking_id);
      
      return res.status(200).json({
        booking_id: parseInt(booking_id),
        order_requests_count: orderRequests.length,
        order_requests: orderRequests
      });
      
    } catch (error) {
      console.error("Error retrieving order requests:", error);
      return res.status(500).json({
        error: "Failed to retrieve order requests",
        details: error.message
      });
    }
  }
}

module.exports = OrderRequestController;