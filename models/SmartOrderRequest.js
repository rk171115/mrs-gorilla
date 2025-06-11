// models/SmartOrderRequest.js - FIXED VERSION
const { pool } = require('../db_conn');

// Helper method to construct full image URL
const getFullImageUrl = (relativePath) => {
  const BASE_URL = 'http://localhost:8000';
  if (!relativePath) return null;
  const cleanPath = String(relativePath).replace(/^\//, '');
  return `${BASE_URL}/${cleanPath}`;
};

// Helper method to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

class SmartOrderRequest {
  
  // Find the closest warehouse based on user's location
  static async findClosestWarehouse(userLat, userLng) {
    try {
      // Get all warehouses
      const [warehouses] = await pool.query(`
        SELECT 
          id,
          warehouse_Name,
          latitude,
          longitude,
          Address,
          min_lat,
          max_lat,
          min_lng,
          max_lng
        FROM warehouse
      `);

      if (warehouses.length === 0) {
        return { success: false, error: 'No warehouses found' };
      }

      // Find warehouses where user location falls within boundaries
      const validWarehouses = warehouses.filter(warehouse => {
        return userLat >= warehouse.min_lat && 
               userLat <= warehouse.max_lat && 
               userLng >= warehouse.min_lng && 
               userLng <= warehouse.max_lng;
      });

      if (validWarehouses.length === 0) {
        // If no warehouse boundaries contain the user, find the closest one by distance
        const warehousesWithDistance = warehouses.map(warehouse => {
          const distance = calculateDistance(
            userLat, userLng, 
            warehouse.latitude, warehouse.longitude
          );
          return { ...warehouse, distance };
        });

        // Sort by distance and return the closest
        warehousesWithDistance.sort((a, b) => a.distance - b.distance);
        return { success: true, warehouse: warehousesWithDistance[0] };
      }

      // If multiple warehouses contain the user, find the closest by distance
      if (validWarehouses.length === 1) {
        return { success: true, warehouse: validWarehouses[0] };
      }

      const warehousesWithDistance = validWarehouses.map(warehouse => {
        const distance = calculateDistance(
          userLat, userLng, 
          warehouse.latitude, warehouse.longitude
        );
        return { ...warehouse, distance };
      });

      warehousesWithDistance.sort((a, b) => a.distance - b.distance);
      return { success: true, warehouse: warehousesWithDistance[0] };

    } catch (error) {
      console.error('Error finding closest warehouse:', error);
      return { success: false, error: error.message };
    }
  }

  // Find vendors by warehouse and cart type - FIXED SQL QUERY
  static async findVendorsByWarehouseAndCartType(warehouseId, cartType) {
    try {
      const [vendors] = await pool.query(`
        SELECT 
          id,
          Name,
          warehouse_id,
          cart_type,
          fcm_token,
          AadharNo,
          PanCardNo,
          Dl_no
        FROM vendor_details 
        WHERE warehouse_id = ? AND cart_type = ? AND fcm_token IS NOT NULL
        ORDER BY Name
      `, [warehouseId, cartType]);

      if (vendors.length === 0) {
        return { success: false, error: `No vendors found for warehouse ${warehouseId} with cart_type: ${cartType}` };
      }

      return { success: true, vendors };
    } catch (error) {
      console.error('Error finding vendors:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a new order request
  static async createOrderRequest(vendorId, bookingId, userId, status = 'pending', reason = null) {
    try {
      const [result] = await pool.query(
        'INSERT INTO order_request (vendor_id, booking_id, user_id, status, reason, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [vendorId, bookingId, userId, status, reason]
      );
      
      return { success: true, id: result.insertId };
    } catch (error) {
      console.error('Error creating order request:', error);
      return { success: false, error: error.message };
    }
  }
  // Update the status of an order request
  static async updateOrderRequestStatus(id, status, reason = null) {
    try {
      const [result] = await pool.query(
        'UPDATE order_request SET status = ?, reason = ?, updated_at = NOW() WHERE id = ?',
        [status, reason, id]
      );
      
      if (result.affectedRows === 0) {
        return { success: false, error: 'Order request not found' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating order request:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel other pending requests
  static async cancelOtherPendingRequests(bookingId, acceptedRequestId) {
    try {
      // First check how many pending requests exist for this booking
      const [pendingCount] = await pool.query(
        'SELECT COUNT(*) as count FROM order_request WHERE booking_id = ? AND status = ?',
        [bookingId, 'pending']
      );
      
      // Only cancel others if there are more than 1 pending requests
      if (pendingCount[0].count > 1) {
        const [result] = await pool.query(
          'UPDATE order_request SET status = ?, reason = ?, updated_at = NOW() WHERE booking_id = ? AND id != ? AND status = ?',
          ['canceled', 'Order accepted by another vendor', bookingId, acceptedRequestId, 'pending']
        );
        
        console.log(`Cancelled ${result.affectedRows} other pending requests for booking ${bookingId}`);
        return { success: true, canceled_count: result.affectedRows };
      } else {
        console.log(`No other pending requests to cancel for booking ${bookingId}`);
        return { success: true, canceled_count: 0 };
      }
    } catch (error) {
      console.error('Error cancelling other pending requests:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all order requests for a vendor
  static async getVendorOrderRequests(vendorId) {
    try {
      // First, fetch the order requests
      const [requests] = await pool.query(`
        SELECT
          req.id,
          req.status,
          req.reason,
          req.created_at,
          req.updated_at,
          bo.id as booking_id,
          bo.booking_type,
          bo.total_price,
          bo.user_id,
          bo.latitude,
          bo.longitude,
          u.full_name as user_name,
          u.phone_number as user_phone,
          bo.address
        FROM order_request req
        JOIN booking_order bo ON req.booking_id = bo.id
        JOIN users u ON bo.user_id = u.id
        WHERE req.vendor_id = ?
        ORDER BY req.created_at DESC
      `, [vendorId]);
      
      // For each request, fetch a preview of items (limited to 2)
      const requestsWithItems = await Promise.all(requests.map(async (request) => {
        // Get items for this booking (limited to 2 for preview)
        const [items] = await pool.query(`
          SELECT 
            bd.item_id,
            bd.quantity,
            bd.price_per_unit,
            i.name AS item_name,
            i.image_url
          FROM booking_details bd
          JOIN items i ON bd.item_id = i.id
          WHERE bd.booking_id = ?
          LIMIT 2
        `, [request.booking_id]);

        // Add full image URLs to items
        const itemsWithImages = items.map(item => ({
          ...item,
          image_url: getFullImageUrl(item.image_url)
        }));

        return {
          ...request,
          items_preview: itemsWithImages,
          total_items_count: await this.getTotalItemsCount(request.booking_id)
        };
      }));
      
      return { success: true, requests: requestsWithItems };
    } catch (error) {
      console.error('Error getting vendor order requests:', error);
      return { success: false, error: error.message };
    }
  }

  // Get total items count for a booking
  static async getTotalItemsCount(bookingId) {
    try {
      const [result] = await pool.query(
        'SELECT COUNT(*) as count FROM booking_details WHERE booking_id = ?',
        [bookingId]
      );
      return result[0].count;
    } catch (error) {
      console.error('Error getting total items count:', error);
      return 0;
    }
  }

  // Get order request details with all items
  static async getOrderRequestDetails(id) {
    try {
      // Get the order request details
      const [requests] = await pool.query(`
        SELECT
          req.id,
          req.vendor_id,
          req.booking_id,
          req.status,
          req.reason,
          req.created_at,
          req.updated_at,
          bo.booking_type,
          bo.total_price,
          bo.user_id,
          bo.address,
          u.full_name as user_name,
          u.phone_number as user_phone,
          v.Name as vendor_name
        FROM order_request req
        JOIN booking_order bo ON req.booking_id = bo.id
        JOIN users u ON bo.user_id = u.id
        LEFT JOIN vendor_details v ON req.vendor_id = v.id
        WHERE req.id = ?
      `, [id]);

      if (requests.length === 0) {
        return { success: false, error: 'Order request not found' };
      }

      const request = requests[0];

      // Get all items for this booking
      const [items] = await pool.query(`
        SELECT 
          bd.item_id,
          bd.quantity,
          bd.price_per_unit,
          i.name AS item_name,
          i.image_url,
          i.description
        FROM booking_details bd
        JOIN items i ON bd.item_id = i.id
        WHERE bd.booking_id = ?
        ORDER BY i.name
      `, [request.booking_id]);

      // Add full image URLs to items
      const itemsWithImages = items.map(item => ({
        ...item,
        image_url: getFullImageUrl(item.image_url)
      }));

      return { success: true, request, items: itemsWithImages };
    } catch (error) {
      console.error('Error getting order request details:', error);
      return { success: false, error: error.message };
    }
  }

  // Add this to your SmartOrderRequest model
static async getOrderRequestByVendorAndBooking(vendor_id, booking_id) {
  try {
    const query = `
      SELECT ord.*, u.full_name as user_name, bo.address, bo.booking_type
FROM order_request ord
LEFT JOIN users u ON ord.user_id = u.id
LEFT JOIN booking_order bo ON ord.booking_id = bo.id
WHERE ord.vendor_id = '2' AND ord.booking_id = 1 
ORDER BY ord.created_at DESC
LIMIT 1
    `;
    
    const [rows] = await pool.query(query, [vendor_id, booking_id]);
    
    if (rows.length === 0) {
      return { success: false, error: 'Order request not found for this vendor and booking' };
    }
    
    return { success: true, request: rows[0] };
  } catch (error) {
    console.error('Error getting order request by vendor and booking:', error);
    return { success: false, error: 'Database error' };
  }
}

  // Get all pending order requests (admin view)
  static async getPendingOrderRequests() {
    try {
      const [requests] = await pool.query(`
        SELECT
          req.id,
          req.vendor_id,
          req.booking_id,
          req.status,
          req.reason,
          req.created_at,
          bo.booking_type,
          bo.total_price,
          bo.user_id,
          bo.address,
          u.full_name as user_name,
          u.phone_number as user_phone,
          v.Name as vendor_name
        FROM order_request req
        JOIN booking_order bo ON req.booking_id = bo.id
        JOIN users u ON bo.user_id = u.id
        LEFT JOIN vendor_details v ON req.vendor_id = v.id
        WHERE req.status = 'pending'
        ORDER BY req.created_at DESC
      `);
      
      return { success: true, requests };
    } catch (error) {
      console.error('Error getting pending order requests:', error);
      return { success: false, error: error.message };
    }
  }

  // Get warehouse information
  static async getWarehouseInfo() {
    try {
      const [warehouses] = await pool.query(`
        SELECT 
          id,
          warehouse_Name,
          latitude,
          longitude,
          Address,
          min_lat,
          max_lat,
          min_lng,
          max_lng
        FROM warehouse
        ORDER BY warehouse_Name
      `);
      
      return { success: true, warehouses };
    } catch (error) {
      console.error('Error getting warehouse info:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user order history
  static async getUserOrderHistory(userId) {
    try {
      const [orders] = await pool.query(`
        SELECT
          req.id,
          req.vendor_id,
          req.booking_id,
          req.status,
          req.reason,
          req.created_at,
          req.updated_at,
          bo.booking_type,
          bo.total_price,
          bo.address,
          v.Name as vendor_name,
          v.cart_type
        FROM order_request req
        JOIN booking_order bo ON req.booking_id = bo.id
        LEFT JOIN vendor_details v ON req.vendor_id = v.id
        WHERE bo.user_id = ?
        ORDER BY req.created_at DESC
      `, [userId]);
      
      return { success: true, orders };
    } catch (error) {
      console.error('Error getting user order history:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SmartOrderRequest;