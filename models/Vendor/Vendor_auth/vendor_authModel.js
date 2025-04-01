const { pool } = require('../../../db_conn');

class VendorAuthModel {
  // Check if a vendor phone number exists in the database
  static async checkVendorPhoneExists(phone_no) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM vendor_auth WHERE phone_no = ?',
        [phone_no]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error checking vendor phone:', error);
      throw error;
    }
  }

  // Get vendor details by vendor_auth id
  static async getVendorDetailsById(vendor_details_id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM vendor_details WHERE id = ?',
        [vendor_details_id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting vendor details:', error);
      throw error;
    }
  }

  // Update last login time
  static async updateLastLogin(id) {
    try {
      await pool.query(
        'UPDATE vendor_auth SET last_login = NOW() WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  // Store OTP in database (temporarily)
  static async storeOTP(phone_no, otp) {
    try {
      // You could create a temporary OTP table, or use a field in vendor_auth
      // For now, I'll use a simple approach with a Map in the controller
      return true;
    } catch (error) {
      console.error('Error storing OTP:', error);
      throw error;
    }
  }

  // Register new vendor (after OTP verification)
  static async registerVendor(vendorData, authData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert into vendor_details first
      const [vendorResult] = await connection.query(
        'INSERT INTO vendor_details (Name, AadharNo, PanCardNo, Dl_no, cart_type, Permanent_address, VehicleNo, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          vendorData.Name,
          vendorData.AadharNo || null,
          vendorData.PanCardNo || null,
          vendorData.Dl_no || null,
          vendorData.cart_type || null,
          vendorData.Permanent_address || null,
          vendorData.VehicleNo || null,
          vendorData.image_url || null
        ]
      );

      // Generate vendor_id (from name and phone number)
      const vendorId = `${vendorData.Name.substring(0, 3)}${authData.phone_no.substring(0, 4)}`;
      
      // Generate passkey (from name and vehicle number, or random if no vehicle)
      let passkey;
      if (vendorData.VehicleNo) {
        passkey = `${vendorData.Name.substring(0, 3)}${vendorData.VehicleNo.substring(0, 3)}`;
      } else {
        // Generate random 3 character alphanumeric string if no vehicle number
        const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
        passkey = `${vendorData.Name.substring(0, 3)}${randomChars}`;
      }

      // Insert into vendor_auth with additional fields
      const [authResult] = await connection.query(
        'INSERT INTO vendor_auth (vendor_details_id, vendorId, emailId, phone_no, passkey) VALUES (?, ?, ?, ?, ?)',
        [
          vendorResult.insertId, 
          vendorId, 
          vendorData.emailId || null, 
          authData.phone_no, 
          passkey
        ]
      );

      await connection.commit();
      
      return {
        vendor_details_id: vendorResult.insertId,
        vendor_auth_id: authResult.insertId,
        vendorId,
        passkey,
        emailId: vendorData.emailId || null
      };
    } catch (error) {
      await connection.rollback();
      console.error('Error registering vendor:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Verify vendor login with vendorId and passkey
  static async verifyVendorCredentials(vendorId, passkey) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          va.id, 
          va.vendor_details_id, 
          va.vendorId, 
          va.emailId, 
          va.passkey, 
          va.phone_no, 
          vd.Name, 
          vd.VehicleNo,
          vd.cart_type,
          vd.image_url
        FROM vendor_auth va 
        JOIN vendor_details vd ON va.vendor_details_id = vd.id 
        WHERE va.vendorId = ? AND va.passkey = ?`,
        [vendorId, passkey]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error verifying vendor credentials:', error);
      throw error;
    }
  }
}

module.exports = VendorAuthModel;