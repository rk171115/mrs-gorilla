// models/Warehouse/warehousetable.js
const { pool } = require('../../../db_conn');

class WarehouseTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS warehouse (
        id INT(11) NOT NULL AUTO_INCREMENT,
        vendor_Name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        latitude DECIMAL(10, 8) DEFAULT NULL,
        longitude DECIMAL(11, 8) DEFAULT NULL,
        Address TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS warehouse';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE warehouse';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = WarehouseTable;