// controllers/SmartOrderController.js - FIXED VERSION WITH FIREBASE INTEGRATION
const SmartOrderRequest = require('../models/SmartOrderRequest');
const { pool } = require('../db_conn');
const { JWT } = require('google-auth-library');
const axios = require('axios');
require('dotenv').config();

// Firebase Service Account
//const SERVICE_ACCOUNT = require('../zdeliver-acc55-firebase-adminsk-fbsvc-f439bed9a3.json');

class SmartOrderController {
  
  // ========== FIREBASE HELPER METHODS ==========
  
  // Helper: Get Firebase Access Token
  static async getFirebaseAccessToken() {
    const jwtClient = new JWT({
      email: SERVICE_ACCOUNT.client_email,
      key: SERVICE_ACCOUNT.private_key,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    });
    const tokens = await jwtClient.authorize();
    return tokens.access_token;
  }

  // Helper: Send Firebase Notification
  static async sendFirebaseNotification(token, data) {
    try {
      const accessToken = await this.getFirebaseAccessToken();
      const projectId = SERVICE_ACCOUNT.project_id;
      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

      const stringData = {};
      Object.keys(data).forEach(key => {
        stringData[key] = String(data[key]);
      });

      const message = {
        message: {
          token: token,
          notification: {
            title: data.title,
            body: data.body
          },
          data: {
            ...stringData,
            action: "ORDER_REQUEST",  // custom field to identify this type of notification
            orderId: data.orderId     // include whatever order-specific info you need
          },
          android: {
            priority: "HIGH",
            notification: {
              sound: "default",
              channel_id: "high_importance_channel",
              click_action: "ORDER_REQUEST_ACTION" // triggers action handling in app
            }
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                category: "ORDER_REQUEST_CATEGORY" // used for iOS notification actions
              }
            }
          }
        }
      };
      

      // Log the Firebase payload to console
      console.log('Firebase Notification Payload:', JSON.stringify({
        token: token,
        notification: {
          title: data.title,
          body: data.body
        },
        data: stringData
      }, null, 2));

