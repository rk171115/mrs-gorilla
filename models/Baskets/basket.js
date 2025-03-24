const { pool } = require('../../db_conn');

class Basket {
  static async createBasket(basketData) {
    const { user_id, basket_name, icon_image, weekday, items } = basketData;
    
    const connection = await pool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Insert basket
      const [basketResult] = await connection.query(
        'INSERT INTO baskets (user_id, basket_name, icon_image, weekday) VALUES (?, ?, ?, ?)',
        [user_id, basket_name, icon_image, weekday]
      );
      
      const basket_id = basketResult.insertId;
      
      // Insert basket details
      const basketDetailsQueries = items.map(item => 
        connection.query(
          'INSERT INTO basket_details (basket_id, item_id, quantity) VALUES (?, ?, ?)',
          [basket_id, item.item_id, item.quantity]
        )
      );
      
      await Promise.all(basketDetailsQueries);
      
      // Commit transaction
      await connection.commit();
      
      return {
        success: true,
        message: 'Basket created successfully',
        basket_id: basket_id
      };
    } catch (error) {
      // Rollback transaction in case of error
      await connection.rollback();
      console.error('Error creating basket:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getUserBaskets(user_id) {
    const query = `
      SELECT * FROM baskets 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.query(query, [user_id]);
    return rows;
  }

  static async getBasketDetails(user_id, basket_name) {
    const query = `
      SELECT 
        bd.detail_id,
        bd.basket_id,
        b.basket_name,
        b.icon_image,
        b.weekday,
        i.id AS item_id,
        i.name AS item_name,
        bd.quantity,
        i.price_per_unit AS price,
        i.unit,
        i.image_url AS item_image
      FROM baskets b
      JOIN basket_details bd ON b.basket_id = bd.basket_id
      JOIN items i ON bd.item_id = i.id
      WHERE b.user_id = ? AND b.basket_name = ?
    `;
    const [rows] = await pool.query(query, [user_id, basket_name]);
    return rows;
  }

  static async updateBasketItem(detail_id, quantity) {
    const query = `
      UPDATE basket_details 
      SET quantity = ? 
      WHERE detail_id = ?
    `;
    const [result] = await pool.query(query, [quantity, detail_id]);
    
    return {
      success: true,
      message: 'Basket item updated successfully',
      affectedRows: result.affectedRows
    };
  }

  static async deleteBasketItem(detail_id) {
    const query = `
      DELETE FROM basket_details 
      WHERE detail_id = ?
    `;
    const [result] = await pool.query(query, [detail_id]);
    
    return {
      success: true,
      message: 'Basket item deleted successfully',
      affectedRows: result.affectedRows
    };
  }

  static async deleteBasket(user_id, basket_name) {
    const connection = await pool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Delete basket details first due to foreign key constraint
      await connection.query(
        `DELETE bd FROM basket_details bd
         JOIN baskets b ON bd.basket_id = b.basket_id
         WHERE b.user_id = ? AND b.basket_name = ?`,
        [user_id, basket_name]
      );
      
      // Delete basket
      const [result] = await connection.query(
        'DELETE FROM baskets WHERE user_id = ? AND basket_name = ?',
        [user_id, basket_name]
      );
      
      // Commit transaction
      await connection.commit();
      
      return {
        success: true,
        message: 'Basket deleted successfully',
        affectedRows: result.affectedRows
      };
    } catch (error) {
      // Rollback transaction in case of error
      await connection.rollback();
      console.error('Error deleting basket:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Basket;