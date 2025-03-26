const DishIngredients = require('../models/DishIngredients/dishIngredients');

class DishIngredientsController {
  /**
   * Get ingredients for a dish by dish name
   * @param {Object} req - Request object containing dish name in body
   * @param {Object} res - Response object
   * @returns {Object} JSON response with dish and ingredients data
   */
  static async getDishIngredients(req, res) {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Dish name is required" });
      }
      
      // Get dish details based on name using parameterized query (in model)
      const dishDetails = await DishIngredients.getDishByName(name);
      
      if (!dishDetails) {
        return res.status(404).json({ error: "Dish not found" });
      }
      
      // Get ingredients for the dish using parameterized query (in model)
      const ingredients = await DishIngredients.getIngredientsByDishId(dishDetails.id);
      
      return res.status(200).json({
        dish: dishDetails,
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
  
  /**
   * Get all dishes with ingredients by category
   * @param {Object} req - Request object containing category in body
   * @param {Object} res - Response object
   * @returns {Object} JSON response with dishes and their ingredients
   */
  static async getDishesByCategory(req, res) {
    try {
      const { category } = req.body;
      const validCategories = ['breakfast', 'lunch', 'dinner', 'snack'];
      
      if (!DishIngredients.validateCategory(category)) {
        return res.status(400).json({
          error: "Invalid category",
          validCategories: validCategories
        });
      }
      
      // Get all dishes with ingredients in the category using parameterized queries (in model)
      const dishesWithIngredients = await DishIngredients.getDishesByCategoryWithIngredients(category.toLowerCase());
      
      return res.status(200).json({
        category: category,
        dishes: dishesWithIngredients,
        total_dishes: dishesWithIngredients.length
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