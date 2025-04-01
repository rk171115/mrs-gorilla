// models/CartModel.js
const { pool } = require('../../db_conn');

class CartModel {
    
  // Get items based on vendor cart type (returning only name and image_url)
  static async getItemsByCartType(vendorId) {
    try {
      // First get the vendor and their cart type
      const [vendors] = await pool.query(
        'SELECT id, Name, cart_type FROM vendor_details WHERE id = ?',
        [vendorId]
      );

      if (vendors.length === 0) {
        return { error: 'Vendor not found' };
      }

      const vendor = vendors[0];
      const cartType = vendor.cart_type;

      // Get only name and image_url of items matching the cart type
      const [items] = await pool.query(
        'SELECT id, name, image_url, price_per_unit FROM items WHERE type = ?',
        [cartType]
      );

      return {
        vendor: {
          id: vendor.id,
          name: vendor.Name,
          cart_type: cartType
        },
        items: items
      };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Get all available cart types
  static async getAllCartTypes() {
    try {
      const [result] = await pool.query(
        'SELECT DISTINCT cart_type FROM vendor_details WHERE cart_type IS NOT NULL'
      );
      
      return result.map(item => item.cart_type);
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Get all vendors with their cart types
  static async getVendorsWithCartTypes() {
    try {
      const [vendors] = await pool.query(
        'SELECT id, Name, cart_type FROM vendor_details WHERE cart_type IS NOT NULL'
      );
      
      return vendors;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Get items by type (fruit, vegetable, etc.)
  static async getItemsByType(type) {
    try {
      const [items] = await pool.query(
        'SELECT id, name, type, unit, price_per_unit, old_price_per_unit, description, image_url FROM items WHERE type = ?',
        [type]
      );
      
      return items;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Get items by type (returning only name and image_url)
  static async getItemsNameAndImageByType(type) {
    try {
      const [items] = await pool.query(
        'SELECT name, image_url FROM items WHERE type = ?',
        [type]
      );
      
      return items;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
}

module.exports = CartModel;