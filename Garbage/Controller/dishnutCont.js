const { pool } = require('../db_conn');

class DishNutritionController {
  static async getDishNutrition(req, res) {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Dish name is required" });
      }
      
      // Get dish details based on name
      const [dishDetails] = await pool.query(
        `SELECT id, name, image_url, image_url_2 FROM dishes WHERE name = ?`,
        [name]
      );
      
      if (dishDetails.length === 0) {
        return res.status(404).json({ error: "Dish not found" });
      }
      
      const dishId = dishDetails[0].id;
      
      // Query to fetch nutrition information
      const nutritionQuery = `
        SELECT
          dn.calories,
          dn.carbohydrates,
          dn.protein,
          dn.fats,
          dn.fiber,
          dn.serving_size
        FROM dish_nutrition dn
        WHERE dn.dish_id = ?
      `;
      
      const [nutritionInfo] = await pool.query(nutritionQuery, [dishId]);
      
      if (nutritionInfo.length === 0) {
        return res.status(404).json({
          error: "Nutrition information not found for this dish"
        });
      }
      
      // Define sources based on dish name or category
      let carbsSource, proteinSource, fatsSource, fiberSource;
      
      // For Aloo Paratha or similar dishes
      if (name.toLowerCase().includes('aloo') || name.toLowerCase().includes('paratha')) {
        carbsSource = 'from whole wheat flour & potatoes';
        proteinSource = 'from wheat and dairy if used';
        fatsSource = 'depends on ghee/butter usage';
        fiberSource = 'from whole wheat and potatoes';
      } else {
        // Default sources for other dishes
        carbsSource = 'from ingredients';
        proteinSource = 'from ingredients';
        fatsSource = 'from ingredients';
        fiberSource = 'from ingredients';
      }
      
      // Format nutrition data with sources
      const nutrition = {
        calories: `~${nutritionInfo[0].calories} kcal`,
        carbohydrates: `~${nutritionInfo[0].carbohydrates}g (${carbsSource})`,
        protein: `~${nutritionInfo[0].protein}g (${proteinSource})`,
        fats: `~${nutritionInfo[0].fats}g (${fatsSource})`,
        fiber: `~${nutritionInfo[0].fiber}g (${fiberSource})`,
        serving_size: `per one medium-sized paratha, approx. ${nutritionInfo[0].serving_size}g, cooked with ghee`
      };
      
      return res.status(200).json({
        dish: dishDetails[0],
        nutrition: nutrition
      });
      
    } catch (error) {
      console.error("Error fetching dish nutrition:", error);
      return res.status(500).json({
        error: "Failed to retrieve dish nutrition information",
        details: error.message
      });
    }
  }

  // Get both dish details and nutrition in one call
  static async getDishWithNutrition(req, res) {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Dish name is required" });
      }
      
      // Get dish details and nutrition in one query with JOIN
      const query = `
        SELECT 
          d.id,
          d.name,
          d.category,
          d.description,
          d.image_url,
          d.image_url_2,
          dn.calories,
          dn.carbohydrates,
          dn.protein,
          dn.fats,
          dn.fiber,
          dn.serving_size
        FROM dishes d
        LEFT JOIN dish_nutrition dn ON d.id = dn.dish_id
        WHERE d.name = ?
      `;
      
      const [results] = await pool.query(query, [name]);
      
      if (results.length === 0) {
        return res.status(404).json({ error: "Dish not found" });
      }
      
      // Format the response
      const dishInfo = {
        id: results[0].id,
        name: results[0].name,
        category: results[0].category,
        description: results[0].description,
        image_url: results[0].image_url,
        image_url_2: results[0].image_url_2
      };
      
      // Define sources based on dish name or category
      let carbsSource, proteinSource, fatsSource, fiberSource;
      
      // For Aloo Paratha or similar dishes
      if (name.toLowerCase().includes('aloo') || name.toLowerCase().includes('paratha')) {
        carbsSource = 'from whole wheat flour & potatoes';
        proteinSource = 'from wheat and dairy if used';
        fatsSource = 'depends on ghee/butter usage';
        fiberSource = 'from whole wheat and potatoes';
      } else {
        // Default sources for other dishes
        carbsSource = 'from ingredients';
        proteinSource = 'from ingredients';
        fatsSource = 'from ingredients';
        fiberSource = 'from ingredients';
      }
      
      const nutrition = {
        calories: `~${results[0].calories} kcal`,
        carbohydrates: `~${results[0].carbohydrates}g (${carbsSource})`,
        protein: `~${results[0].protein}g (${proteinSource})`,
        fats: `~${results[0].fats}g (${fatsSource})`,
        fiber: `~${results[0].fiber}g (${fiberSource})`,
        serving_size: `per one medium-sized paratha, approx. ${results[0].serving_size}g, cooked with ghee`
      };
      
      return res.status(200).json({
        dish: dishInfo,
        nutrition: nutrition
      });
      
    } catch (error) {
      console.error("Error fetching dish with nutrition:", error);
      return res.status(500).json({
        error: "Failed to retrieve dish with nutrition",
        details: error.message
      });
    }
  }
}

module.exports = DishNutritionController;