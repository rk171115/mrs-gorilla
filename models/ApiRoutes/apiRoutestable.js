const { pool } = require('../../db_conn');

class ItemsTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS items (
        id INT(11) NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        type ENUM('vegetable', 'fruit', 'ingredient', 'herbs') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        unit ENUM('kg', 'litre', 'piece', 'dozen', 'gram', 'bun') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
        image_url VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
        image_url_2 VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS items';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE items';
    const [rows] = await pool.query(query);
    return rows;
  }
}



module.exports = ItemsTable;