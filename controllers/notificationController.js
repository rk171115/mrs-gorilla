const mysql = require('mysql2/promise');
const { JWT } = require('google-auth-library');
const axios = require('axios');
require('dotenv').config();

// Firebase Service Account
const SERVICE_ACCOUNT = require('../zdeliver-acc55-firebase-adminsdk-fbsvc-f439bed9a3.json');

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper: Get Firebase Access Token
async function getFirebaseAccessToken() {
  const jwtClient = new JWT({
    email: SERVICE_ACCOUNT.client_email,
    key: SERVICE_ACCOUNT.private_key,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging']
  });
  const tokens = await jwtClient.authorize();
  return tokens.access_token;
}

// Helper: Send Firebase Notification
async function sendFirebaseNotification(token, data) {
  try {
    const accessToken = await getFirebaseAccessToken();
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
        data: stringData,
        android: {
          priority: "HIGH",
          notification: {
            sound: "default",
            channel_id: "high_importance_channel"
          }
        },
        apns: {
          payload: {
            aps: {
              sound: "default"
            }
          }
        }
      }
    };

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

// Send notification from user to vendor
exports.sendUserToVendorNotification = async (req, res) => {
  try {
    const { user_id, booking_order_id, vendor_id } = req.body;

    if (!user_id || !booking_order_id || !vendor_id) {
      return res.status(400).json({
        status: false,
        message: 'Missing required fields: user_id, booking_order_id, vendor_id'
      });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ 
        status: false, 
        message: 'User not found' 
      });
    }
    const user = users[0];

    const [bookingOrders] = await pool.query('SELECT * FROM booking_order WHERE id = ?', [booking_order_id]);
    if (bookingOrders.length === 0) {
      return res.status(404).json({ 
        status: false, 
        message: 'Booking order not found' 
      });
    }
    const bookingOrder = bookingOrders[0];

    const [vendors] = await pool.query('SELECT * FROM vendor_details WHERE id = ?', [vendor_id]);
    if (vendors.length === 0) {
      return res.status(404).json({ 
        status: false, 
        message: 'Vendor not found' 
      });
    }
    const vendor = vendors[0];

    if (!vendor.fcm_token) {
      return res.status(400).json({ 
        status: false, 
        message: 'Vendor FCM token not available' 
      });
    }

    // Create notification content
    const notificationData = {
      title: bookingOrder.booking_type.toUpperCase(),
      body: `${user.full_name}\nAddress: ${bookingOrder.address}\nOrder ID: ${bookingOrder.id}`,
      booking_id: String(bookingOrder.id),
      address: bookingOrder.address,
      notification_type: 'order_request',
      user_id: String(user.id),
      vendor_id: String(vendor.id)
    };

    // Send notification (we don't need the Firebase response)
    await sendFirebaseNotification(vendor.fcm_token, notificationData);

    // Simplified response
    return res.status(200).json({
      status: true,
      message: 'Notification sent successfully to vendor',
      title: notificationData.title,
      body: notificationData.body
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// Send notification from vendor to user (order acceptance)
exports.sendVendorToUserNotification = async (req, res) => {
  try {
    const { user_id, booking_order_id, vendor_id } = req.body;

    if (!user_id || !booking_order_id || !vendor_id) {
      return res.status(400).json({
        status: false,
        message: 'Missing required fields: user_id, booking_order_id, vendor_id'
      });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ 
        status: false, 
        message: 'User not found' 
      });
    }
    const user = users[0];

    if (!user.fcm_token) {
      return res.status(400).json({ 
        status: false, 
        message: 'User FCM token not available' 
      });
    }

    const [bookingOrders] = await pool.query('SELECT * FROM booking_order WHERE id = ?', [booking_order_id]);
    if (bookingOrders.length === 0) {
      return res.status(404).json({ 
        status: false, 
        message: 'Booking order not found' 
      });
    }
    const bookingOrder = bookingOrders[0];

    const [vendors] = await pool.query('SELECT * FROM vendor_details WHERE id = ?', [vendor_id]);
    if (vendors.length === 0) {
      return res.status(404).json({ 
        status: false, 
        message: 'Vendor not found' 
      });
    }
    const vendor = vendors[0];

    // Create notification content
    const vendorName = vendor.Name || "Unknown Vendor";
    const notificationData = {
      title: 'ORDER ACCEPTED',
      body: `Vendor: ${vendorName}\nOrder ID: ${bookingOrder.id}\nAddress: ${bookingOrder.address}`,
      booking_id: String(bookingOrder.id),
      address: bookingOrder.address,
      notification_type: 'order_accepted',
      user_id: String(user.id),
      vendor_id: String(vendor.id),
      vendor_name: vendorName
    };

    // Send notification (we don't need the Firebase response)
    await sendFirebaseNotification(user.fcm_token, notificationData);

    // Simplified response
    return res.status(200).json({
      status: true,
      message: 'Order acceptance notification sent successfully to user',
      title: notificationData.title,
      body: notificationData.body
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to send order acceptance notification',
      error: error.message
    });
  }
};