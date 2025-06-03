const { pool } = require('../db_conn'); // Adjust the path to your database connection

class CategoryController {
  // Helper method to construct full image URL
  static getFullImageUrl(relativePath) {
    const BASE_URL = 'http://13.126.169.224';
    
    // If no path or path is undefined, return null
    if (!relativePath) return null;
    
    // Ensure relativePath is a string and remove leading slash if present
    const cleanPath = String(relativePath).replace(/^\//, '');
    
    // Return full URL
    return `${BASE_URL}/${cleanPath}`;
  }

  // Method to fetch items by category with enhanced filtering
  static async getItemsByCategory(req, res) {
    try {
      // Extract category from request body
      const { category } = req.body;

      console.log(category);

      // Define a comprehensive mapping of category groups
      const categoryMappings = {
        'vegetables': ['vegetable', 'herbs', 'staples'],
        'fruits': ['fruit'],
        'herbs': ['herbs'],
        'staples': ['staples'],
        'ingredients': ['ingredient']
      };

      // Validate category input
      const validMainCategories = Object.keys(categoryMappings);
      if (!category || !validMainCategories.includes(category.toLowerCase())) {
        return res.status(400).json({
          error: "Invalid category. Must be one of: " + validMainCategories.join(', '),
          validCategories: validMainCategories
        });
      }

      // Normalize category to lowercase
      const normalizedCategory = category.toLowerCase();

      // Determine which types to fetch based on the category
      const typesToFetch = categoryMappings[normalizedCategory];

      // Query to fetch items by category type(s)
      const query = `SELECT * FROM items WHERE type IN (?)`;
      const [items] = await pool.query(query, [typesToFetch]);

      // Check if any items found
      if (items.length === 0) {
        return res.status(404).json({
          message: `No items found for category: ${category}`,
          data: []
        });
      }

      // Format items with full image URLs
      const formattedItems = items.map(item => ({
        ...item,
        image_url: CategoryController.getFullImageUrl(item.image_url),
        image_url_2: CategoryController.getFullImageUrl(item.image_url_2)
      }));

      // Successful response
      return res.status(200).json({
        message: `Successfully retrieved ${category} items`,
        count: formattedItems.length,
        data: formattedItems
      });
    } catch (error) {
      // Error handling
      console.error(`Error fetching items:`, error);
      return res.status(500).json({
        error: `Failed to retrieve items`,
        details: error.message
      });
    }
  }

  // Enhanced method for filtered items with more robust category handling
  static async getFilteredItems(req, res) {
    try {
      const {
        category,
        sortBy = 'name',
        order = 'ASC',
        minPrice,
        maxPrice
      } = req.body;

      // Define a comprehensive mapping of category groups
      const categoryMappings = {
        'vegetables': ['vegetable', 'herbs', 'staples'],
        'fruits': ['fruit'],
        'herbs': ['herbs'],
        'staples': ['staples'],
        'ingredients': ['ingredient']
      };

      // Validate category input
      const validMainCategories = Object.keys(categoryMappings);
      if (!category || !validMainCategories.includes(category.toLowerCase())) {
        return res.status(400).json({
          error: "Invalid category. Must be one of: " + validMainCategories.join(', '),
          validCategories: validMainCategories
        });
      }

      // Normalize category to lowercase
      const normalizedCategory = category.toLowerCase();

      // Determine which types to fetch based on the category
      const typesToFetch = categoryMappings[normalizedCategory];

      // Build dynamic query with optional filtering
      let query = `SELECT * FROM items WHERE type IN (?)`;
      const queryParams = [typesToFetch];

      // Add price filtering if provided
      if (minPrice && maxPrice) {
        query += ` AND price_per_unit BETWEEN ? AND ?`;
        queryParams.push(parseFloat(minPrice), parseFloat(maxPrice));
      }

      // Add sorting
      query += ` ORDER BY ${sortBy} ${order}`;

      // Execute query
      const [items] = await pool.query(query, queryParams);

      // Format items with full image URLs
      const formattedItems = items.map(item => ({
        ...item,
        image_url: CategoryController.getFullImageUrl(item.image_url),
        image_url_2: CategoryController.getFullImageUrl(item.image_url_2)
      }));

      return res.status(200).json({
        message: `Successfully retrieved filtered ${category} items`,
        count: formattedItems.length,
        data: formattedItems
      });
    } catch (error) {
      console.error(`Error fetching filtered items:`, error);
      return res.status(500).json({
        error: `Failed to retrieve filtered items`,
        details: error.message
      });
    }
  }
}

module.exports = CategoryController;
