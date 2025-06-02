// controllers/ordercartController.js
const { pool } = require('../db_conn');

exports.createBooking = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    // Start transaction
    await conn.beginTransaction();
    
    // Extract data from request body
    const { user_id, items, booking_type, address } = req.body;
    console.log('Request body:', req.body); // Add logging to debug
    
    // Validate booking type - UPDATED to include new cart types
    if (!booking_type || !['Z customized cart', 'order', 'Z fruit cart', 'Z vegetable cart'].includes(booking_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking type. Must be "Z customized cart", "order", "Z fruit cart", or "Z vegetable cart".'
      });
    }
    
    // Validate basic requirements
    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. User ID and at least one item is required.'
      });
    }
    
    // Validate address (required for all booking types)
    if (!address || address.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Address is required.'
      });
    }
    
    let total_price = 0;
    
    // For order type, validate items and calculate total price
    if (booking_type === 'order') {
      for (const item of items) {
        if (!item.item_id || !item.quantity || !item.price_per_unit) {
          return res.status(400).json({
            success: false,
            message: 'For order type, each item must have item_id, quantity, and price_per_unit.'
          });
        }
        total_price += item.quantity * item.price_per_unit;
      }
    }
    
    // Insert into booking_order table - UPDATED to include address
    const [orderResult] = await conn.query(
      'INSERT INTO booking_order (user_id, booking_type, total_price, address) VALUES (?, ?, ?, ?)',
      [user_id, booking_type, total_price, address.trim()]
    );
    
    const booking_id = orderResult.insertId;
    
    // Insert each item into the booking_details table
    const itemInsertPromises = items.map(item => {
      if (booking_type === 'Z customized cart' || booking_type === 'Z fruit cart' || booking_type === 'Z vegetable cart') {
        // For cart types, quantity is NULL
        return conn.query(
          'INSERT INTO booking_details (booking_id, item_id, quantity, price_per_unit) VALUES (?, ?, NULL, ?)',
          [booking_id, item.item_id, item.price_per_unit || 0]
        );
      } else {
        // For order, include quantity
        return conn.query(
          'INSERT INTO booking_details (booking_id, item_id, quantity, price_per_unit) VALUES (?, ?, ?, ?)',
          [booking_id, item.item_id, item.quantity, item.price_per_unit]
        );
      }
    });
    
    await Promise.all(itemInsertPromises);
    
    // Commit the transaction
    await conn.commit();
    
    // Prepare response data
    const responseData = {
      booking_id,
      user_id,
      booking_type,
      address,
      items_count: items.length
    };
    
    // Include total_price only for orders
    if (booking_type === 'order') {
      responseData.total_price = total_price;
    }
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: `${booking_type.charAt(0).toUpperCase() + booking_type.slice(1)} created successfully`,
      data: responseData
    });
    
  } catch (error) {
    // Rollback in case of error
    if (conn) await conn.rollback();
    console.error(`Error creating ${req.body.booking_type || 'booking'}:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to create ${req.body.booking_type || 'booking'}`,
      error: error.message
    });
  } finally {
    // Release the connection
    if (conn) conn.release();
  }
};

