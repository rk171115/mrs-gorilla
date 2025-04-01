// models/OrderRequest.js
const { pool } = require('../../../db_conn');

// Helper method to construct full image URL
const getFullImageUrl = (relativePath) => {
  const BASE_URL = 'http://localhost:8000';
  // If no path or path is undefined, return null
  if (!relativePath) return null;
  // Ensure relativePath is a string and remove leading slash if present
  const cleanPath = String(relativePath).replace(/^\//, '');
  // Return full URL
  return `${BASE_URL}/${cleanPath}`;
};

class OrderRequest {
  // Create a new order request
  static async createOrderRequest(vendorId, bookingId, status = 'pending', reason = null) {
    try {
      const [result] = await pool.query(
        'INSERT INTO order_request (vendor_id, booking_id, status, reason) VALUES (?, ?, ?, ?)',
        [vendorId, bookingId, status, reason]
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
        'UPDATE order_request SET status = ?, reason = ? WHERE id = ?',
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

  // Get all order requests for a vendor
  static async getVendorOrderRequests(vendorId) {
    try {
      const [requests] = await pool.query(`
        SELECT 
          req.id,
          req.status,
          req.reason,
          req.created_at,
          bo.id as booking_id,
          bo.booking_type,
          bo.total_price,
          bo.user_id
        FROM order_request req
        JOIN booking_order bo ON req.booking_id = bo.id
        WHERE req.vendor_id = ?
        ORDER BY req.created_at DESC
      `, [vendorId]);
      
      return { success: true, requests };
    } catch (error) {
      console.error('Error fetching vendor order requests:', error);
      return { success: false, error: error.message };
    }
  }

  // Get details of an order request with booking items
  static async getOrderRequestDetails(requestId) {
    try {
      // Get order request info
      const [requests] = await pool.query(`
        SELECT 
          req.id,
          req.vendor_id,
          req.booking_id,
          req.status,
          req.reason,
          req.created_at,
          vd.Name as vendor_name,
          vd.cart_type,
          bo.booking_type,
          bo.total_price,
          bo.user_id
        FROM order_request req
        JOIN vendor_details vd ON req.vendor_id = vd.id
        JOIN booking_order bo ON req.booking_id = bo.id
        WHERE req.id = ?
      `, [requestId]);
      
      if (requests.length === 0) {
        return { success: false, error: 'Order request not found' };
      }
      
      const request = requests[0];
      
      // Get booking items with simplified fields for accepted orders
      let itemFields = 'bd.id, bd.item_id, bd.quantity, bd.price_per_unit, i.name AS item_name, i.unit, i.image_url AS image_url';
      
      // If status is 'accepted', only return the specified fields
      if (request.status === 'accepted') {
        itemFields = 'bd.item_id, bd.price_per_unit, i.unit, i.image_url AS image_url';
      }
      
      const [items] = await pool.query(`
        SELECT ${itemFields}
        FROM booking_details bd
        JOIN items i ON bd.item_id = i.id
        WHERE bd.booking_id = ?
      `, [request.booking_id]);
      
      // Format items with full image URLs
      const formattedItems = items.map(item => ({
        ...item,
        image_url: getFullImageUrl(item.image_url)
      }));
      
      return { 
        success: true, 
        request, 
        items: formattedItems
      };
    } catch (error) {
      console.error('Error fetching order request details:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all pending order requests
  static async getPendingOrderRequests() {
    try {
      const [requests] = await pool.query(`
        SELECT 
          req.id,
          req.vendor_id,
          req.booking_id,
          req.status,
          req.created_at,
          vd.Name as vendor_name,
          vd.cart_type,
          bo.booking_type,
          bo.total_price
        FROM order_request req
        JOIN vendor_details vd ON req.vendor_id = vd.id
        JOIN booking_order bo ON req.booking_id = bo.id
        WHERE req.status = 'pending'
        ORDER BY req.created_at DESC
      `);
      
      return { success: true, requests };
    } catch (error) {
      console.error('Error fetching pending order requests:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = OrderRequest;