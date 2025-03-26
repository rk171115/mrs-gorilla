const { pool } = require('../../db_conn');

class AddressTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS addresses (
        address_id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL,
        full_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        house_flat_number VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        apartment_society_road VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        address_tag ENUM('Home', 'Work', 'Friends and family', 'Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Home',
        is_default TINYINT(1) DEFAULT 0,
        receiver_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        receiver_phone VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (address_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS addresses';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE addresses';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = AddressTable;