const { pool } = require('../../db_conn');

class DishNutritionTable {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS dish_nutrition (
        id INT(11) NOT NULL AUTO_INCREMENT,
        dish_id INT(11) NOT NULL,
        calories INT(11) NOT NULL,
        carbohydrates DECIMAL(10,2) NOT NULL,
        protein DECIMAL(10,2) NOT NULL,
        fats DECIMAL(10,2) NOT NULL,
        fiber DECIMAL(10,2) NOT NULL,
        serving_size VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        carbs_source VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
        protein_source VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
        fats_source VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
        fiber_source VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
        PRIMARY KEY (id)
      )
    `;
    await pool.query(query);
    return true;
  }

  static async dropTable() {
    const query = 'DROP TABLE IF EXISTS dish_nutrition';
    await pool.query(query);
    return true;
  }

  static async getTableInfo() {
    const query = 'DESCRIBE dish_nutrition';
    const [rows] = await pool.query(query);
    return rows;
  }
}

// Execute createTable when file is run directly
// if (require.main === module) {
//   DishNutritionTable.createTable()
//     .then(() => {
//       console.log('Dish nutrition table created successfully');
//       process.exit(0);
//     })
//     .catch(err => {
//       console.error('Error creating dish nutrition table:', err);
//       process.exit(1);
//     });
// }

module.exports = DishNutritionTable;