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
}

module.exports = BookingsController;