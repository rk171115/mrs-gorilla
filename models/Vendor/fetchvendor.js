
const { pool } = require('../../db_conn');

class VendorModel {
  // Get basic vendor information
  static async getVendorBasicInfo() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT
          va.vendorId AS vendorId,
          va.emailId AS emailId,
          vd.Name AS name,
          va.phone_no AS phone_no
        FROM vendor_auth va
        JOIN vendor_details vd ON va.vendor_details_id = vd.id
      `);
      return rows;
    } finally {
      connection.release();
    }
  }
  
  static async getVendorNameAndId() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT
          va.vendorId AS vendorId,
          vd.Name AS name
        FROM vendor_auth va
        JOIN vendor_details vd ON va.vendor_details_id = vd.id
      `);
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = VendorModel;