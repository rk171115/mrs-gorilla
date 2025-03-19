const { pool } = require('../db_conn');

class VegetableCartDatabase {
  // Initialize all necessary tables for the vegetable cart application
  static async initTables() {
    try {
      console.log('🚀 Running database migration...');
      // Items Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type ENUM('vegetable', 'fruit', 'ingredient') NOT NULL,
        unit ENUM('kg', 'litre', 'piece', 'dozen', 'gram', 'bundle') NOT NULL,
        price_per_unit DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Items table migrated successfully!');

      // Dishes Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS dishes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
        description TEXT NULL,
        image_url VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Dishes table migrated successfully!');

      // Dish Ingredients Table (Many-to-Many relationship)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS dish_ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dish_id INT NOT NULL,
        item_id INT NOT NULL,
        quantity VARCHAR(50) NOT NULL,
        FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        UNIQUE KEY unique_dish_item (dish_id, item_id)
        )
      `);
      console.log('✅ Dish Ingredients table migrated successfully!');

      // Categories Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Categories table migrated successfully!');

      // Category Ingredients Table (Many-to-Many relationship)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS category_ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        item_id INT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        UNIQUE KEY unique_category_item (category_id, item_id)
        )
      `);
      console.log('✅ Category Ingredients table migrated successfully!');

      return true;
    } catch (error) {
      console.error('❌ Error initializing vegetable cart database tables:', error);
      return false;
    }
  }

  // Method to update the items table ENUM type
  static async updateItemsTableTypes() {
    try {
      console.log('🚀 Updating items table types...');
      
      // Alter the table to modify the ENUM type
      await pool.query(`
        ALTER TABLE items 
        MODIFY COLUMN type ENUM('vegetable', 'fruit', 'ingredient', 'herbs', 'staples') NOT NULL
      `);
      
      console.log('✅ Items table types updated successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error updating items table types:', error);
      return false;
    }
  }
}

 // Run migration and update automatically when this file is executed directly
// if (require.main === module) {
//   (async () => {
//     const initSuccess = await VegetableCartDatabase.initTables();
//     const updateSuccess = await VegetableCartDatabase.updateItemsTableTypes();
    
//     if (initSuccess && updateSuccess) process.exit(0);
//     else process.exit(1);
//   })();
// }

module.exports = VegetableCartDatabase;