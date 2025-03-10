const { pool } = require('../db_conn');

class DishIngredientsController {
  static async getDishIngredients(req, res) {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Dish name is required" });
      }
      
      // Get dish details based on name
      const [dishDetails] = await pool.query(
        `SELECT id, name, category, description, image_url, image_url_2 FROM dishes WHERE name = ?`, 
        [name]
      );
      
      if (dishDetails.length === 0) {
        return res.status(404).json({ error: "Dish not found" });
      }
      
      const dishId = dishDetails[0].id;
      
      // Query to fetch ingredients
      const query = `
        SELECT 
          i.id,
          i.name,
          i.type,
          i.price_per_unit,
          di.quantity,
          i.unit
        FROM dish_ingredients di
        JOIN items i ON di.item_id = i.id
        WHERE di.dish_id = ?
      `;
      
      const [ingredients] = await pool.query(query, [dishId]);
      
      return res.status(200).json({
        dish: dishDetails[0],
        ingredients: ingredients,
        total_ingredients: ingredients.length
      });
    } catch (error) {
      console.error("Error fetching dish ingredients:", error);
      return res.status(500).json({
         error: "Failed to retrieve dish ingredients",
         details: error.message
       });
    }
  }

  static async getDishesByCategory(req, res) {
    try {
      const { category } = req.body;
      const validCategories = ['breakfast', 'lunch', 'dinner', 'snack'];
      
      if (!category || !validCategories.includes(category.toLowerCase())) {
        return res.status(400).json({
           error: "Invalid category",
           validCategories: validCategories
         });
      }
      
      // Get all dishes in the category
      const dishesQuery = `
        SELECT 
          id,
          name,
          description,
          image_url,
          image_url_2,
          category
        FROM dishes
        WHERE LOWER(category) = ?
      `;
      
      const [dishes] = await pool.query(dishesQuery, [category.toLowerCase()]);
      
      // For each dish, get its ingredients
      const dishesWithIngredients = await Promise.all(dishes.map(async (dish) => {
        const ingredientsQuery = `
          SELECT 
            i.id,
            i.name,
            i.type,
            i.price_per_unit,
            di.quantity,
            i.unit
          FROM dish_ingredients di
          JOIN items i ON di.item_id = i.id
          WHERE di.dish_id = ?
        `;
        
        const [ingredients] = await pool.query(ingredientsQuery, [dish.id]);
        
        return {
          ...dish,
          ingredients: ingredients,
          total_ingredients: ingredients.length
        };
      }));
      
      return res.status(200).json({
        category: category,
        dishes: dishesWithIngredients,
        total_dishes: dishes.length
      });
    } catch (error) {
      console.error("Error fetching dishes with ingredients:", error);
      return res.status(500).json({
         error: "Failed to retrieve dishes with ingredients",
         details: error.message
       });
    }
  }
}

module.exports = DishIngredientsController;