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
   * Create a new order request
   * @param {Object} orderData - Order request data
   * @returns {Promise<Object>} - Result of the insertion
   */
  static async createOrderRequest(orderData) {
    try {
      const { userId, orderId, vendorIds } = orderData;
      
      // Begin a transaction
      await pool.query('START TRANSACTION');
      
      // Insert the main order request
      const orderQuery = `
        INSERT INTO order_request (user_id, booking_id, status, created_at, updated_at)
        VALUES (?, ?, 'pending', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
      `;
      const [orderResult] = await pool.query(orderQuery, [userId, orderId]);
      const orderRequestId = orderResult.insertId;
      
      // Associate vendors with the order request
      for (const vendorId of vendorIds) {
        const vendorOrderQuery = `
          INSERT INTO order_request_vendors (order_request_id, vendor_id, notification_sent, created_at)
          VALUES (?, ?, true, CURRENT_TIMESTAMP())
        `;
        await pool.query(vendorOrderQuery, [orderRequestId, vendorId]);
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      return {
        orderRequestId,
        vendorCount: vendorIds.length
      };
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error creating order request:', error);
      throw error;
    }
  }

  /**
   * Get details of an order request including notified vendors
   * @param {number} orderRequestId - The ID of the order request
   * @returns {Promise<Object>} - Order request details with vendors
   */
  static async getOrderRequestDetails(orderRequestId) {
    try {
      // Get basic order request info
      const orderQuery = `
        SELECT or.id, or.user_id, or.booking_id, or.status, or.created_at
        FROM order_request or
        WHERE or.id = ?
      `;
      const [orderResults] = await pool.query(orderQuery, [orderRequestId]);
      
      if (orderResults.length === 0) {
        return null;
      }
      
      // Get associated vendors
      const vendorsQuery = `
        SELECT vd.id, vd.Name, vd.cart_type, vd.VehicleNo, 
               orv.notification_sent, orv.created_at as notification_time
        FROM order_request_vendors orv
        JOIN vendor_details vd ON orv.vendor_id = vd.id
        WHERE orv.order_request_id = ?
      `;
      const [vendorsResults] = await pool.query(vendorsQuery, [orderRequestId]);
      
      return {
        ...orderResults[0],
        notifiedVendors: vendorsResults
      };
    } catch (error) {
      console.error('Error getting order request details:', error);
      throw error;
    }
  }
}

module.exports = OrderRequestModel;