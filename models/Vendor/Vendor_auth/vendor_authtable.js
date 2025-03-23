// models/Vendors/Vendor_auth/vendor_authtable.js
const { pool } = require('../../../db_conn');

class VendorAuthTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS vendor_auth (
        id INT(11) NOT NULL AUTO_INCREMENT,
        vendor_details_id INT(11) NOT NULL,
        phone_no VARCHAR(15) NOT NULL,
        passkey VARCHAR(255) DEFAULT NULL,
        last_login TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (vendor_details_id) REFERENCES vendor_details(id) ON DELETE CASCADE,
        UNIQUE KEY unique_phone (phone_no)
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS vendor_auth';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE vendor_auth';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = VendorAuthTable;