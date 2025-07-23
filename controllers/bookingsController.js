const { pool } = require('../db_conn');

class BookingsController {
  static async addBooking(req, res) {
    try {
      const { user_id, item_id, quantity, price_per_unit } = req.body;
      
      // Validate input
      if (!user_id || !item_id || !quantity || !price_per_unit) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          required: ["user_id", "item_id", "quantity", "price_per_unit"] 
        });
      }
      
      // Calculate total price
      const total_price = quantity * price_per_unit;
      
      // Insert into bookings table
      const query = `
        INSERT INTO bookings 
        (user_id, item_id, quantity, price_per_unit, total_price) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.query(query, [
        user_id, 
        item_id, 
        quantity, 
        price_per_unit, 
        total_price
      ]);
      
      if (result.affectedRows === 0) {
        return res.status(500).json({ error: "Failed to create booking" });
      }
      
      // Return success with booking ID
      return res.status(201).json({
        message: "Booking created successfully",
        booking_id: result.insertId,
        details: {
          user_id,
          item_id,
          quantity,
          price_per_unit,
          total_price
        }
      });
      
    } catch (error) {
      console.error("Error creating booking:", error);
      
      // Handle foreign key constraint errors
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ 
          error: "Invalid user_id or item_id. Make sure both exist in their respective tables." 
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to create booking", 
        details: error.message 
      });
    }
  }

  static async getUserBookings(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const query = `
        SELECT b.id, b.item_id, i.name as item_name, i.type, i.unit, 
               b.quantity, b.price_per_unit, b.total_price
        FROM bookings b
        JOIN items i ON b.item_id = i.id
        WHERE b.user_id = ?
      `;
      
      const [bookings] = await pool.query(query, [user_id]);
      
      return res.status(200).json({
        user_id: user_id,
        bookings: bookings,
        total_bookings: bookings.length
      });
      
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      return res.status(500).json({ 
        error: "Failed to retrieve bookings", 
        details: error.message 
      });
    }
  }




static getFullImageUrl(relativePath) {
    const BASE_URL = 'http://13.126.169.224';

    // If no path or path is undefined, return null
    if (!relativePath) return null;

    // Ensure relativePath is a string and remove leading slash if present
    const cleanPath = String(relativePath).replace(/^\//, '');

    // Return full URL
    return `${BASE_URL}/${cleanPath}`;
  }


static async getAllBookings(req, res) {
    try {
      // Query to get all bookings with user and item details
      const query = `
        SELECT 
          bo.id as booking_id,
          bo.address,
          bo.total_price,
          bo.booking_type,
          bo.created_at,
          u.full_name as username,
          u.phone_number,
          i.name as item_name,
          bd.quantity,
          bd.price_per_unit,
          i.image_url,
          i.image_url_2,
          i.description,
          i.unit
        FROM booking_order bo
        INNER JOIN users u ON bo.user_id = u.id
        INNER JOIN booking_details bd ON bo.id = bd.booking_id
        INNER JOIN items i ON bd.item_id = i.id
        ORDER BY bo.created_at DESC
      `;

      const [results] = await pool.query(query);

      // Check if any bookings exist
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No bookings found'
        });
      }

      // Group results by booking_id to structure the response
      const bookingsMap = {};
      
      results.forEach(row => {
        if (!bookingsMap[row.booking_id]) {
          bookingsMap[row.booking_id] = {
            booking_id: row.booking_id,
            username: row.username,
            phone_number: row.phone_number,
            address: row.address,
            total_price: parseFloat(row.total_price),
            booking_type: row.booking_type,
            created_at: row.created_at,
            items: []
          };
        }

        // Add item to the booking
        bookingsMap[row.booking_id].items.push({
          name: row.item_name,
          quantity: row.quantity,
          price_per_unit: parseFloat(row.price_per_unit),
          total_price: row.quantity * parseFloat(row.price_per_unit),
          image_url: BookingsController.getFullImageUrl(row.image_url),
          image_url_2: BookingsController.getFullImageUrl(row.image_url_2),
          description: row.description,
          unit: row.unit
        });
      });

      // Convert to array and maintain order (latest first)
      const bookings = Object.values(bookingsMap);

      const response = {
        success: true,
        data: bookings
      };

      res.json(response);

    } catch (error) {
      console.error('Error fetching all bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }




}

module.exports = BookingsController;
