const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Route to send notification from user to vendor
router.post('/send-notification', notificationController.sendUserToVendorNotification);

// Route to send order acceptance notification from vendor to user
router.post('/send-acceptance-notification', notificationController.sendVendorToUserNotification);

module.exports = router;