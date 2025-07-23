const WarehouseFinderModel = require('../../models/Vendor/WarehouseFinderModel');
const SmartOrderController = require('../SmartOrderController');
const { JWT } = require('google-auth-library');
const axios = require('axios');

// Add these imports at the top if not already present
//const pool = require('../../config/database'); // Adjust path as needed
const { pool } = require('../../db_conn');

// Firebase Service Account - adjust path as needed
const SERVICE_ACCOUNT = require('../../zdeliver-acc55-firebase-adminsk-fbsvc-f439bed9a3.json');






class WarehouseFinderController {
  /**
   * Find warehouse and associated vendors based on location and cart type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */


// Firebase Access Token Method
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
            action: "NEAREST_VENDOR_REQUEST", // custom field to identify this type of notification
          },
          android: {
            priority: "HIGH",
            notification: {
              sound: "default",
              channel_id: "high_importance_channel",
              click_action: "NEAREST_VENDOR_ACTION" // triggers action handling in app
            }
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                category: "NEAREST_VENDOR_CATEGORY" // used for iOS notification actions
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










static async getVendorFCMToken(vendorId) {
  try {
    const query = `SELECT fcm_token FROM vendor_details WHERE id = ?`;
    const [rows] = await pool.query(query, [vendorId]);
    
    if (rows.length === 0) {
      throw new Error(`Vendor with ID ${vendorId} not found`);
    }
    
    return rows[0].fcm_token;
  } catch (error) {
    console.error('Error fetching vendor FCM token:', error);
    throw error;
  }
}

// Send notification to nearest vendor
static async sendNotificationToNearestVendor(vendorId, userLatitude, userLongitude,booking_id, additionalData = {}) {
  try {
    console.log(`Sending notification to vendor: ${vendorId}`);
    
    // Fetch FCM token for the vendor
    const fcmToken = await this.getVendorFCMToken(vendorId);
    
    if (!fcmToken) {
      console.warn(`No FCM token found for vendor: ${vendorId}`);
      return {
        success: false,
        message: 'No FCM token found for vendor'
      };
    }
    
    // Prepare notification data
    const notificationData = {
      title: "New Order Request",
      body: "A customer near you is looking for delivery service",
      vendorId: vendorId,
      userLatitude: userLatitude,
      userLongitude: userLongitude,
      booking_id: booking_id,
      timestamp: new Date().toISOString(),
      ...additionalData
    };
    
    // Send Firebase notification
    const firebaseResponse = await this.sendFirebaseNotification(fcmToken, notificationData);
    
    console.log(`Notification sent successfully to vendor: ${vendorId}`);
    
    return {
      success: true,
      message: 'Notification sent successfully',
      vendorId: vendorId,
      firebaseResponse: firebaseResponse
    };
    
  } catch (error) {
    console.error(`Error sending notification to vendor ${vendorId}:`, error);
    return {
      success: false,
      message: 'Failed to send notification',
      error: error.message
    };
  }
}






static async findNearestVendor(req, res) {
  try {
    const { latitude, longitude, booking_id } = req.body;
    
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
    
    // Find nearest available vendor
    const nearestVendor = await WarehouseFinderModel.findNearestAvailableVendor(lat, lng);
    console.log(nearestVendor);
    
    if (!nearestVendor) {
      return res.status(200).json({
        success: true,
        debug_nearestVendor: nearestVendor,
        message: "We will assign you a vendor soon",
        vendor: null,
        estimated_wait_time: "Please check back in a few minutes"
      });
    }
    
    // Calculate distance for response
    const distance = WarehouseFinderModel.calculateDistance(
      lat, lng,
      nearestVendor.latitude,
      nearestVendor.longitude
    );
    
    // Send notification to the nearest vendor
    const notificationResult = await WarehouseFinderController.sendNotificationToNearestVendor(
      nearestVendor.vendor_id,
      lat,
      lng,
      booking_id,
      {
        distance: distance.toFixed(2),
        sessionId: nearestVendor.session_id
      }
    );
    
    console.log('Notification result:', notificationResult);
    
    return res.status(200).json({
      success: true,
      message: `Found nearest available vendor within ${distance.toFixed(2)} km`,
      vendor: {
        id: nearestVendor.id,
        vendor_id: nearestVendor.vendor_id,
        status: nearestVendor.status,
        coordinates: {
          latitude: parseFloat(nearestVendor.latitude),
          longitude: parseFloat(nearestVendor.longitude)
        },
        distance_km: parseFloat(distance.toFixed(2)),
        inventory: nearestVendor.inventory ? JSON.parse(nearestVendor.inventory) : null,
        session_id: nearestVendor.session_id,
        last_updated: nearestVendor.created_at
      },
      notification_sent: notificationResult.success,
      notification_details: notificationResult
    });
    
  } catch (error) {
    console.error("Error finding nearest vendor:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to find nearest vendor",
      details: error.message
    });
  }
}





















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
      
      let message;
      let warehouseToReturn;
      
      if (!warehouse) {
        // Get default warehouse (ID 1) when no warehouse serves the location
        const defaultWarehouse = await WarehouseFinderModel.getWarehouseById(7);
        
        if (!defaultWarehouse) {
          return res.status(500).json({
            success: false,
            error: "Default warehouse not found",
            message: "Please contact support"
          });
        }
        
        warehouseToReturn = defaultWarehouse;
        message = "Sorry right now we are not available in your city";
      } else {
        warehouseToReturn = warehouse;
        
        // If cart_type is provided, find vendors matching that type
        // If cart_type is not provided, get vendor stats for message
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
      }
      
      return res.status(200).json({
        success: true,
        message: message,
        warehouse: {
          id: warehouseToReturn.id,
          name: warehouseToReturn.warehouse_Name,
          address: warehouseToReturn.Address,
          coordinates: {
            latitude: warehouseToReturn.latitude,
            longitude: warehouseToReturn.longitude
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
