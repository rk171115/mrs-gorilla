// controllers/versionController.js

class VersionController {
    // Configuration
    static latestVersions = {
        ios: '1.1.0',
        android: '1.1.0'
    };

    static storeUrls = {
        ios: 'https://apps.apple.com/in/app/primestage-artist-booking-app/id6736954597',
        android: 'https://play.google.com/store/apps/details?id=your.package.name'
    };

    /**
     * Main version check function
     */
    static async checkVersion(req, res) {
        try {
            const { platform = 'android', current_version } = req.body;
            
            console.log('📨 Received request:', { platform, current_version });

            // Validate platform
            if (!['ios', 'android'].includes(platform)) {
                console.log('❌ Invalid platform:', platform);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid platform. Must be ios or android'
                });
            }

            // Get latest version and check for updates
            const latestVersion = VersionController.latestVersions[platform];
            const forceUpdate = VersionController.shouldForceUpdate(current_version, latestVersion);
            
            console.log('📱 Latest version for', platform, ':', latestVersion);
            console.log('🔄 Force update needed:', forceUpdate);

            // Build response with conditional message
            const responseData = {
                latest_version: latestVersion,
                force_update: forceUpdate,
                update_url: VersionController.storeUrls[platform]
            };

            // Add appropriate message based on update status
            if (forceUpdate || VersionController.isUpdateAvailable(current_version, latestVersion)) {
                responseData.update_message = forceUpdate 
                    ? 'A critical update is required. Please update to continue using the app.'
                    : 'A new version is available. Please update to get the latest features.';
            } else {
                responseData.update_message = 'You are using the latest version.';
            }

            return res.json({
                success: true,
                data: responseData
            });

        } catch (error) {
            console.error('💥 Version check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Check if force update is required (major version difference)
     */
    static shouldForceUpdate(currentVersion, latestVersion) {
        if (!currentVersion) {
            console.log('⚠️ No current version provided, forcing update');
            return true;
        }

        try {
            const currentParts = currentVersion.split('.');
            const latestParts = latestVersion.split('.');

            console.log('🔢 Comparing versions:');
            console.log('   Current:', currentParts);
            console.log('   Latest:', latestParts);

            const currentMajor = parseInt(currentParts[0]);
            const latestMajor = parseInt(latestParts[0]);

            const needsUpdate = currentMajor < latestMajor;
            console.log(`   Major versions: ${currentMajor} < ${latestMajor} = ${needsUpdate}`);

            return needsUpdate;

        } catch (error) {
            console.log('💥 Version parsing error, forcing update:', error.message);
            return true;
        }
    }

    /**
     * Check if any update is available (not just force update)
     */
    static isUpdateAvailable(currentVersion, latestVersion) {
        if (!currentVersion) return true;
        
        try {
            const current = currentVersion.trim();
            const latest = latestVersion.trim();
            
            // If versions are exactly the same, no update needed
            if (current === latest) {
                console.log('✅ Versions match exactly:', current, '===', latest);
                return false;
            }
            
            // Parse version parts for detailed comparison
            const currentParts = current.split('.').map(part => parseInt(part) || 0);
            const latestParts = latest.split('.').map(part => parseInt(part) || 0);
            
            // Compare each part (major.minor.patch)
            for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
                const currentPart = currentParts[i] || 0;
                const latestPart = latestParts[i] || 0;
                
                if (currentPart < latestPart) {
                    console.log(`📱 Update available: ${current} < ${latest}`);
                    return true;
                } else if (currentPart > latestPart) {
                    console.log(`🚀 Current version is newer: ${current} > ${latest}`);
                    return false;
                }
            }
            
            console.log('✅ Versions are identical:', current, '===', latest);
            return false;
            
        } catch (error) {
            console.log('💥 Version comparison error:', error.message);
            return true;
        }
    }

    /**
     * Helper method to get store URL
     */
    static getStoreUrl(platform) {
        return VersionController.storeUrls[platform] || VersionController.storeUrls.android;
    }
}

module.exports = VersionController;