const { pool, testConnection } = require('../db_conn');

class VegetableCartDatabase {
  // Initialize all necessary tables for the vegetable cart application
  static async initTables() {
    try {
      console.log('🚀 Running database migration...');

      // Test database connection first
      const connectionSuccess = await testConnection();
      if (!connectionSuccess) {
        throw new Error('Database connection failed.');
      }

      // Booking Order Table (formerly bookings)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS booking_order (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          booking_type ENUM('cart', 'order') NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Booking Order table migrated successfully!');

      // Booking Details Table (formerly booking_items)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS booking_details (
          id INT AUTO_INCREMENT PRIMARY KEY,
          booking_id INT NOT NULL,
          item_id INT NOT NULL,
          quantity DECIMAL(10, 2) NULL, -- Nullable for carts
          price_per_unit DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (booking_id) REFERENCES booking_order(id) ON DELETE CASCADE,
          FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Booking Details table migrated successfully!');

      return true;
    } catch (error) {
      console.error('❌ Error initializing vegetable cart database tables:', error);
      return false;
    }
  }
}

// Run migration and update automatically when this file is executed directly
if (require.main === module) {
  (async () => {
    const initSuccess = await VegetableCartDatabase.initTables();
    
    if (initSuccess) {
      console.log('🚀 Database migration completed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Database migration failed.');
      process.exit(1);
    }
  })();
}

module.exports = VegetableCartDatabase;