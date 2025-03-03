const axios = require('axios');
const redis = require('redis');
require('dotenv').config();
const { pool } = require('../db_conn');
// const client = require('../db_conn');


const otpStore = new Map();
class PhoneAuthController {
  
  // ✅ Generate OTP and store in Redis
  static async sendOTP(req, res) {
    try {
        
      const { phone_number } = req.body;
      if (!phone_number) return res.status(400).json({ error: "Phone number is required" });

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000);

      otpStore.set(phone_number, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
      // Store OTP in Redis with expiry (5 minutes)
      // await client.set(`otp:${phone_number}`, otp, { EX: 300 });

      // Send OTP via Fast2SMS API
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        new URLSearchParams({  // ✅ Fix: Correct payload format
          route: "otp",
          variables_values: otp,
          numbers: phone_number
        }),
        {
          headers: {
            "authorization": process.env.FAST2SMS_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded" // ✅ Fix: Correct content type
          }
        }
      );


      console.log(response.data);
      res.status(200).json({ message: "OTP sent successfully!" });

    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  }

  // ✅ Verify OTP from Redis
  static async verifyOTP(req, res) {
    try {
      const { phone_number, otp } = req.body;
      if (!phone_number || !otp) return res.status(400).json({ error: "Phone number and OTP are required" });

      // Retrieve stored OTP from memory
      const storedOtpData = otpStore.get(phone_number);

      if (!storedOtpData || storedOtpData.otp !== parseInt(otp)) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      // Check if OTP is expired
      if (Date.now() > storedOtpData.expiresAt) {
        otpStore.delete(phone_number);
        return res.status(400).json({ error: "OTP expired" });
      }

      // Delete OTP after successful verification
      otpStore.delete(phone_number);

      // ✅ Check if user exists
      const [existingUser] = await pool.query(
        `SELECT * FROM users WHERE phone_number = ?`,
        [phone_number]
      );

      if (existingUser.length > 0) {
        // ✅ User Exists → Log them in
        await pool.query(
          `UPDATE users SET last_login = NOW() WHERE phone_number = ?`,
          [phone_number]
        );
        return res.status(200).json({ message: "Login successful!", user: existingUser[0] });
      } else {
        // ✅ User Does Not Exist → Register them
        const [newUser] = await pool.query(
          `INSERT INTO users (phone_number, is_verified, created_at, updated_at) VALUES (?, TRUE, NOW(), NOW())`,
          [phone_number]
        );

        return res.status(201).json({ message: "User registered successfully!", user_id: newUser.insertId });
      }
    } catch (error) {
      console.error("❌ Error verifying OTP:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  }
}

module.exports = PhoneAuthController;