// Combined endpoint for both fruit and vegetable carts
exports.createFruitVegetableCart = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Extract data from request body
    const { user_id, cart_type, address } = req.body;
    
    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.'
      });
    }
    
    if (!cart_type || !['Z fruit cart', 'Z vegetable cart'].includes(cart_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart type. Must be "Z fruit cart" or "Z vegetable cart".'
      });
    }
    
    if (!address || address.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Address is required.'
      });
    }
    
    // Determine the item type to fetch based on cart_type
    const itemType = cart_type === 'Z fruit cart' ? 'fruit' : 'vegetable';
    
    // Fetch items from the database based on type
    const [itemsResult] = await conn.query(
      'SELECT id as item_id, price_per_unit FROM items WHERE type = ?',
      [itemType]
    );
    
    if (itemsResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No ${itemType}s found in the system.`
      });
    }
    
    // Format items for the createBooking function
    const items = itemsResult.map(item => ({
      item_id: item.item_id,
      price_per_unit: item.price_per_unit || 0
    }));
    
    // Set the request body for createBooking
    req.body.booking_type = cart_type;
    req.body.items = items;
    // address is already in req.body
    
    // Call the main createBooking function
    return this.createBooking(req, res);
    
  } catch (error) {
    console.error(`Error creating ${req.body.cart_type || 'cart'}:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to create ${req.body.cart_type || 'cart'}`,
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
};

// Create fruit cart - UPDATED to auto-fetch fruits (keeping for backward compatibility)
exports.createFruitCart = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Extract user_id and address from request body
    const { user_id, address } = req.body;
    
    // Validate user_id
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.'
      });
    }
    
    // Validate address
    if (!address || address.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Address is required.'
      });
    }
    
    // Fetch all fruits from items table
    const [fruitsResult] = await conn.query(
      'SELECT id as item_id, price_per_unit FROM items WHERE type = ?',
      ['fruit']
    );
    
    if (fruitsResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No fruits found in the system.'
      });
    }
    
    // Format items for the createBooking function
    const items = fruitsResult.map(fruit => ({
      item_id: fruit.item_id,
      price_per_unit: fruit.price_per_unit || 0
    }));
    
    // Set the request body for createBooking
    req.body.booking_type = 'Z fruit cart';
    req.body.items = items;
    // address is already in req.body
    
    // Call the main createBooking function
    return this.createBooking(req, res);
    
  } catch (error) {
    console.error('Error creating fruit cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create fruit cart',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
};

// Create vegetable cart - UPDATED to auto-fetch vegetables (keeping for backward compatibility)
exports.createVegetableCart = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Extract user_id and address from request body
    const { user_id, address } = req.body;
    
    // Validate user_id
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.'
      });
    }
    
    // Validate address
    if (!address || address.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Address is required.'
      });
    }
    
    // Fetch all vegetables from items table
    const [vegetablesResult] = await conn.query(
      'SELECT id as item_id, price_per_unit FROM items WHERE type = ?',
      ['vegetable']
    );
    
    if (vegetablesResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No vegetables found in the system.'
      });
    }
    
    // Format items for the createBooking function
    const items = vegetablesResult.map(vegetable => ({
      item_id: vegetable.item_id,
      price_per_unit: vegetable.price_per_unit || 0
    }));
    
    // Set the request body for createBooking
    req.body.booking_type = 'Z vegetable cart';
    req.body.items = items;
    // address is already in req.body
    
    // Call the main createBooking function
    return this.createBooking(req, res);
    
  } catch (error) {
    console.error('Error creating vegetable cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create vegetable cart',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
};

// Get booking details by booking_id
exports.getBookingById = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const booking_id = req.params.id;
    const booking_type = req.query.type;
    
    // Validate booking type if provided - UPDATED to include new cart types
    if (booking_type && !['Z customized cart', 'order', 'Z fruit cart', 'Z vegetable cart'].includes(booking_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking type. Must be "Z customized cart", "order", "Z fruit cart", or "Z vegetable cart".'
      });
    }
    
    // Build the query with optional type filter
    let query = 'SELECT * FROM booking_order WHERE id = ?';
    const queryParams = [booking_id];
    
    if (booking_type) {
      query += ' AND booking_type = ?';
      queryParams.push(booking_type);
    }
    
    // Get the booking information
    const [orderResult] = await conn.query(query, queryParams);
    
    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: booking_type 
          ? `${booking_type.charAt(0).toUpperCase() + booking_type.slice(1)} not found` 
          : 'Booking not found'
      });
    }
    
    // Get the booking details
    const [detailsResult] = await conn.query(
      'SELECT * FROM booking_details WHERE booking_id = ?',
      [booking_id]
    );
    
    // Return the complete booking information
    return res.status(200).json({
      success: true,
      data: {
        booking: orderResult[0],
        items: detailsResult
      }
    });
    
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
};

// Get all bookings by user_id with optional type filter
// Get all bookings by user_id with optional type filter
exports.getBookingsByUserId = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const user_id = req.params.userId;
    const booking_type = req.query.type; // Optional query param to filter by cart/order
    
    // Validate booking type if provided - UPDATED to include new cart types
    if (booking_type && !['Z customized cart', 'order', 'Z fruit cart', 'Z vegetable cart'].includes(booking_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking type. Must be "Z customized cart", "order", "Z fruit cart", or "Z vegetable cart".'
      });
    }
    
    // Build the query with optional type filter
    let query = 'SELECT * FROM booking_order WHERE user_id = ?';
    const queryParams = [user_id];
    
    if (booking_type) {
      query += ' AND booking_type = ?';
      queryParams.push(booking_type);
    }
    
    // Add ordering to get the most recent first
    query += ' ORDER BY created_at DESC';
    
    // Get the bookings
    const [ordersResult] = await conn.query(query, queryParams);
    
    if (ordersResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: booking_type
          ? `No ${booking_type}s found for this user`
          : 'No bookings found for this user'
      });
    }
    
    // Get details for each booking with item images
    const bookingsWithDetails = await Promise.all(
      ordersResult.map(async (booking) => {
        // Updated query to join booking_details with items table to get image_url
const [detailsResult] = await conn.query(`
          SELECT 
            bd.*,
            CASE 
              WHEN i.image_url IS NOT NULL 
              THEN CONCAT('http://13.126.169.224/', i.image_url)
              ELSE NULL
            END as image_url
          FROM booking_details bd
          LEFT JOIN items i ON bd.item_id = i.id
          WHERE bd.booking_id = ?
        `, [booking.id]);
        
        
        return {
          booking,
          items: detailsResult
        };
      })
    );
    
    // Return the complete booking information
    return res.status(200).json({
      success: true,
      count: ordersResult.length,
      data: bookingsWithDetails
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings',
      error: error.message
    });
  } finally {
    if (conn) conn.release();
  }
};
