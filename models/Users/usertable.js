const { pool } = require('../../db_conn');

class UserTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT(11) NOT NULL AUTO_INCREMENT,
        phone_number VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        full_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
        is_verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY phone_number (phone_number)
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS users';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE users';
    const [rows] = await pool.query(query);
    return rows;
  }
}

// Execute createTable when file is run directly
// if (require.main === module) {
//   UserTable.createTable()
//     .then(() => {
//       console.log('Users table created successfully');
//       process.exit(0);
//     })
//     .catch(err => {
//       console.error('Error creating users table:', err);
//       process.exit(1);
//     });
// }

module.exports = UserTable;