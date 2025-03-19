const { pool } = require('../../db_conn');

class DishIngredients {
  // Get dish details by name
  static async getDishByName(name) {
    try {
      const [dishDetails] = await pool.query(
        `SELECT id, name, category, description, image_url, image_url_2 FROM dishes WHERE name = ?`,
        [name]
      );
      return dishDetails.length > 0 ? dishDetails[0] : null;
    } catch (error) {
      console.error('Error getting dish by name:', error);
      throw error;
    }
  }

  // Get ingredients for a specific dish by dish ID
  static async getIngredientsByDishId(dishId) {
    try {
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
      return ingredients;
    } catch (error) {
      console.error('Error getting ingredients by dish ID:', error);
      throw error;
    }
  }

  // Get all dishes by category
  static async getDishesByCategory(category) {
    try {
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
      return dishes;
    } catch (error) {
      console.error('Error getting dishes by category:', error);
      throw error;
    }
  }

  // Get all dishes with their ingredients by category
  static async getDishesByCategoryWithIngredients(category) {
    try {
      const dishes = await this.getDishesByCategory(category);
      const dishesWithIngredients = await Promise.all(dishes.map(async (dish) => {
        const ingredients = await this.getIngredientsByDishId(dish.id);
        return {
          ...dish,
          ingredients: ingredients,
          total_ingredients: ingredients.length
        };
      }));
      return dishesWithIngredients;
    } catch (error) {
      console.error('Error getting dishes with ingredients by category:', error);
      throw error;
    }
  }

  // Validate category name
  static validateCategory(category) {
    const validCategories = ['breakfast', 'lunch', 'dinner', 'snack'];
    return category && validCategories.includes(category.toLowerCase());
  }
}

module.exports = DishIngredients;