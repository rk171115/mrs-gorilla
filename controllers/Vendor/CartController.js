// controllers/CartController.js
const CartModel = require('../../models/Vendor/CartModel');

// Helper method to construct full image URL
const getFullImageUrl = (relativePath) => {
  const BASE_URL = 'http://13.126.169.224';
  // If no path or path is undefined, return null
  if (!relativePath) return null;
  // Ensure relativePath is a string and remove leading slash if present
  const cleanPath = String(relativePath).replace(/^\//, '');
  // Return full URL
  return `${BASE_URL}/${cleanPath}`;
};

class CartController {
  // Get items based on vendor's cart type
  static async getVendorCartItems(req, res) {
    try {
      const { vendorId } = req.params;
      if (!vendorId) {
        return res.status(400).json({ error: 'Vendor ID is required' });
      }
      
      const result = await CartModel.getItemsByCartType(vendorId);
      
      if (result.error) {
        return res.status(404).json({ error: result.error });
      }
      
      // Format items with full image URLs if they have image properties
      if (result.items && Array.isArray(result.items)) {
        result.items = result.items.map(item => {
          if (item.image_url) {
            item.image_url = getFullImageUrl(item.image_url);
          }
          return item;
        });
      }
      
      return res.status(200).json({
        success: true,
        vendor: result.vendor,
        items: result.items,
        total_items: result.items.length
      });
    } catch (error) {
      console.error('Error fetching vendor cart items:', error);
      return res.status(500).json({
        error: 'Failed to retrieve vendor cart items',
        details: error.message
      });
    }
  }

  // Get all cart types
  static async getCartTypes(req, res) {
    try {
      const cartTypes = await CartModel.getAllCartTypes();
      return res.status(200).json({
        success: true,
        cart_types: cartTypes
      });
    } catch (error) {
      console.error('Error fetching cart types:', error);
      return res.status(500).json({
        error: 'Failed to retrieve cart types',
        details: error.message
      });
    }
  }

  // Get all vendors with their cart types
  static async getVendors(req, res) {
    try {
      const vendors = await CartModel.getVendorsWithCartTypes();
      
      // Format vendor images if they exist
      const formattedVendors = vendors.map(vendor => {
        if (vendor.image_url) {
          vendor.image_url = getFullImageUrl(vendor.image_url);
        }
        return vendor;
      });
      
      return res.status(200).json({
        success: true,
        vendors: formattedVendors,
        total_vendors: formattedVendors.length
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return res.status(500).json({
        error: 'Failed to retrieve vendors',
        details: error.message
      });
    }
  }

  // Get items by specific type (fruit, vegetable, etc.)
  static async getItemsByType(req, res) {
    try {
      const { type } = req.params;
      if (!type) {
        return res.status(400).json({ error: 'Item type is required' });
      }
      
      const items = await CartModel.getItemsByType(type);
      
      // Format items with full image URLs
      const formattedItems = items.map(item => {
        if (item.image_url) {
          item.image_url = getFullImageUrl(item.image_url);
        }
        return item;
      });
      
      return res.status(200).json({
        success: true,
        type: type,
        items: formattedItems,
        total_items: formattedItems.length
      });
    } catch (error) {
      console.error('Error fetching items by type:', error);
      return res.status(500).json({
        error: 'Failed to retrieve items',
        details: error.message
      });
    }
  }
}

module.exports = CartController;
