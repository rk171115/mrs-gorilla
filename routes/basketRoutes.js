// routes/basketRoutes.js
const express = require('express');
const router = express.Router();
const BasketController = require('../controllers/basketController');

// Create a new basket
router.post('/baskets', BasketController.createBasket);

// Get all baskets for a user
router.get('/baskets/user/:user_id', BasketController.getUserBaskets);

// Get details of a specific basket
router.get('/baskets/user/:user_id/basket/:basket_name', BasketController.getBasketDetails);

// Update a basket item
router.put('/baskets/item', BasketController.updateBasketItem);

// Delete a basket item
router.delete('/baskets/item/:detail_id', BasketController.deleteBasketItem);

// Delete an entire basket
router.delete('/baskets/user/:user_id/basket/:basket_name', BasketController.deleteBasket);

module.exports = router;