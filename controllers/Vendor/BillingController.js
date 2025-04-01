// controllers/BillingController.js
const BillingModel = require('../../models/Vendor/Vendorbilling/BillingModel');

class BillingController {
  async createBilling(req, res) {
    try {
      const { vendor_id, user_id, booking_order_id, items, payment_method } = req.body;
      
      if (!vendor_id || !user_id || !booking_order_id || !items || !Array.isArray(items)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields or invalid items format' 
        });
      }
      
      // Calculate total price based on items and quantities
      let total_price = 0;
      const itemsWithPrices = [];
      
      // Process each item
      for (const item of items) {
        if (!item.item_id || !item.quantity || item.quantity <= 0 || !item.price_per_unit) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid item data. Each item must have item_id, a positive quantity, and price_per_unit' 
          });
        }
        
        // Calculate price for this item based on quantity and provided price_per_unit
        const itemPrice = parseFloat(item.price_per_unit) * item.quantity;
        total_price += itemPrice;
        
        // Store item with calculated price
        itemsWithPrices.push({
          ...item,
          price: itemPrice
        });
      }
      
      // Create the billing record
      const billing_id = await BillingModel.createBilling({
        vendor_id,
        user_id,
        booking_order_id,
        total_price,
        payment_method
      });
      
      // Add billing details for each item
      for (const item of itemsWithPrices) {
        await BillingModel.addBillingDetails({
          billing_id,
          item_id: item.item_id,
          quantity: item.quantity,
          price: item.price
        });
      }
      
      // Retrieve the complete billing with details
      const billingWithDetails = await BillingModel.getBillingWithDetails(billing_id);
      
      return res.status(201).json({
        success: true,
        message: 'Billing created successfully',
        data: billingWithDetails
      });
    } catch (error) {
      console.error('Error in createBilling:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  async getBillingById(req, res) {
    try {
      const { id } = req.params;
      
      const billing = await BillingModel.getBillingWithDetails(id);
      
      if (!billing) {
        return res.status(404).json({
          success: false,
          message: 'Billing not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: billing
      });
    } catch (error) {
      console.error('Error in getBillingById:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  async getUserBillings(req, res) {
    try {
      const { user_id } = req.params;
      
      const billings = await BillingModel.getBillingsByUserId(user_id);
      
      return res.status(200).json({
        success: true,
        data: billings
      });
    } catch (error) {
      console.error('Error in getUserBillings:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  async getVendorBillings(req, res) {
    try {
      const { vendor_id } = req.params;
      
      const billings = await BillingModel.getBillingsByVendorId(vendor_id);
      
      return res.status(200).json({
        success: true,
        data: billings
      });
    } catch (error) {
      console.error('Error in getVendorBillings:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  async updatePaymentMethod(req, res) {
    try {
      const { id } = req.params;
      const { payment_method } = req.body;
      
      if (!payment_method || !['cash', 'online', 'pending'].includes(payment_method)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method'
        });
      }
      
      const updated = await BillingModel.updatePaymentMethod(id, payment_method);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Billing not found or not updated'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Payment method updated successfully'
      });
    } catch (error) {
      console.error('Error in updatePaymentMethod:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new BillingController();