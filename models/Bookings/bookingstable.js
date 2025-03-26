const { pool } = require('../../db_conn');

class BookingDetailsTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS booking_details (
        id INT(11) NOT NULL AUTO_INCREMENT,
        booking_id INT(11) NOT NULL,
        item_id INT(11) NOT NULL,
        quantity VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (booking_id) REFERENCES booking_order(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS booking_details';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE booking_details';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = BookingDetailsTable;