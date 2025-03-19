// models/Baskets/basket.js
const { pool } = require('../../db_conn');

class Basket {
  static async createBasket(userData) {
    const { user_id, basket_name, icon_image, weekday, items } = userData;
    
    try {
      // Begin transaction
      await pool.query('START TRANSACTION');
      
      // Insert basket items
      const insertPromises = items.map(async (item) => {
        const query = `
          INSERT INTO baskets (user_id, basket_name, icon_image, weekday, item_id, quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await pool.query(query, [user_id, basket_name, icon_image || null, weekday || null, item.item_id, item.quantity]);
      });
      
      await Promise.all(insertPromises);
      
      // Commit transaction
      await pool.query('COMMIT');
      return { success: true, message: 'Basket created successfully' };
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      throw error;
    }
  }

  static async getUserBaskets(user_id) {
    const query = `
      SELECT 
        b.basket_name,
        b.icon_image,
        b.weekday,
        GROUP_CONCAT(DISTINCT i.name ORDER BY i.name ASC SEPARATOR ',') as items_list
      FROM baskets b
      JOIN items i ON b.item_id = i.id
      WHERE b.user_id = ?
      GROUP BY b.basket_name, b.icon_image, b.weekday
      ORDER BY b.created_at DESC
    `;
    const [rows] = await pool.query(query, [user_id]);
    return rows;
  }

  static async getBasketDetails(user_id, basket_name) {
    const query = `
      SELECT 
        b.basket_id,
        b.item_id,
        b.quantity,
        b.icon_image,
        b.weekday,
        i.name as item_name,
        i.price,
        i.image as item_image
      FROM baskets b
      JOIN items i ON b.item_id = i.id
      WHERE b.user_id = ? AND b.basket_name = ?
    `;
    const [rows] = await pool.query(query, [user_id, basket_name]);
    return rows;
  }

  static async updateBasketItem(basket_id, quantity) {
    const query = `
      UPDATE baskets
      SET quantity = ?
      WHERE basket_id = ?
    `;
    await pool.query(query, [quantity, basket_id]);
    return { success: true, message: 'Basket item updated successfully' };
  }

  static async deleteBasketItem(basket_id) {
    const query = `
      DELETE FROM baskets
      WHERE basket_id = ?
    `;
    await pool.query(query, [basket_id]);
    return { success: true, message: 'Basket item deleted successfully' };
  }

  static async deleteBasket(user_id, basket_name) {
    const query = `
      DELETE FROM baskets
      WHERE user_id = ? AND basket_name = ?
    `;
    await pool.query(query, [user_id, basket_name]);
    return { success: true, message: 'Basket deleted successfully' };
  }
}

module.exports = Basket;