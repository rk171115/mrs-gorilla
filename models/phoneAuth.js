const { pool } = require('../db_conn');

class PhoneAuth {
  // Create the necessary tables if they don't exist
  static async initTables() {
    try {
      console.log('🚀 Running migration...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phone_number VARCHAR(15) UNIQUE,  -- Optional, removed NOT NULL
          full_name VARCHAR(100) NULL,      -- Explicitly optional
          email VARCHAR(100) NULL,          -- Explicitly optional
          is_verified BOOLEAN DEFAULT NULL, -- Can be NULL instead of FALSE
          created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL
        )
      `);
      console.log('✅ Users table migrated successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error initializing authentication tables:', error);
      return false;
    }
  }
}

// Run migration automatically when this file is executed directly
if (require.main === module) {
  (async () => {
    const success = await PhoneAuth.initTables();
    if (success) process.exit(0);
    else process.exit(1);
  })();
}

module.exports = PhoneAuth;
