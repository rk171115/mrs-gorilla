const { pool } = require('../../db_conn');

class BasketTable {
  static async createTable() {
    // Create baskets table with user_id as a foreign key
    const createBasketsTableQuery = `
      CREATE TABLE IF NOT EXISTS baskets (
        basket_id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL,
        basket_name VARCHAR(100) NOT NULL,
        icon_image VARCHAR(255) NULL,
        weekday ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun') NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (basket_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    // Create basket_details table 
    const createBasketDetailsTableQuery = `
      CREATE TABLE IF NOT EXISTS basket_details (
        detail_id INT(11) NOT NULL AUTO_INCREMENT,
        basket_id INT(11) NOT NULL,
        item_id INT(11) NOT NULL,
        quantity INT(11) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (detail_id),
        FOREIGN KEY (basket_id) REFERENCES baskets(basket_id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        UNIQUE KEY unique_basket_item (basket_id, item_id)
      )
    `;

    try {
      // Create baskets table
      await pool.query(createBasketsTableQuery);

      // Create basket_details table
      await pool.query(createBasketDetailsTableQuery);

      return true;
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  static async dropTable() {
    // Drop tables in correct order to avoid foreign key constraints
    await pool.query('DROP TABLE IF EXISTS basket_details');
    await pool.query('DROP TABLE IF EXISTS baskets');
    return true;
  }

  static async getTableInfo() {
    // Get information about baskets table
    const query = 'DESCRIBE baskets';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = BasketTable;