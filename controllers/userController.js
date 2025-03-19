const User = require('../models/Users/user');

class UserController {
  // Create a new user
  static async createUser(req, res) {
    try {
      const userData = {
        phone_number: req.body.phone_number,
        full_name: req.body.full_name,
        email: req.body.email,
        is_verified: req.body.is_verified || 0
      };

      // Validate required fields
      if (!userData.phone_number) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      // Check if user with this phone number already exists
      const existingUser = await User.findByPhone(userData.phone_number);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this phone number already exists'
        });
      }

      // Save user to database
      const insertId = await User.create(userData);
      
      // Fetch the newly created user
      const savedUser = await User.findById(insertId);
      
      res.status(201).json({
        success: true,
        data: savedUser
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all users
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get a specific user by ID
  static async getUserById(req, res) {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update a user
  static async updateUser(req, res) {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Update the user
      const affectedRows = await User.update(userId, req.body);
      
      // Fetch the updated user
      const updatedUser = await User.findById(userId);
      
      res.status(200).json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete a user
  static async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Delete the user
      await User.delete(userId);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Search for users
  static async searchUsers(req, res) {
    try {
      const searchTerm = req.query.q;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          error: 'Search term is required'
        });
      }
      
      const users = await User.search(searchTerm);
      
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update last login
  static async updateLastLogin(req, res) {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Update last login
      await User.updateLastLogin(userId);
      
      // Fetch the updated user
      const updatedUser = await User.findById(userId);
      
      res.status(200).json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Set user as verified
  static async setVerified(req, res) {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Set user as verified
      await User.setVerified(userId);
      
      // Fetch the updated user
      const updatedUser = await User.findById(userId);
      
      res.status(200).json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      console.error('Error setting user as verified:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = UserController;