const express = require('express');
const router = express.Router();
const BasketController = require('../controllers/basketController');
// const auth = require('../middleware/auth');

// Create a new basket
router.post('/create', BasketController.createBasket);

// Get all baskets for a user
router.get('/user/:user_id', BasketController.getUserBaskets);

// Get details of a specific basket
router.get('/user/:user_id/basket/:basket_name', BasketController.getBasketDetails);

// Delete a basket item
router.delete('/item/:detail_id', BasketController.deleteBasketItem);

// Delete an entire basket
router.delete('/user/:user_id/basket/:basket_name', BasketController.deleteBasket);

module.exports = router;