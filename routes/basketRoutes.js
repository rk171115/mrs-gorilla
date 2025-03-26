// routes/basketRoutes.js
const express = require('express');
const router = express.Router();
const BasketController = require('../controllers/basketController');
const auth = require('../middleware/auth');

// Create a new basket
router.post('/create',auth, BasketController.createBasket);

// Get all baskets for a user
router.get('/user/:user_id',auth, BasketController.getUserBaskets);

// Get details of a specific basket
router.get('/user/:user_id/basket/:basket_name',auth, BasketController.getBasketDetails);

// Update a basket item
router.put('/item',auth, BasketController.updateBasketItem);

// Delete a basket item
router.delete('/item/:detail_id',auth, BasketController.deleteBasketItem);

// Delete an entire basket
router.delete('/user/:user_id/basket/:basket_name',auth, BasketController.deleteBasket);

module.exports = router;