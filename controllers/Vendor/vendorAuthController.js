const axios = require('axios');
require('dotenv').config();
const VendorAuthModel = require('../../models/Vendor/Vendor_auth/vendor_authModel');

// OTP store using a Map (in-memory)
const otpStore = new Map();

class VendorAuthController {
  // Check if phone number exists (unchanged)
  static async checkPhoneNumber(req, res) {
    try {
      const { phone_no } = req.body;
      
      if (!phone_no) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      
      // Check if vendor exists
      const vendorExists = await VendorAuthModel.checkVendorPhoneExists(phone_no);
      
      if (vendorExists) {
        return res.status(200).json({ 
          exists: true,
          message: "Phone number is registered, please login",
          action: "login"
        });
      } else {
        return res.status(200).json({ 
          exists: false,
          message: "You don't have an account",
          action: "signup"
        });
      }
    } catch (error) {
      console.error("Error checking phone number:", error);
      res.status(500).json({ error: "Failed to check phone number" });
    }
  }

  // Send OTP to vendor's phone (modified to store FCM token)
  static async sendOTP(req, res) {
    try {
      const { phone_no, fcm_token } = req.body;
      
      if (!phone_no) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      
      // Check if vendor exists
      const vendorExists = await VendorAuthModel.checkVendorPhoneExists(phone_no);
      
      if (!vendorExists) {
        return res.status(404).json({ 
          error: "You don't have an account", 
          action: "signup" 
        });
      }
      
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      
      // Store OTP in memory with 5 minutes expiry and FCM token
      otpStore.set(phone_no, { 
        otp, 
        fcm_token: fcm_token || null,
        expiresAt: Date.now() + 5 * 60 * 1000 
      });
      
      // Send OTP via Fast2SMS API
      try {
        const response = await axios.post(
          'https://www.fast2sms.com/dev/bulkV2',
          new URLSearchParams({
            route: "otp",
            variables_values: otp,
            numbers: phone_no
          }),
          {
            headers: {
              "authorization": process.env.FAST2SMS_API_KEY,
              "Content-Type": "application/x-www-form-urlencoded"
            }
          }
        );
        console.log("SMS API Response:", response.data);
      } catch (smsError) {
        console.error("SMS API Error:", smsError);
        // For development, we'll continue even if SMS fails
      }
      
      res.status(200).json({ 
        message: "OTP sent successfully for login!",
        action: "verify-otp"
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  }

  // Verify OTP for login (modified to accept FCM token in request body)
  static async verifyLoginOTP(req, res) {
    try {
      const { phone_no, otp, fcm_token } = req.body;
      
      if (!phone_no || !otp) {
        return res.status(400).json({ error: "Phone number and OTP are required" });
      }
      
      // Validate OTP
      const storedOtpData = otpStore.get(phone_no);
      
      if (!storedOtpData || storedOtpData.otp !== parseInt(otp)) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
      
      // Check if OTP is expired
      if (Date.now() > storedOtpData.expiresAt) {
        otpStore.delete(phone_no);
        return res.status(400).json({ error: "OTP expired" });
      }
      
      // Use FCM token from request body, fallback to stored FCM token, or null
      const finalFcmToken = fcm_token || storedOtpData.fcm_token || null;
      
      // Delete OTP after successful verification
      otpStore.delete(phone_no);
      
      // Check if vendor exists
      const vendorAuth = await VendorAuthModel.checkVendorPhoneExists(phone_no);
      
      if (!vendorAuth) {
        return res.status(404).json({ error: "Vendor not registered" });
      }
      
      // Update last login time and FCM token
      await VendorAuthModel.updateLastLoginAndFCMToken(vendorAuth.vendor_details_id, finalFcmToken);
      
      // Get vendor details
      const vendorDetails = await VendorAuthModel.getVendorDetailsById(vendorAuth.vendor_details_id);
      
      res.status(200).json({
        message: "Login successful!",
        vendorId: vendorAuth.vendorId,
        emailId: vendorAuth.emailId,
        passkey: vendorAuth.passkey,
        vendor: {
          ...vendorDetails,
          phone_no: phone_no
        }
      });
    } catch (error) {
      console.error("Error verifying login OTP:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  }

  // Register new vendor (modified to add FCM token)
  static async registerVendor(req, res) {
    try {
      const { phone_no, vendorData, fcm_token } = req.body;
      
      if (!phone_no || !vendorData || !vendorData.Name) {
        return res.status(400).json({ error: "Phone number and vendor name are required" });
      }
      
      // Check if vendor already exists
      const existingVendor = await VendorAuthModel.checkVendorPhoneExists(phone_no);
      
      if (existingVendor) {
        return res.status(409).json({ error: "Phone number already registered" });
      }
      
      // Add FCM token to vendor data
      const vendorDataWithFCM = {
        ...vendorData,
        fcm_token: fcm_token || null
      };
      
      // Register new vendor
      const result = await VendorAuthModel.registerVendor(vendorDataWithFCM, { phone_no });
      
      res.status(201).json({
        message: "Vendor registered successfully!",
        vendorId: result.vendorId,
        emailId: result.emailId,
        passkey: result.passkey
      });
    } catch (error) {
      console.error("Error registering vendor:", error);
      res.status(500).json({ error: "Failed to register vendor" });
    }
  }

  // Verify vendorId and passkey for direct login (modified to update FCM token)
  static async verifyCredentials(req, res) {
    try {
      const { vendorId, passkey, fcm_token } = req.body;
      
      if (!vendorId || !passkey) {
        return res.status(400).json({ error: "Vendor ID and passkey are required" });
      }
      
      // Verify vendor credentials
      const vendor = await VendorAuthModel.verifyVendorCredentials(vendorId, passkey);
      
      if (!vendor) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Update last login time and FCM token
      await VendorAuthModel.updateLastLoginAndFCMTokenById(vendor.vendor_details_id, fcm_token || null);
      
      res.status(200).json({
        message: "Login successful!",
        vendorId: vendor.vendorId,
        emailId: vendor.emailId,
        cart_type: vendor.cart_type,
        image_url: vendor.image_url,
        vendor: {
          ...vendor
        }
      });
    } catch (error) {
      console.error("Error verifying credentials:", error);
      res.status(500).json({ error: "Failed to verify credentials" });
    }
  }
}

module.exports = VendorAuthController;