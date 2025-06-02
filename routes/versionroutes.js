// routes/version.js

const express = require('express');
const router = express.Router();
const VersionController = require('../controllers/versionController');

/**
 * @route POST /api/version/check
 * @desc Check app version and get update info
 * @access Public
 * @body {
 *   platform: 'ios' | 'android',
 *   current_version: '1.0.0'
 * }
 */
router.post('/check', VersionController.checkVersion);

/**
 * Alternative GET route (if you prefer query parameters)
 * @route GET /api/version/check?platform=android&current_version=1.0.0
 */
router.get('/check', (req, res) => {
    // Convert query params to body format for consistent handling
    req.body = {
        platform: req.query.platform,
        current_version: req.query.current_version
    };
    VersionController.checkVersion(req, res);
});

module.exports = router;