const { pool } = require('../../../db_conn');

class OrderRequestTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS order_request (
        id INT(11) NOT NULL AUTO_INCREMENT,
        vendor_id INT(11) NOT NULL,
        booking_id INT(11) NOT NULL,
        status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
        reason VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (vendor_id) REFERENCES vendor_details(id) ON DELETE CASCADE,
        FOREIGN KEY (booking_id) REFERENCES booking_order(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;
    await pool.query(query);
    return true;
  }

  static async addUserIdColumn() {
    try {
      // First check if the column already exists
      const [columns] = await pool.query('SHOW COLUMNS FROM order_request LIKE "user_id"');
      
      if (columns.length === 0) {
        // Column doesn't exist, so add it with the foreign key
        const query = `
          ALTER TABLE order_request
          ADD COLUMN user_id INT(11) NULL AFTER id,
          ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `;
        await pool.query(query);
        console.log('Added user_id column and foreign key to order_request');
      } else {
        console.log('user_id column already exists in order_request table');
      }
      
      return true;
    } catch (error) {
      console.error('Error adding user_id column to order_request table:', error);
      throw error;
    }
  }
  

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS order_request';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE order_request';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = OrderRequestTable;
