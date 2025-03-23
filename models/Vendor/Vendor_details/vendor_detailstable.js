// models/Vendors/Vendor_details/vendorDetailsTable.js
const { pool } = require('../../../db_conn');

class VendorDetailsTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS vendor_details (
        id INT(11) NOT NULL AUTO_INCREMENT,
        Name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        AadharNo VARCHAR(12) DEFAULT NULL,
        PanCardNo VARCHAR(10) DEFAULT NULL,
        Dl_no VARCHAR(20) DEFAULT NULL,
        Permanent_address TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        VehicleNo VARCHAR(20) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS vendor_details';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE vendor_details';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = VendorDetailsTable;