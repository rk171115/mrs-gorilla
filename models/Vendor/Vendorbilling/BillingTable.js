// models/tables/BillingTable.js
const { pool } = require('../../../db_conn');

class BillingTable {
  static async createTable() {
    const billingQuery = `
      CREATE TABLE IF NOT EXISTS billing (
        id INT(11) NOT NULL AUTO_INCREMENT,
        vendor_id INT(11) NOT NULL,
        user_id INT(11) NOT NULL,
        booking_order_id INT(11) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        payment_method ENUM('cash', 'online', 'pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (vendor_id) REFERENCES vendor_details(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (booking_order_id) REFERENCES booking_order(id) ON DELETE CASCADE
      )
    `;
    
    const billingDetailsQuery = `
      CREATE TABLE IF NOT EXISTS billing_details (
        id INT(11) NOT NULL AUTO_INCREMENT,
        billing_id INT(11) NOT NULL,
        item_id INT(11) NOT NULL,
        quantity INT(11) NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (billing_id) REFERENCES billing(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `;
    
    await pool.query(billingQuery);
    await pool.query(billingDetailsQuery);
    return true;
  }

  static async dropTable() {
    // Drop billing_details first due to foreign key constraint
    const dropBillingDetailsQuery = 'DROP TABLE IF EXISTS billing_details';
    await pool.query(dropBillingDetailsQuery);
    
    // Then drop billing table
    const dropBillingQuery = 'DROP TABLE IF EXISTS billing';
    await pool.query(dropBillingQuery);
    
    return true;
  }

  static async getTableInfo() {
    const billingQuery = 'DESCRIBE billing';
    const billingDetailsQuery = 'DESCRIBE billing_details';
    
    const [billingRows] = await pool.query(billingQuery);
    const [billingDetailsRows] = await pool.query(billingDetailsQuery);
    
    return {
      billing: billingRows,
      billingDetails: billingDetailsRows
    };
  }
}

module.exports = BillingTable;