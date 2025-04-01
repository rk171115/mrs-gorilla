// models/BillingModel.js
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

class BillingModel {
  static async createBilling(billingData) {
    const { vendor_id, user_id, booking_order_id, total_price, payment_method = 'pending' } = billingData;
    const query = `
      INSERT INTO billing
      (vendor_id, user_id, booking_order_id, total_price, payment_method)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      vendor_id,
      user_id,
      booking_order_id,
      total_price,
      payment_method
    ]);
    return result.insertId;
  }

  static async addBillingDetails(billingDetails) {
    const { billing_id, item_id, quantity, price } = billingDetails;
    const query = `
      INSERT INTO billing_details
      (billing_id, item_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      billing_id,
      item_id,
      quantity,
      price
    ]);
    return result.insertId;
  }

  static async getBillingById(id) {
    const query = `
      SELECT b.*,
      v.Name as vendor_name,
      u.full_name as user_name
      FROM billing b
      JOIN vendor_details v ON b.vendor_id = v.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  static async getBillingDetailsByBillingId(billing_id) {
    const query = `
      SELECT bd.*,
      i.name as item_name,
      i.image_url,
      i.unit,
      i.price_per_unit
      FROM billing_details bd
      JOIN items i ON bd.item_id = i.id
      WHERE bd.billing_id = ?
    `;
    const [rows] = await pool.query(query, [billing_id]);
    
    // Format items with full image URLs
    return rows.map(item => ({
      ...item,
      image_url: getFullImageUrl(item.image_url)
    }));
  }

  static async getBillingWithDetails(billing_id) {
    try {
      // Get the billing information
      const billing = await this.getBillingById(billing_id);
      if (!billing) {
        return null;
      }
      // Get all billing details
      const billingDetails = await this.getBillingDetailsByBillingId(billing_id);
      return {
        ...billing,
        items: billingDetails
      };
    } catch (error) {
      console.error('Error in getBillingWithDetails:', error);
      throw error;
    }
  }

  static async getBillingsByUserId(user_id) {
    const query = `
      SELECT * FROM billing
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.query(query, [user_id]);
    return rows;
  }

  static async getBillingsByVendorId(vendor_id) {
    const query = `
      SELECT * FROM billing
      WHERE vendor_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.query(query, [vendor_id]);
    return rows;
  }

  static async updatePaymentMethod(billing_id, payment_method) {
    const query = `
      UPDATE billing
      SET payment_method = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [payment_method, billing_id]);
    return result.affectedRows > 0;
  }
}

module.exports = BillingModel;