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
      
      // Create order request and notify vendors
      const vendorIds = vendors.map(vendor => vendor.id);
      const result = await OrderRequestModel.createOrderRequest({
        userId: user_id,
        orderId: order_id,
        vendorIds
      });
      
      // Get full order request details including vendors
      const orderDetails = await OrderRequestModel.getOrderRequestDetails(result.orderRequestId);
      
      return res.status(201).json({
        message: `Order request created and notifications sent to ${vendors.length} vendors`,
        warehouse: {
          id: warehouse.id,
          name: warehouse.warehouse_Name,
          address: warehouse.Address
        },
        order_request_id: result.orderRequestId,
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
          error: "Invalid user_id or order_id. Make sure both exist in their respective tables."
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
}

module.exports = OrderRequestController;