// controllers/orderController.js
const { pool } = require('../db_conn');

exports.createOrder = async (req, res) => {
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
    
    // Validate that each item has the required properties
    for (const item of items) {
      if (!item.item_id || !item.quantity || !item.price_per_unit) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have item_id, quantity, and price_per_unit.'
        });
      }
    }
    
    // Calculate total price by multiplying quantity by price_per_unit for each item
    let total_price = 0;
    for (const item of items) {
      total_price += item.quantity * item.price_per_unit;
    }
    
    // Insert into booking_order table first
    const [orderResult] = await conn.query(
      'INSERT INTO booking_order (user_id, booking_type, total_price) VALUES (?, ?, ?)',
      [user_id, 'order', total_price]
    );
    
    const booking_id = orderResult.insertId;
    
    // Insert each item into the booking_details table
    const itemInsertPromises = items.map(item => {
      return conn.query(
        'INSERT INTO booking_details (booking_id, item_id, quantity, price_per_unit) VALUES (?, ?, ?, ?)',
        [booking_id, item.item_id, item.quantity, item.price_per_unit]
      );
    });
    
    await Promise.all(itemInsertPromises);
    
    // Commit the transaction
    await conn.commit();
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        booking_id,
        user_id,
        total_price,
        items_count: items.length
      }
    });
    
  } catch (error) {
    // Rollback in case of error
    if (conn) await conn.rollback();
    
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
    
  } finally {
    // Release the connection
    if (conn) conn.release();
  }
};

// Get order details by booking_id
exports.getOrderById = async (req, res) => {
  let conn;
  
  try {
    conn = await pool.getConnection();
    
    const booking_id = req.params.id;
    
    // Get the order information
    const [orderResult] = await conn.query(
      'SELECT * FROM booking_order WHERE id = ? AND booking_type = ?',
      [booking_id, 'order']
    );
    
    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Get the order details
    const [detailsResult] = await conn.query(
      'SELECT * FROM booking_details WHERE booking_id = ?',
      [booking_id]
    );
    
    // Return the complete order information
    return res.status(200).json({
      success: true,
      data: {
        order: orderResult[0],
        items: detailsResult
      }
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
    
  } finally {
    if (conn) conn.release();
  }
};