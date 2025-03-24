// models/Baskets/baskettable.js
const { pool } = require('../../db_conn');

class BasketTable {
  static async createTable() {
    // Modify existing baskets table
    const modifyBasketsTableQuery = `
      ALTER TABLE baskets 
      DROP COLUMN IF EXISTS item_id,
      DROP COLUMN IF EXISTS quantity
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
      // Attempt to modify the baskets table
      await pool.query(modifyBasketsTableQuery);
      
      // Create basket_details table
      await pool.query(createBasketDetailsTableQuery);
      
      return true;
    } catch (error) {
      console.error('Error creating/modifying tables:', error);
      throw error;
    }
  }

  static async dropTable() {
    // Drop tables in correct order to avoid foreign key constraints
    await pool.query('DROP TABLE IF EXISTS basket_details');
    return true;
  }

  static async getTableInfo() {
    // Get information about basket_details table
    const query = 'DESCRIBE basket_details';
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = BasketTable;