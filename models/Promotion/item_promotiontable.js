const { pool } = require('../../db_conn');

class ItemPromotionTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS item_promotion (
        promotion_id INT(11) NOT NULL AUTO_INCREMENT,
        item_id INT(11) NOT NULL,
        lowest_price DECIMAL(10, 2),
        lowest_price_date DATE,
        times_purchased_today INT DEFAULT 0,
        times_purchased_this_week INT DEFAULT 0,
        is_featured TINYINT(1) DEFAULT 0,
        promotion_start_date DATE,
        promotion_end_date DATE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (promotion_id),
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS item_promotion';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE item_promotion';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = ItemPromotionTable;