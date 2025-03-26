const { pool } = require('../../db_conn');

class BookingOrderTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS booking_order (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL,
        booking_type ENUM('cart', 'order', 'basket') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        basket_id INT(11) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (basket_id) REFERENCES baskets(id) ON DELETE SET NULL
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

// class BookingDetailsTable {
//   static async createTable() {
//     const query = `
//       CREATE TABLE IF NOT EXISTS booking_details (
//         id INT(11) NOT NULL AUTO_INCREMENT,
//         booking_id INT(11) NOT NULL,
//         item_id INT(11) NOT NULL,
//         quantity DECIMAL(10,2) NULL,
//         price_per_unit DECIMAL(10,2) NOT NULL,
//         PRIMARY KEY (id)
//       )
//     `;
//     await pool.query(query);
//     return true;
//   }

//   static async dropTable() {
//     const query = 'DROP TABLE IF EXISTS booking_details';
//     await pool.query(query);
//     return true;
//   }

//   static async getTableInfo() {
//     const query = 'DESCRIBE booking_details';
//     const [rows] = await pool.query(query);
//     return rows;
//   }
// }

// Execute function if run directly
// if (require.main === module) {
 
//   Promise.all([
//     BookingOrderTable.createTable(),
//     BookingDetailsTable.createTable()
//   ])
//   .then(() => {
//     console.log('Booking tables created successfully');
//     process.exit(0);
//   })
//   .catch(err => {
//     console.error('Error creating booking tables:', err);
//     process.exit(1);
//   });
//}

// module.exports = BookingOrderTable;