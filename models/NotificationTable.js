const { pool } = require('../db_conn');

class NotificationTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT(11) NOT NULL AUTO_INCREMENT,
        receiver_type ENUM('user', 'vendor') NOT NULL,
        vendor_id INT(11) DEFAULT NULL,
        user_id INT(11) DEFAULT NULL,
        booking_order_id INT(11) DEFAULT NULL,
        title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (vendor_id) REFERENCES vendor_details(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (booking_order_id) REFERENCES booking_order(id) ON DELETE CASCADE
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS notifications';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE notifications';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = NotificationTable;