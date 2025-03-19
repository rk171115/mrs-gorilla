// models/Baskets/baskettable.js
const { pool } = require('../../db_conn');

class BasketTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS baskets (
        basket_id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL,
        basket_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        icon_image VARCHAR(255) DEFAULT NULL,
        item_id INT(11) NOT NULL,
        quantity INT(11) NOT NULL DEFAULT 1,
        weekday ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (basket_id),
        KEY user_id (user_id),
        KEY item_id (item_id)
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS baskets';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE baskets';
    const [rows] = await pool.query(query);
    return rows;
  }
}

// Execute createTable when file is run directly
// if (require.main === module) {
//   BasketTable.createTable()
//     .then(() => {
//       console.log('Baskets table created successfully');
//       process.exit(0);
//     })
//     .catch(err => {
//       console.error('Error creating baskets table:', err);
//       process.exit(1);
//     });
// }

module.exports = BasketTable;