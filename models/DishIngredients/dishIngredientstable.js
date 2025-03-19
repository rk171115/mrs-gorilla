const { pool } = require('../../db_conn');

class DishIngredientsTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS dish_ingredients (
        id INT(11) NOT NULL AUTO_INCREMENT,
        dish_id INT(11) NOT NULL,
        item_id INT(11) NOT NULL,
        quantity VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        PRIMARY KEY (id)
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS dish_ingredients';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE dish_ingredients';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = DishIngredientsTable;