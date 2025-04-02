const { pool } = require('../../db_conn');

class OrderRequestModel {
  /**
   * Find a warehouse based on latitude and longitude coordinates
   * @param {number} lat - User's latitude
   * @param {number} lng - User's longitude
   * @returns {Promise<Object|null>} - Warehouse information or null if not found
   */
  static async findWarehouseByLocation(lat, lng) {
    try {
      const query = `
        SELECT * FROM warehouse 
        WHERE ? BETWEEN min_lat AND max_lat 
        AND ? BETWEEN min_lng AND max_lng
      `;
      const [warehouses] = await pool.query(query, [lat, lng]);
      return warehouses.length > 0 ? warehouses[0] : null;
    } catch (error) {
      console.error('Error finding warehouse by location:', error);
      throw error;
    }
  }

  /**
   * Find vendors associated with a warehouse and matching the cart type
   * @param {number} warehouseId - The ID of the warehouse
   * @param {string} cartType - The type of cart (vegetable or fruit)
   * @returns {Promise<Array>} - List of matching vendors
   */
  static async findVendorsByWarehouseAndCartType(warehouseId, cartType) {
    try {
      const query = `
        SELECT id, Name, cart_type, VehicleNo, warehouse_id 
        FROM vendor_details 
        WHERE warehouse_id = ? AND cart_type = ?
      `;
      const [vendors] = await pool.query(query, [warehouseId, cartType]);
      return vendors;
    } catch (error) {
      console.error('Error finding vendors:', error);
      throw error;
    }
  }

  /**
   * Create multiple order requests, one for each vendor
   * @param {Object} orderData - Order request data with array of vendor IDs
   * @returns {Promise<Object>} - Result of the insertions
   */
  static async createOrderRequests(orderData) {
    try {
      const { userId, orderId, vendorIds } = orderData;
      const results = [];
      
      // Begin a transaction
      await pool.query('START TRANSACTION');
      
      // Create an order request for each vendor
      for (const vendorId of vendorIds) {
        const orderQuery = `
          INSERT INTO order_request (user_id, booking_id, vendor_id, status, created_at, updated_at)
          VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
        `;
        const [orderResult] = await pool.query(orderQuery, [userId, orderId, vendorId]);
        results.push({
          orderRequestId: orderResult.insertId,
          vendorId
        });
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      return {
        orderRequests: results,
        vendorCount: vendorIds.length
      };
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error creating order requests:', error);
      throw error;
    }
  }

  /**
   * Get details of an order request
   * @param {number} orderRequestId - The ID of the order request
   * @returns {Promise<Object>} - Order request details
   */
  static async getOrderRequestDetails(orderRequestId) {
    try {
      const query = `
        SELECT or.id, or.user_id, or.booking_id, or.vendor_id, or.status, or.reason, or.created_at, or.updated_at,
               v.Name as vendor_name, v.cart_type, v.VehicleNo
        FROM order_request or
        JOIN vendor_details v ON or.vendor_id = v.id
        WHERE or.id = ?
      `;
      
      const [results] = await pool.query(query, [orderRequestId]);
      
      if (results.length === 0) {
        return null;
      }
      
      return results[0];
    } catch (error) {
      console.error('Error getting order request details:', error);
      throw error;
    }
  }
  
  /**
   * Get all order requests for a specific booking
   * @param {number} bookingId - The booking ID
   * @returns {Promise<Array>} - List of order requests with vendor details
   */
  static async getOrderRequestsByBookingId(bookingId) {
    try {
      const query = `
        SELECT or.id, or.user_id, or.booking_id, or.vendor_id, or.status, or.reason, or.created_at, or.updated_at,
               v.Name as vendor_name, v.cart_type, v.VehicleNo
        FROM order_request or
        JOIN vendor_details v ON or.vendor_id = v.id
        WHERE or.booking_id = ?
      `;
      
      const [results] = await pool.query(query, [bookingId]);
      return results;
    } catch (error) {
      console.error('Error getting order requests by booking ID:', error);
      throw error;
    }
  }
}

module.exports = OrderRequestModel;