const OrderBasket = require('../models/OrderBaskets/orderBaskets');

class OrderBasketController {
  static async orderBasket(req, res) {
    try {
      const { user_id, basket_name } = req.body;
      
      // Validation
      if (!user_id || !basket_name) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: user_id and basket_name are required'
        });
      }
      
      const result = await OrderBasket.orderBasket({
        user_id,
        basket_name
      });
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      return res.status(201).json(result);
    } catch (error) {
      console.error('Error ordering basket:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to place order',
        error: error.message
      });
    }
  }
  
  static async getBasketOrderHistory(req, res) {
    try {
      const user_id = req.params.user_id;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      const orders = await OrderBasket.getBasketOrderHistory(user_id);
      
      return res.status(200).json({
        success: true,
        orders
      });
    } catch (error) {
      console.error('Error getting order history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get order history',
        error: error.message
      });
    }
  }
  
  static async getBasketOrderDetails(req, res) {
    try {
      const { order_id, user_id } = req.params;
      
      if (!order_id || !user_id) {
        return res.status(400).json({
          success: false,
          message: 'Order ID and User ID are required'
        });
      }
      
      const orderDetails = await OrderBasket.getBasketOrderDetails(order_id, user_id);
      
      if (!orderDetails) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        order: orderDetails
      });
    } catch (error) {
      console.error('Error getting order details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get order details',
        error: error.message
      });
    }
  }
}

module.exports = OrderBasketController;