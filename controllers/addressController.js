const Address = require('../models/address');

class AddressController {
  // Create a new address
  static async createAddress(req, res) {
    try {
      // Get user ID from authenticated user or request body
      const userId = req.user ? req.user.id : req.body.user_id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      // Check if this is the first address for the user
      let isDefault = req.body.is_default;
      if (isDefault === undefined) {
        const addressCount = await Address.countByUser(userId);
        isDefault = addressCount === 0;
      }
      
      // If setting as default, unset any existing default address
      if (isDefault) {
        await Address.setAllNotDefault(userId);
      }
      
      // Prepare address data
      const addressData = {
        user_id: userId,
        full_address: req.body.full_address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        house_flat_number: req.body.house_flat_number || '',
        apartment_society_road: req.body.apartment_society_road || '',
        address_tag: req.body.address_tag || 'Home',
        is_default: isDefault ? 1 : 0,
        receiver_name: req.body.receiver_name || '',
        receiver_phone: req.body.receiver_phone || ''
      };
      
      // Save address to database
      const insertId = await Address.create(addressData);
      
      // Fetch the newly created address
      const savedAddress = await Address.findById(insertId, userId);
      
      res.status(201).json({
        success: true,
        data: savedAddress
      });
    } catch (error) {
      console.error('Error creating address:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all addresses for a user
  static async getAllAddresses(req, res) {
    try {
      // Get user ID from authenticated user or query parameters
      const userId = req.user ? req.user.id : req.query.user_id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      const addresses = await Address.findAll(userId);
      
      res.status(200).json({
        success: true,
        count: addresses.length,
        data: addresses
      });
    } catch (error) {
      console.error('Error getting addresses:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get a specific address by ID
  static async getAddressById(req, res) {
    try {
      // Get user ID from authenticated user or query parameters
      const userId = req.user ? req.user.id : req.query.user_id;
      const addressId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      const address = await Address.findById(addressId, userId);
      
      if (!address) {
        return res.status(404).json({
          success: false,
          error: 'Address not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: address
      });
    } catch (error) {
      console.error('Error getting address:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update an address
  static async updateAddress(req, res) {
    try {
      // Get user ID from authenticated user or request body
      const userId = req.user ? req.user.id : req.body.user_id;
      const addressId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      // If setting as default, unset any existing default address
      if (req.body.is_default) {
        await Address.setAllNotDefault(userId);
      }
      
      // Update the address
      const affectedRows = await Address.update(addressId, userId, req.body);
      
      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Address not found'
        });
      }
      
      // Fetch the updated address
      const updatedAddress = await Address.findById(addressId, userId);
      
      res.status(200).json({
        success: true,
        data: updatedAddress
      });
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete an address
  static async deleteAddress(req, res) {
    try {
      // Get user ID from authenticated user or query parameters
      const userId = req.user ? req.user.id : req.query.user_id;
      const addressId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      // Check if address exists and is default
      const address = await Address.findById(addressId, userId);
      
      if (!address) {
        return res.status(404).json({
          success: false,
          error: 'Address not found'
        });
      }
      
      // Delete the address
      await Address.delete(addressId, userId);
      
      // If the deleted address was default, set another address as default if exists
      if (address.is_default) {
        const addresses = await Address.findAll(userId);
        if (addresses.length > 0) {
          await Address.setDefault(addresses[0].address_id, userId);
        }
      }
      
      res.status(200).json({
        success: true,
        message: 'Address deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Set an address as default
  static async setDefaultAddress(req, res) {
    try {
      // Get user ID from authenticated user or request body
      const userId = req.user ? req.user.id : req.body.user_id;
      const addressId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      // Unset all default addresses for this user
      await Address.setAllNotDefault(userId);
      
      // Set the specified address as default
      const affectedRows = await Address.setDefault(addressId, userId);
      
      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Address not found'
        });
      }
      
      // Fetch the updated address
      const updatedAddress = await Address.findById(addressId, userId);
      
      res.status(200).json({
        success: true,
        data: updatedAddress
      });
    } catch (error) {
      console.error('Error setting default address:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = AddressController;