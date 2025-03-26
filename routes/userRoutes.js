const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
//const { authenticateToken } = require('../middleware/auth'); // Assuming you have auth middleware
const auth = require('../middleware/auth');
// Create a new user
// POST /api/users
router.post('/',auth, UserController.createUser);

// Get all users
// GET /api/users
router.get('/',auth, UserController.getAllUsers);

// Search users
// GET /api/users/search?q=searchTerm
router.get('/search',auth, UserController.searchUsers);

// Get a specific user
// GET /api/users/:id
router.get('/:id',auth, UserController.getUserById);

// Update a user
// PUT /api/users/:id
router.put('/:id',auth, UserController.updateUser);

// Delete a user
// DELETE /api/users/:id
router.delete('/:id',auth, UserController.deleteUser);

// Update last login
// PUT /api/users/:id/login
router.put('/:id/login',auth, UserController.updateLastLogin);

// Set user as verified
// PUT /api/users/:id/verify
router.put('/:id/verify',auth, UserController.setVerified);

module.exports = router;