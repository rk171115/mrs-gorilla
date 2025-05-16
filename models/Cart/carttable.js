const { pool } = require('../../db_conn');

class BookingOrderTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS booking_order (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL,
        booking_type ENUM('fruit cart', 'vegetable cart', 'customized cart' ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        total_price DECIMAL(10,2)  NULL,
        basket_id INT(11) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        address VARCHAR(255) NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (basket_id) REFERENCES baskets(basket_id) ON DELETE SET NULL
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS booking_order';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE booking_order';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = BookingOrderTable;