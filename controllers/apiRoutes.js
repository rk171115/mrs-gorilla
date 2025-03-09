const { pool } = require('../db_conn'); // Adjust the path to your database connection

class ApiController {
  // Method to search for items by name with enhanced flexible matching
  static async searchItem(req, res) {
    try {
      const { name } = req.body;
      
      // Return all items if search is empty
      if (!name || name.trim() === '') {
        const query = `SELECT name, image_url, image_url_2, price_per_unit FROM items`;
        const [items] = await pool.query(query);
        
        return res.status(200).json({
          success: true,
          count: items.length,
          data: items
        });
      }
      
      // For more comprehensive search:
      // 1. Split search term into words
      // 2. Create a query that can match any of the words in any position
      const searchTerms = name.trim().split(/\s+/);
      
      // Define synonyms and alternative names for all items in your database
      const synonyms = {
        // Vegetables
        'aloo': ['potato', 'batata', 'aaloo', 'alu'],
        'pyaaz': ['onion', 'pyaz', 'piyaz'],
        'tamatar': ['tomato', 'timatar', 'tamater'],
        'mirch': ['chilli', 'chili', 'pepper', 'mirchi', 'chillies', 'chillis'],
        'shimla mirch': ['capsicum', 'bell pepper', 'sweet pepper'],
        'bhindi': ['okra', 'ladies finger', 'lady finger'],
        'karela': ['bitter gourd', 'bitter melon'],
        'lauki': ['bottle gourd', 'doodhi', 'ghiya'],
        'patta gobhi': ['cabbage'],
        'full gobhi': ['cauliflower', 'phool gobhi'],
        'baigan': ['eggplant', 'aubergine', 'brinjal'],
        'carrot': ['gajar'],
        'peas': ['matar', 'mutter'],
        'brocolli': ['broccoli'],
        
        // Herbs & Spices
        'adrak': ['ginger'],
        'lasun': ['garlic', 'lehsun'],
        'dhaniya': ['coriander', 'cilantro'],
        
        // Fruits
        'mango': ['aam'],
        'banana': ['kela', 'keyla'],
        'apple': ['seb'],
        'guava': ['amrood'],
        'orange': ['santra', 'narangi'],
        'pomegranate': ['anar'],
        'papaya': ['papita'],
        'grapes': ['angoor'],
        'watermelon': ['tarbooz'],
        'pineapple': ['ananas'],
        'strawberry': ['strawberries'],
        
        // Dairy & Other
        'paneer': ['cottage cheese', 'indian cheese'],
        'mushroom': ['mushrooms', 'khumbi']
      };
      
      // Expand search terms with their synonyms
      let expandedTerms = [...searchTerms];
      
      // Add synonyms to the search
      searchTerms.forEach(term => {
        const normalizedTerm = term.toLowerCase();
        
        // Check if the term has synonyms (exact match)
        Object.entries(synonyms).forEach(([key, values]) => {
          if (key.toLowerCase() === normalizedTerm || values.includes(normalizedTerm)) {
            // Add the key
            expandedTerms.push(key);
            // Add all its values
            expandedTerms = expandedTerms.concat(values);
          }
          
          // Check for partial matches
          if (key.toLowerCase().includes(normalizedTerm) || 
              values.some(val => val.toLowerCase().includes(normalizedTerm))) {
            expandedTerms.push(key);
            expandedTerms = expandedTerms.concat(values);
          }
          
          // Handle plurals and similar word endings (like "chillis" -> "chilli")
          if (normalizedTerm.length > 3) {
            // Try removing last 1-3 characters to catch variations
            const baseForm = normalizedTerm.substring(0, normalizedTerm.length - 1);
            const baseForm2 = normalizedTerm.substring(0, normalizedTerm.length - 2);
            const baseForm3 = normalizedTerm.substring(0, normalizedTerm.length - 3);
            
            if (key.toLowerCase().startsWith(baseForm) || 
                values.some(val => val.toLowerCase().startsWith(baseForm))) {
              expandedTerms.push(key);
              expandedTerms = expandedTerms.concat(values);
            }
            else if (normalizedTerm.length > 4 && (
                     key.toLowerCase().startsWith(baseForm2) || 
                     values.some(val => val.toLowerCase().startsWith(baseForm2)))) {
              expandedTerms.push(key);
              expandedTerms = expandedTerms.concat(values);
            }
            else if (normalizedTerm.length > 5 && (
                     key.toLowerCase().startsWith(baseForm3) || 
                     values.some(val => val.toLowerCase().startsWith(baseForm3)))) {
              expandedTerms.push(key);
              expandedTerms = expandedTerms.concat(values);
            }
          }
        });
      });
      
      // Remove duplicates
      expandedTerms = [...new Set(expandedTerms)];
      
      // Build a complex WHERE clause to match any word in any position
      let whereClause = '';
      const queryParams = [];
      
      expandedTerms.forEach((term, index) => {
        // Add OR condition between terms
        if (index > 0) {
          whereClause += ' OR ';
        }
        
        // 1. Exact match anywhere
        whereClause += 'name LIKE ?';
        queryParams.push(`%${term}%`);
      });
      
      const query = `SELECT DISTINCT name, image_url, image_url_2, price_per_unit FROM items WHERE ${whereClause}`;
      const [items] = await pool.query(query, queryParams);
      
      if (items.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No items found matching '${name}'`,
          data: []
        });
      }
      
      return res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
      
    } catch (error) {
      console.error('Error executing search query:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred',
        details: error.message
      });
    }
  }
}

module.exports = ApiController;