const Basket = require('../models/Baskets/basket');

class BasketController {
  static async createBasket(req, res) {
    try {
      const { user_id, basket_name, icon_image, weekday, items } = req.body;
      
      // Validation
      if (!user_id || !basket_name || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data. Make sure to provide user_id, basket_name, and items array.'
        });
      }
      
      // Validate items format
      for (const item of items) {
        if (!item.item_id || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have item_id and a positive quantity.'
          });
        }
      }
      
      const result = await Basket.createBasket({
        user_id,
        basket_name,
        icon_image,
        weekday,
        items
      });
      
      return res.status(201).json(result);
    } catch (error) {
      console.error('Error creating basket:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create basket',
        error: error.message
      });
    }
  }
  
  static async getUserBaskets(req, res) {
    try {
      const user_id = req.params.user_id;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      const baskets = await Basket.getUserBaskets(user_id);
      
      // If no baskets exist, return a default basket
      // if (baskets.length === 0) {
      //   const defaultBasket = {
      //     basket_id: 0,
      //     basket_name: "Good Morning basket",
      //     icon_image: "default_basket_icon.png",
      //     weekday: "everyday",
      //     items: [
      //       { item_name: "Onion", quantity: 1, unit: "Kg", price_per_unit: 20 },
      //       { item_name: "Cauliflower", quantity: 2, unit: "Kg", price_per_unit: 30 },
      //       { item_name: "Brinjal", quantity: 1, unit: "Kg", price_per_unit: 25 },
      //       { item_name: "Carrot", quantity: 2, unit: "Kg", price_per_unit: 25 },
      //       { item_name: "Bottle gourd", quantity: 1, unit: "Kg", price_per_unit: 30 }
      //     ]
      //   };
        
      //   return res.status(200).json({
      //     success: true,
      //     baskets: [defaultBasket],
      //     isDefaultBasket: true
      //   });
      // }
      
      // Format response to match the UI with additional details
      const formattedBaskets = await Promise.all(baskets.map(async basket => {
        const basketDetails = await Basket.getBasketDetails(user_id, basket.basket_name);
        return {
          basket_id: basket.basket_id,
          basket_name: basket.basket_name,
          icon_image: basket.icon_image,
          weekday: basket.weekday,
          items: basketDetails.map(item => ({
            item_name: item.item_name,
            quantity: item.quantity,
            unit: item.unit,
            price_per_unit: item.price
          }))
        };
      }));
      
      return res.status(200).json({
        success: true,
        baskets: formattedBaskets,
        isDefaultBasket: false
      });
    } catch (error) {
      console.error('Error getting user baskets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user baskets',
        error: error.message
      });
    }
  }
  
  static async getBasketDetails(req, res) {
    try {
      const { user_id, basket_name } = req.params;
      
      if (!user_id || !basket_name) {
        return res.status(400).json({
          success: false,
          message: 'User ID and basket name are required'
        });
      }
      
      const basketItems = await Basket.getBasketDetails(user_id, basket_name);
      
      if (basketItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Basket not found'
        });
      }
      
      // Format response 
      const formattedResponse = {
        basket_id: basketItems[0].basket_id,
        basket_name: basketItems[0].basket_name,
        icon_image: basketItems[0].icon_image,
        weekday: basketItems[0].weekday,
        items: basketItems.map(item => ({
          detail_id: item.detail_id,
          item_id: item.item_id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          price_per_unit: item.price,
          item_image: item.item_image
        }))
      };
      
      return res.status(200).json({
        success: true,
        basket: formattedResponse
      });
    } catch (error) {
      console.error('Error getting basket details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get basket details',
        error: error.message
      });
    }
  }
  
  static async updateBasketItem(req, res) {
    try {
      const { detail_id, quantity } = req.body;
      
      if (!detail_id || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Detail ID and a positive quantity are required'
        });
      }
      
      const result = await Basket.updateBasketItem(detail_id, quantity);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error updating basket item:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update basket item',
        error: error.message
      });
    }
  }
  
  static async deleteBasketItem(req, res) {
    try {
      const { detail_id } = req.params;
      
      if (!detail_id) {
        return res.status(400).json({
          success: false,
          message: 'Detail ID is required'
        });
      }
      
      const result = await Basket.deleteBasketItem(detail_id);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error deleting basket item:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete basket item',
        error: error.message
      });
    }
  }
  
  static async deleteBasket(req, res) {
    try {
      const { user_id, basket_name } = req.params;
      
      if (!user_id || !basket_name) {
        return res.status(400).json({
          success: false,
          message: 'User ID and basket name are required'
        });
      }
      
      const result = await Basket.deleteBasket(user_id, basket_name);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error deleting basket:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete basket',
        error: error.message
      });
    }
  }
}

module.exports = BasketController;