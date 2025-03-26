const { pool } = require('../db_conn');

// Helper method to construct full image URL
const getFullImageUrl = (relativePath) => {
  const BASE_URL = 'http://localhost:8000';
  
  // If no path or path is undefined, return null
  if (!relativePath) return null;
  
  // Ensure relativePath is a string and remove leading slash if present
  const cleanPath = String(relativePath).replace(/^\//, '');
  
  // Return full URL
  return `${BASE_URL}/${cleanPath}`;
};

// Get Featured Items
exports.getFeaturedItems = async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT
      i.name AS item_name,
      i.price_per_unit,
      i.unit,
      COALESCE(i.image_url_2, NULL) AS image_url
      FROM item_promotion ip
      JOIN items i ON ip.item_id = i.id
      WHERE ip.is_featured = 1
    `);
    
    if (items.length === 0) {
      return res.status(404).json({
        message: 'No featured items found',
        data: []
      });
    }
    
    // Format items with full image URLs
    const formattedItems = items.map(item => ({
      ...item,
      image_url: getFullImageUrl(item.image_url)
    }));
    
    res.status(200).json({
      message: 'Featured items retrieved successfully',
      count: formattedItems.length,
      data: formattedItems
    });
  } catch (error) {
    console.error('Error retrieving featured items:', error);
    res.status(500).json({
      message: 'Error retrieving featured items',
      error: error.message
    });
  }
};

// Get Low-Priced Items
exports.getLowPriceItems = async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT
      i.name AS item_name,
      i.old_price_per_unit,
      i.price_per_unit,
      i.unit,
      COALESCE(i.image_url_2, NULL) AS image_url
      FROM item_promotion ip
      JOIN items i ON ip.item_id = i.id
      WHERE ip.lowest_price < 30
    `);
    
    if (items.length === 0) {
      return res.status(404).json({
        message: 'No low-priced items found',
        data: []
      });
    }
    
    // Format items with full image URLs
    const formattedItems = items.map(item => ({
      ...item,
      image_url: getFullImageUrl(item.image_url)
    }));
    
    res.status(200).json({
      message: 'Low-priced items retrieved successfully',
      count: formattedItems.length,
      data: formattedItems
    });
  } catch (error) {
    console.error('Error retrieving low-priced items:', error);
    res.status(500).json({
      message: 'Error retrieving low-priced items',
      error: error.message
    });
  }
};