const { pool } = require('../../db_conn');

class OrderBasket {
  static async orderBasket(orderData) {
    const { user_id, basket_name } = orderData;
    try {
      // Begin transaction
      await pool.query('START TRANSACTION');

      // Get basket items
      const basketItemsQuery = `
        SELECT 
          b.basket_id,
          bd.item_id,
          i.name as item_name
        FROM baskets b
        JOIN basket_details bd ON b.basket_id = bd.basket_id
        JOIN items i ON bd.item_id = i.id
        WHERE b.user_id = ? AND b.basket_name = ?
      `;
      const [basketItems] = await pool.query(basketItemsQuery, [user_id, basket_name]);

      if (basketItems.length === 0) {
        await pool.query('ROLLBACK');
        return { success: false, message: 'Basket not found or is empty' };
      }

      // Get a reference basket_id (all items share the same basket_name)
      const basket_id = basketItems[0].basket_id;

      // Create order in booking_order table without total_price
      const orderQuery = `
        INSERT INTO booking_order
        (user_id, booking_type, created_at, updated_at, basket_id)
        VALUES (?, 'customized cart', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), ?)
      `;
      const [orderResult] = await pool.query(orderQuery, [user_id, basket_id]);
      const order_id = orderResult.insertId;

      // No longer inserting into booking_details table

      // Commit transaction
      await pool.query('COMMIT');

      return {
        success: true,
        message: "Order successfully created",
        order_id,
        items: basketItems.map(item => ({
          item_id: item.item_id,
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
        bo.created_at,
        bo.basket_id,
        b.basket_name,
        GROUP_CONCAT(DISTINCT i.name SEPARATOR ', ') as items_list
      FROM booking_order bo
      JOIN baskets b ON bo.basket_id = b.basket_id
      JOIN basket_details bd ON b.basket_id = bd.basket_id
      JOIN items i ON bd.item_id = i.id
      WHERE bo.user_id = ? AND bo.booking_type = 'customized cart'
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
        bo.created_at,
        bo.basket_id,
        b.basket_name,
        bd.item_id,
        i.name as item_name,
        i.image_url as item_image
      FROM booking_order bo
      JOIN baskets b ON bo.basket_id = b.basket_id
      JOIN basket_details bd ON b.basket_id = bd.basket_id
      JOIN items i ON bd.item_id = i.id
      WHERE bo.id = ? AND bo.user_id = ? AND bo.booking_type = 'customized cart'
    `;
    const [rows] = await pool.query(query, [order_id, user_id]);

    if (rows.length === 0) {
      return null;
    }

    // Format the response
    return {
      order_id: rows[0].order_id,
      created_at: rows[0].created_at,
      basket_id: rows[0].basket_id,
      basket_name: rows[0].basket_name,
      items: rows.map(row => ({
        item_id: row.item_id,
        item_name: row.item_name,
        item_image: row.item_image
      }))
    };
  }
}

module.exports = OrderBasket;