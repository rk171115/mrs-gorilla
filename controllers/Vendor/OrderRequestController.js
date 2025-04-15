// controllers/OrderRequestController.js
const OrderRequest = require('../../models/Vendor/Order_request/OrderRequest');
const axios = require('axios'); // You'll need to install this package

class OrderRequestController {
  // Create a new order request
  static async createOrderRequest(req, res) {
    try {
      const { vendor_id, booking_id, status, reason } = req.body;
      
      if (!vendor_id || !booking_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Vendor ID and Booking ID are required' 
        });
      }
      
      const result = await OrderRequest.createOrderRequest(
        vendor_id, 
        booking_id, 
        status || 'pending', 
        reason
      );
      
      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      return res.status(201).json({ 
        success: true, 
        message: 'Order request created successfully', 
        id: result.id 
      });
    } catch (error) {
      console.error('Error creating order request:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create order request',
        details: error.message 
      });
    }
  }

  // Update the status of an order request
  static async updateOrderRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      
      if (!id || !status) {
        return res.status(400).json({ 
          success: false, 
          error: 'Request ID and Status are required' 
        });
      }
      
      if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Status must be pending, accepted, or rejected' 
        });
      }
      
      const result = await OrderRequest.updateOrderRequestStatus(id, status, reason);
      
      if (!result.success) {
        return res.status(404).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      // If the order was accepted, initialize real-time tracking
      if (status === 'accepted') {
        try {
          // Get order details to get booking_id, vendor_id, and user_id
          const orderDetails = await OrderRequest.getOrderRequestDetails(id);
          
          if (orderDetails.success) {
            const { booking_id, vendor_id } = orderDetails.request;
            const user_id = orderDetails.request.user_id || orderDetails.request.userId;
            
            // Call the tracking server API to initialize real-time tracking
            await axios.post('http://localhost:3001/api/tracking/order-accepted', {
              orderId: booking_id,
              vendorId: vendor_id,
              userId: user_id
            });
            
            console.log(`Real-time tracking initialized for order ${booking_id}`);
          }
        } catch (trackingError) {
          // Log the error but don't fail the request
          console.error('Error initializing real-time tracking:', trackingError);
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `Order request ${status} successfully` 
      });
    } catch (error) {
      console.error('Error updating order request status:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update order request status',
        details: error.message 
      });
    }
  }

  // Get all order requests for a vendor
  static async getVendorOrderRequests(req, res) {
    try {
      const { vendorId } = req.params;
      
      if (!vendorId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Vendor ID is required' 
        });
      }
      
      const result = await OrderRequest.getVendorOrderRequests(vendorId);
      
      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        requests: result.requests,
        total: result.requests.length
      });
    } catch (error) {
      console.error('Error fetching vendor order requests:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch vendor order requests',
        details: error.message 
      });
    }
  }

  // Get details of an order request with booking items
  static async getOrderRequestDetails(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Request ID is required' 
        });
      }
      
      const result = await OrderRequest.getOrderRequestDetails(id);
      
      if (!result.success) {
        return res.status(404).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        request: result.request,
        items: result.items,
        total_items: result.items.length
      });
    } catch (error) {
      console.error('Error fetching order request details:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch order request details',
        details: error.message 
      });
    }
  }

  // Get all pending order requests
  static async getPendingOrderRequests(req, res) {
    try {
      const result = await OrderRequest.getPendingOrderRequests();
      
      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        requests: result.requests,
        total: result.requests.length
      });
    } catch (error) {
      console.error('Error fetching pending order requests:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch pending order requests',
        details: error.message 
      });
    }
  }
}

module.exports = OrderRequestController;