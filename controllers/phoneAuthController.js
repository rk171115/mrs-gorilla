const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { pool } = require('../db_conn');
const otpStore = new Map();

class PhoneAuthController {
  // Generate OTP and store in memory map
 static async sendOTP(req, res) {
    try {
      const { phone_number, fcm_token } = req.body;
      if (!phone_number) return res.status(400).json({ success: false, error: "Phone number is required" });

      let otp;
      
      // Check if it's the demo phone number
      if (phone_number === '1234567890') {
        otp = 123456; // Hardcoded OTP for demo
        otpStore.set(phone_number, { otp, expiresAt: Date.now() + 5 * 60 * 1000, fcm_token });
        console.log(`Demo OTP sent for ${phone_number}: ${otp}`);
        return res.status(200).json({ success: true, message: "Demo OTP sent successfully!" });
      }

      // Generate a 6-digit OTP for regular users
      otp = Math.floor(100000 + Math.random() * 900000);
      otpStore.set(phone_number, { otp, expiresAt: Date.now() + 5 * 60 * 1000, fcm_token });

      // Send OTP via Fast2SMS API
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        new URLSearchParams({
          route: "otp",
          variables_values: otp,
          numbers: phone_number
        }),
        {
          headers: {
            "authorization": process.env.FAST2SMS_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      console.log(response.data);
      res.status(200).json({ success: true, message: "OTP sent successfully!" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ success: false, error: "Failed to send OTP" });
    }
  }

  // Verify OTP and generate JWT token
// Verify OTP and generate JWT token
  static async verifyOTP(req, res) {
    try {
      const { phone_number, otp } = req.body;
      if (!phone_number || !otp) return res.status(400).json({
        success: false,
        error: "Phone number and OTP are required"
      });

      // Retrieve stored OTP from memory
      const storedOtpData = otpStore.get(phone_number);
      if (!storedOtpData || storedOtpData.otp !== parseInt(otp)) {
        return res.status(400).json({ success: false, error: "Invalid OTP" });
      }

      // Check if OTP is expired
      if (Date.now() > storedOtpData.expiresAt) {
        otpStore.delete(phone_number);
        return res.status(400).json({ success: false, error: "OTP expired" });
      }

      // Get FCM token from stored data
      const { fcm_token } = storedOtpData;
      // Delete OTP after successful verification
      otpStore.delete(phone_number);

      // Check if user exists
      const [existingUsers] = await pool.query(
        `SELECT * FROM users WHERE phone_number = ?`,
        [phone_number]
      );

      let userId;
      let isNewUser = false;

      if (existingUsers.length > 0) {
        // User Exists → Log them in and update FCM token
        userId = existingUsers[0].id;
        await pool.query(
          `UPDATE users SET last_login = NOW(), fcm_token = ? WHERE phone_number = ?`,
          [fcm_token, phone_number]
        );
      } else {
        const [newUser] = await pool.query(
          `INSERT INTO users (phone_number, fcm_token, is_verified, created_at, updated_at) VALUES (?, ?, TRUE, NOW(), NOW())`,
          [phone_number, fcm_token]
        );
        userId = newUser.insertId;
        isNewUser = true;
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: userId },
        process.env.JWT_SECRET
        // No expiration as per your requirement
      );

      // Return appropriate response based on whether user is new or existing
      if (isNewUser) {
        return res.status(201).json({
          success: true,
          message: "User registered successfully!",
          userId: userId,
          phone_number: phone_number,
          token
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "User logged in successfully!",
          userId: userId,
          phone_number: phone_number,
          token
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ success: false, error: "Failed to verify OTP" });
    }
  }

  static async logout(req, res) {
    try {
      
      return res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        success: false,
        error: "Logout failed"
      });
    }
  }
}

module.exports = PhoneAuthController;
