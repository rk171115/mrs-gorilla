const { pool } = require('../../db_conn');

class OrderBasket {
  static async orderBasket(orderData) {
    const { user_id, basket_name } = orderData;
    try {
      // Begin transaction
      await pool.query('START TRANSACTION');
      
      // Get basket items directly from baskets table
      const basketItemsQuery = `
        SELECT 
          b.basket_id,
          b.item_id,
          b.quantity,
          i.price_per_unit,
          i.name as item_name
        FROM baskets b
        JOIN items i ON b.item_id = i.id
        WHERE b.user_id = ? AND b.basket_name = ?
      `;
      const [basketItems] = await pool.query(basketItemsQuery, [user_id, basket_name]);
      
      if (basketItems.length === 0) {
        await pool.query('ROLLBACK');
        return {
          success: false,
          message: 'Basket not found or is empty'
        };
      }
      
      // Get a reference basket_id (all items share the same basket_name)
      const basket_id = basketItems[0].basket_id;
      
      // Calculate total price from items
      const total_price = basketItems.reduce((sum, item) => {
        return sum + (item.price_per_unit * item.quantity);
      }, 0);
      
      // Create order in booking_order table
      const orderQuery = `
        INSERT INTO booking_order
        (user_id, booking_type, total_price, created_at, updated_at, basket_id)
        VALUES (?, 'basket', ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), ?)
      `;
      const [orderResult] = await pool.query(orderQuery, [
        user_id,
        total_price,
        basket_id
      ]);
      
      const order_id = orderResult.insertId;
      
      // Commit transaction
      await pool.query('COMMIT');
      
      return {
        success: true,
        message: "Order successfully created",
        order_id,
        total_price,
        items: basketItems.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          price: item.price_per_unit,
          item_name: item.item_name
        }))
      };
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      throw error;
    }
  }

  static async getBasketOrderHistory(user_id) {
    const query = `
      SELECT
        bo.id as order_id,
        bo.total_price,
        bo.created_at,
        bo.basket_id,
        b.basket_name,
        GROUP_CONCAT(DISTINCT i.name SEPARATOR ', ') as items_list
      FROM booking_order bo
      JOIN baskets b ON bo.basket_id = b.basket_id
      JOIN items i ON b.item_id = i.id
      WHERE bo.user_id = ? AND bo.booking_type = 'basket'
      GROUP BY bo.id
      ORDER BY bo.created_at DESC
    `;
    const [rows] = await pool.query(query, [user_id]);
    return rows;
  }

  static async getBasketOrderDetails(order_id, user_id) {
    const query = `
      SELECT
        bo.id as order_id,
        bo.total_price,
        bo.created_at,
        bo.basket_id,
        b.basket_name,
        b.item_id,
        b.quantity,
        i.price_per_unit as price,
        i.name as item_name,
        i.image_url as item_image
      FROM booking_order bo
      JOIN baskets b ON bo.basket_id = b.basket_id
      JOIN items i ON b.item_id = i.id
      WHERE bo.id = ? AND bo.user_id = ? AND bo.booking_type = 'basket'
    `;
    const [rows] = await pool.query(query, [order_id, user_id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    // Format the response
    const orderDetails = {
      order_id: rows[0].order_id,
      total_price: rows[0].total_price,
      created_at: rows[0].created_at,
      basket_id: rows[0].basket_id,
      basket_name: rows[0].basket_name,
      items: rows.map(row => ({
        item_id: row.item_id,
        item_name: row.item_name,
        quantity: row.quantity,
        price: row.price,
        item_image: row.item_image
      }))
    };
    
    return orderDetails;
  }
}

module.exports = OrderBasket;