const express = require('express');
const router = express.Router();
const AddressController = require('../controllers/addressController');
const auth = require('../middleware/auth');

// Assuming you may have optional authentication
//const { protect } = require('../middleware/auth'); // Optional middleware

// Address management routes
router.post('/', AddressController.createAddress);
router.get('/', AddressController.getAllAddresses);
router.get('/:id', AddressController.getAddressById);
router.put('/:id', AddressController.updateAddress);
router.delete('/:id', AddressController.deleteAddress);
router.patch('/:id/set-default', AddressController.setDefaultAddress);

module.exports = router;
