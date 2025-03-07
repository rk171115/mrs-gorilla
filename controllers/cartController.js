// controllers/cartController.js
const { pool } = require('../db_conn');

exports.createCart = async (req, res) => {
  let conn;
  
  try {
    conn = await pool.getConnection();
    
    // Start transaction
    await conn.beginTransaction();
    
    // Extract data from request body
    const { user_id, items } = req.body;
    
    console.log('Request body:', req.body); // Add logging to debug
    
    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. User ID and at least one item is required.'
      });
    }
    
    // Calculate initial total price (0 since quantity is unknown at this stage)
    const total_price = 0;
    
    // Insert into booking_order table first
    const [orderResult] = await conn.query(
      'INSERT INTO booking_order (user_id, booking_type, total_price) VALUES (?, ?, ?)',
      [user_id, 'cart', total_price]
    );
    
    const booking_id = orderResult.insertId;
    
    // Insert each item into the booking_details table
    const itemInsertPromises = items.map(item => {
      return conn.query(
        'INSERT INTO booking_details (booking_id, item_id, quantity, price_per_unit) VALUES (?, ?, NULL, ?)',
        [booking_id, item.item_id, item.price_per_unit || 0]
      );
    });
    
    await Promise.all(itemInsertPromises);
    
    // Commit the transaction
    await conn.commit();
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Cart created successfully',
      data: {
        booking_id,
        user_id,
        items_count: items.length
      }
    });
    
  } catch (error) {
    // Rollback in case of error
    if (conn) await conn.rollback();
    
    console.error('Error creating cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create cart',
      error: error.message
    });
    
  } finally {
    // Release the connection
    if (conn) conn.release();
  }
};