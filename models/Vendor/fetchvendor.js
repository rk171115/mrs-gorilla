const { pool } = require('../../db_conn');

class VendorModel {
  // Get basic vendor information for all vendors
  static async getVendorBasicInfo() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT
          vd.id AS id,
          va.vendorId AS vendorId,
          va.emailId AS emailId,
          vd.Name AS name,
          va.phone_no AS phone_no
        FROM vendor_details vd
        LEFT JOIN vendor_auth va ON va.vendor_details_id = vd.id
      `);
      return rows;
    } finally {
      connection.release();
    }
  }

  // Get basic vendor information by vendor_details.id
  static async getVendorBasicInfoById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT
          vd.id AS id,
          va.vendorId AS vendorId,
          va.emailId AS emailId,
          vd.Name AS name,
          va.phone_no AS phone_no,
          vd.Permanent_address
        FROM vendor_details vd
        LEFT JOIN vendor_auth va ON va.vendor_details_id = vd.id
        WHERE vd.id = ?
      `, [id]);
      return rows;
    } finally {
      connection.release();
    }
  }

  // Get vendor names and IDs for all vendors
  static async getVendorNameAndId() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT
          vd.id AS id,
          va.vendorId AS vendorId,
          vd.Name AS name
        FROM vendor_details vd
        LEFT JOIN vendor_auth va ON va.vendor_details_id = vd.id
      `);
      return rows;
    } finally {
      connection.release();
    }
  }

  // Get vendor name and ID by vendor_details.id
  static async getVendorNameAndIdById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT
          vd.id AS id,
          va.vendorId AS vendorId,
          vd.Name AS name
        FROM vendor_details vd
        LEFT JOIN vendor_auth va ON va.vendor_details_id = vd.id
        WHERE vd.id = ?
      `, [id]);
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = VendorModel;