const { pool } = require('../../../db_conn');

class VendorDetailsTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS vendor_details (
        id INT(11) NOT NULL AUTO_INCREMENT,
        Name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        warehouse_id INT(11) DEFAULT NULL,
        AadharNo VARCHAR(12) DEFAULT NULL,
        PanCardNo VARCHAR(10) DEFAULT NULL,
        Dl_no VARCHAR(20) DEFAULT NULL,
        cart_type VARCHAR(50) DEFAULT NULL,
        fcm_token VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        Permanent_address TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        VehicleNo VARCHAR(20) DEFAULT NULL,
        image_url TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE SET NULL ON UPDATE CASCADE
      )
    `;
    await pool.query(query);
    return true;
  }

  static async alterTableAddWarehouseFK() {
    try {
      // First check if the column already exists
      const [columns] = await pool.query('SHOW COLUMNS FROM vendor_details LIKE "warehouse_id"');

      if (columns.length === 0) {
        // Column doesn't exist, so add it with the foreign key
        const query = `
          ALTER TABLE vendor_details
          ADD COLUMN warehouse_id INT(11) DEFAULT NULL,
          ADD FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE SET NULL ON UPDATE CASCADE
        `;
        await pool.query(query);
        console.log('Added warehouse_id column and foreign key to vendor_details');
      } else {
        console.log('warehouse_id column already exists in vendor_details table');
      }

      return true;
    } catch (error) {
      console.error('Error modifying vendor_details table:', error);
      throw error;
    }
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