      const response = await axios.post(fcmUrl, message, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      console.error('Detailed Firebase error:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      throw new Error(`Firebase notification failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Helper: Store notification in database
  static async storeNotification(receiverType, userId, vendorId, bookingOrderId, title, description) {
    try {
      const query = `
        INSERT INTO notifications 
        (receiver_type, user_id, vendor_id, booking_order_id, title, description) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await pool.query(query, [receiverType, userId, vendorId, bookingOrderId, title, description]);
      return true;
    } catch (error) {
      console.error('Error storing notification in database:', error);
      throw error;
    }
  }

  // Helper: Check if booking is already accepted
  static async isBookingAlreadyAccepted(booking_id) {
    try {
      const query = `
        SELECT id, vendor_id, status 
        FROM order_request 
        WHERE booking_id = ? AND status = 'accepted'
        LIMIT 1
      `;
      
      const [rows] = await pool.query(query, [booking_id]);
      
      if (rows.length > 0) {
        return { 
          isAccepted: true, 
          acceptedBy: rows[0].vendor_id,
          orderId: rows[0].id 
        };
      }
      
      return { isAccepted: false };
    } catch (error) {
      console.error('Error checking booking acceptance status:', error);
      throw error;
    }
  }
  
  // ========== MAIN CONTROLLER METHODS ==========
  
  static async createSmartOrderRequest(req, res) {
    try {
      const { user_id, booking_id, cart_type, latitude, longitude } = req.body;
      
      // Validate required fields
      if (!user_id || !booking_id || !cart_type || !latitude || !longitude) {
        return res.status(400).json({ 
          success: false, 
          error: 'user_id, booking_id, cart_type, latitude, and longitude are required' 
        });
      }

      console.log(`User location: Lat ${latitude}, Lng ${longitude}`);

      // Validate coordinates
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid latitude or longitude values' 
        });
      }

      // Step 1: Find closest warehouse
      const warehouseResult = await SmartOrderRequest.findClosestWarehouse(latitude, longitude);
      if (!warehouseResult.success) {
        return res.status(404).json({ 
          success: false, 
          error: warehouseResult.error 
        });
      }

      const warehouse = warehouseResult.warehouse;
      console.log(`Closest warehouse found: ${warehouse.warehouse_Name} (ID: ${warehouse.id})`);

      // Step 2: Find vendors in that warehouse with matching cart_type
      const vendorsResult = await SmartOrderRequest.findVendorsByWarehouseAndCartType(warehouse.id, cart_type);
      if (!vendorsResult.success) {
        return res.status(404).json({ 
          success: false, 
          error: vendorsResult.error 
        });
      }

      const matchingVendors = vendorsResult.vendors;
      console.log(`Found ${matchingVendors.length} matching vendors for cart_type: ${cart_type}`);

      if (matchingVendors.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: `No vendors available for cart_type: ${cart_type} in your area` 
        });
      }

      // Step 3: Create order requests for each matching vendor
      const createdRequests = [];
      for (const vendor of matchingVendors) {
        const orderResult = await SmartOrderRequest.createOrderRequest(vendor.id, booking_id, user_id, 'pending', `Order request from user ${user_id}`);
        if (orderResult.success) {
          createdRequests.push({
            vendor_id: vendor.id,
            vendor_name: vendor.Name,
            order_request_id: orderResult.id
          });
        }
      }

      console.log(`Created ${createdRequests.length} order requests`);

      // Step 4: Send notifications to all matching vendors using internal method - FIXED
      const notificationResults = await SmartOrderController.sendOrderNotificationsToVendors({
        user_id,
        booking_id,
        vendors: matchingVendors,
        latitude,
        longitude
      });

      // Count successful notifications
      const successfulNotifications = notificationResults.filter(n => n.status === 'sent').length;

      // Return success response with the requested message
      return res.status(200).json({ 
        success: true, 
        message: 'Assigning you a vendor for your order request shortly',
        data: {
          request_status: 'processing',
          closest_warehouse: {
            id: warehouse.id,
            name: warehouse.warehouse_Name,
            address: warehouse.Address
          },
          matching_vendors_count: matchingVendors.length,
          order_requests_created: createdRequests.length,
          notifications_sent: successfulNotifications,
          estimated_assignment_time: '2-5 minutes'
        }
      });

    } catch (error) {
      console.error('Error creating smart order request:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create smart order request',
        details: error.message 
      });
    }
  }

  static async updateOrderRequestStatus(req, res) {
    try {
      // NEW CODE
const { vendorId } = req.params;
const { status, reason, booking_id } = req.body; // Add booking_id to body

if (!vendorId || !status || !booking_id) {
  return res.status(400).json({ 
    success: false, 
    error: 'Vendor ID, Booking ID, and Status are required' 
  });
}
      
      if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Status must be pending, accepted, or rejected' 
        });
      }

      // Get order request details first
      // NEW CODE
// Get order request details by vendor and booking
const orderDetails = await SmartOrderRequest.getOrderRequestByVendorAndBooking(vendorId, booking_id);
if (!orderDetails.success) {
  return res.status(404).json({ 
    success: false, 
    error: orderDetails.error 
  });
}

const { id, user_id } = orderDetails.request;
// vendor_id is already available as vendorId from params

      // Check if trying to accept an order
      if (status === 'accepted') {
        // Check if this booking is already accepted by another vendor
        const acceptanceCheck = await SmartOrderController.isBookingAlreadyAccepted(booking_id);
        
        if (acceptanceCheck.isAccepted) {
          // Get vendor details for the response
          const acceptedVendorDetails = await SmartOrderController.getVendorDetails(acceptanceCheck.acceptedBy);
          
          return res.status(409).json({ 
            success: false, 
            error: 'Order already accepted by another vendor',
            message: `This order has already been accepted by ${acceptedVendorDetails.name}`,
            details: {
              accepted_by_vendor_id: acceptanceCheck.acceptedBy,
              accepted_by_vendor_name: acceptedVendorDetails.name,
              accepted_order_id: acceptanceCheck.orderId
            }
          });
        }
      }
      
      // Update the order request status
      const result = await SmartOrderRequest.updateOrderRequestStatus(id, status, reason);
      
      if (!result.success) {
        return res.status(404).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      // Send notifications and handle post-update actions
      try {
        if (status === 'accepted') {
          // Cancel other pending requests for this booking
          const cancelResult = await SmartOrderRequest.cancelOtherPendingRequests(booking_id, id);
          console.log(`Cancellation result: ${cancelResult.canceled_count} requests cancelled`);
          
          // Send acceptance notification to user
          await SmartOrderController.sendAcceptanceNotificationToUser({
            user_id,
            booking_id,
            vendor_id
          });
          console.log(`Order ${booking_id} accepted and user notified`);
          
        } else if (status === 'rejected') {
          // Send rejection notification to user
          await SmartOrderController.sendRejectionNotificationToUser({
            user_id,
            booking_id,
            vendor_id,
            reason
          });
          console.log(`Order ${booking_id} rejected, user notified`);
        }
      } catch (error) {
        console.error('Error in post-status-update actions:', error);
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `Order request ${status} successfully${status === 'accepted' ? ' and other pending requests cancelled' : ''}`
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

  static async getVendorOrderRequests(req, res) {
    try {
      const { vendorId } = req.params;
      
      if (!vendorId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Vendor ID is required' 
        });
      }
      
      const result = await SmartOrderRequest.getVendorOrderRequests(vendorId);
      
      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: result.requests 
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

  static async getOrderRequestDetails(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Order request ID is required' 
        });
      }
      
      const result = await SmartOrderRequest.getOrderRequestDetails(id);
      
      if (!result.success) {
        return res.status(404).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: {
          request: result.request,
          items: result.items
        }
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

  static async getPendingOrderRequests(req, res) {
    try {
      const result = await SmartOrderRequest.getPendingOrderRequests();
      
      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: result.requests 
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

  static async getWarehouseInfo(req, res) {
    try {
      const result = await SmartOrderRequest.getWarehouseInfo();
      
      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: result.warehouses 
      });
    } catch (error) {
      console.error('Error fetching warehouse info:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch warehouse info',
        details: error.message 
      });
    }
  }

  // ========== NEW ADDITIONAL METHODS ==========

  static async getUserOrderHistory(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID is required' 
        });
      }
      
      const result = await SmartOrderRequest.getUserOrderHistory(userId);
      
      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: result.orders 
      });
    } catch (error) {
      console.error('Error fetching user order history:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch user order history',
        details: error.message 
      });
    }
  }

  static async cancelOrderRequest(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Order request ID is required' 
        });
      }
      
      const result = await SmartOrderRequest.updateOrderRequestStatus(id, 'cancelled', reason || 'Cancelled by user');
      
      if (!result.success) {
        return res.status(404).json({ 
          success: false, 
          error: result.error 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Order request cancelled successfully' 
      });
    } catch (error) {
      console.error('Error cancelling order request:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to cancel order request',
        details: error.message 
      });
    }
  }

  static async checkVendorAvailability(req, res) {
    try {
      const { latitude, longitude, cart_type } = req.body;
      
      if (!latitude || !longitude || !cart_type) {
        return res.status(400).json({ 
          success: false, 
          error: 'latitude, longitude, and cart_type are required' 
        });
      }
      
      // Find closest warehouse
      const warehouseResult = await SmartOrderRequest.findClosestWarehouse(latitude, longitude);
      if (!warehouseResult.success) {
        return res.status(200).json({ 
          success: true, 
          available: false,
          message: 'No service available in your area'
        });
      }
      
      // Find vendors in that warehouse with matching cart_type
      const vendorsResult = await SmartOrderRequest.findVendorsByWarehouseAndCartType(warehouseResult.warehouse.id, cart_type);
      
      return res.status(200).json({ 
        success: true, 
        available: vendorsResult.success && vendorsResult.vendors.length > 0,
        vendor_count: vendorsResult.success ? vendorsResult.vendors.length : 0,
        warehouse: warehouseResult.warehouse.warehouse_Name,
        message: vendorsResult.success && vendorsResult.vendors.length > 0 
          ? `${vendorsResult.vendors.length} vendors available in your area`
          : 'No vendors available for your cart type in this area'
      });
    } catch (error) {
      console.error('Error checking vendor availability:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to check vendor availability',
        details: error.message 
      });
    }
  }

  // ========== NOTIFICATION METHODS (INTERNAL) ==========
  
  // Send order notifications to multiple vendors
  static async sendOrderNotificationsToVendors({ user_id, booking_id, vendors, latitude, longitude }) {
    const notificationPromises = vendors.map(async (vendor) => {
      if (!vendor.fcm_token) {
        console.log(`Vendor ${vendor.Name} has no FCM token, skipping notification`);
        return { vendor_id: vendor.id, status: 'skipped', reason: 'No FCM token' };
      }

      try {
        // Get user and booking details for notification
        const [users] = await pool.query('SELECT full_name FROM users WHERE id = ?', [user_id]);
        const [bookingOrders] = await pool.query('SELECT booking_type, address FROM booking_order WHERE id = ?', [booking_id]);
        
        const userName = users.length > 0 ? users[0].full_name : 'Unknown User';
        const bookingType = bookingOrders.length > 0 ? bookingOrders[0].booking_type : 'Unknown';
        const address = bookingOrders.length > 0 ? bookingOrders[0].address : 'Unknown Address';

        const notificationData = {
            title: 'New Order Request!',
            body: `New order from ${userName}\nAddress: ${address}\nCart Type: ${vendor.cart_type}`,
            type: 'new_order',
            user_id: user_id.toString(),
            booking_id: booking_id.toString(),
            vendor_id: vendor.id.toString(),
            cart_type: vendor.cart_type,
            booking_type: bookingType,
            address: address,
            user_name: userName,
            user_latitude: latitude?.toString() || '',
            user_longitude: longitude?.toString() || ''
          };

        await this.sendFirebaseNotification(vendor.fcm_token, notificationData);
        
        // Store notification in database
        await this.storeNotification(
          'vendor',
          user_id,
          vendor.id,
          booking_id,
          notificationData.title,
          notificationData.body
        );
        
        return { 
          vendor_id: vendor.id, 
          vendor_name: vendor.Name,
          status: 'sent'
        };
      } catch (error) {
        console.error(`Failed to send notification to vendor ${vendor.Name}:`, error.message);
        return { 
          vendor_id: vendor.id, 
          vendor_name: vendor.Name,
          status: 'failed', 
          error: error.message 
        };
      }
    });

    const results = await Promise.allSettled(notificationPromises);
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : { status: 'error', error: result.reason }
    );
  }

  // Send acceptance notification to user
  static async sendAcceptanceNotificationToUser({ user_id, booking_id, vendor_id }) {
    try {
      const userToken = await this.getUserFCMToken(user_id);
      if (!userToken) {
        console.log(`User ${user_id} has no FCM token`);
        return { success: false, reason: 'No FCM token' };
      }

      const vendorDetails = await this.getVendorDetails(vendor_id);
      const [bookingOrders] = await pool.query('SELECT address FROM booking_order WHERE id = ?', [booking_id]);
      const address = bookingOrders.length > 0 ? bookingOrders[0].address : 'Unknown Address';

      const notificationData = {
        title: 'Vendor Assigned!',
        body: `${vendorDetails.name} has been assigned to your order`,
        type: 'order_accepted',
        booking_id: booking_id.toString(),
        vendor_id: vendor_id.toString(),
        vendor_name: vendorDetails.name,
        address: address
      };

      await this.sendFirebaseNotification(userToken, notificationData);
      
      // Store notification in database
      await this.storeNotification(
        'user',
        user_id,
        vendor_id,
        booking_id,
        notificationData.title,
        notificationData.body
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error sending acceptance notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send rejection notification to user  
  static async sendRejectionNotificationToUser({ user_id, booking_id, vendor_id, reason }) {
    try {
      const userToken = await this.getUserFCMToken(user_id);
      if (!userToken) {
        console.log(`User ${user_id} has no FCM token`);
        return { success: false, reason: 'No FCM token' };
      }

      const vendorDetails = await this.getVendorDetails(vendor_id);

      const notificationData = {
        title: 'Looking for another vendor...',
        body: `We're finding another vendor for your order${reason ? ': ' + reason : ''}`,
        type: 'order_rejected',
        booking_id: booking_id.toString(),
        vendor_id: vendor_id.toString(),
        vendor_name: vendorDetails.name,
        reason: reason || ''
      };

      await this.sendFirebaseNotification(userToken, notificationData);
      
      // Store notification in database
      await this.storeNotification(
        'user',
        user_id,
        vendor_id,
        booking_id,
        notificationData.title,
        notificationData.body
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error sending rejection notification:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== HELPER METHODS ==========
  
  // Get user FCM token
  static async getUserFCMToken(user_id) {
    try {
      const [rows] = await pool.query('SELECT fcm_token FROM users WHERE id = ?', [user_id]);
      return rows.length > 0 ? rows[0].fcm_token : null;
    } catch (error) {
      console.error('Error getting user FCM token:', error);
      return null;
    }
  }

  // Get vendor details
  static async getVendorDetails(vendor_id) {
    try {
      const [rows] = await pool.query('SELECT Name, cart_type FROM vendor_details WHERE id = ?', [vendor_id]);
      return rows.length > 0 ? { name: rows[0].Name, cart_type: rows[0].cart_type } : { name: 'Unknown Vendor', cart_type: '' };
    } catch (error) {
      console.error('Error getting vendor details:', error);
      return { name: 'Unknown Vendor', cart_type: '' };
    }
  }
}

module.exports = SmartOrderController;
