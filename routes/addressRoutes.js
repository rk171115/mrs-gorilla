const express = require('express');
const router = express.Router();
const AddressController = require('../controllers/addressController');
const auth = require('../middleware/auth');

// Assuming you may have optional authentication
//const { protect } = require('../middleware/auth'); // Optional middleware

// Address management routes
router.post('/',auth, AddressController.createAddress);
router.get('/',auth, AddressController.getAllAddresses);
router.get('/:id',auth, AddressController.getAddressById);
router.put('/:id',auth, AddressController.updateAddress);
router.delete('/:id',auth, AddressController.deleteAddress);
router.patch('/:id/set-default',auth, AddressController.setDefaultAddress);

module.exports = router;