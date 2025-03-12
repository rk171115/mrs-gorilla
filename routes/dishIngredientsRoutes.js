const express = require('express');
const router = express.Router();
const DishIngredientsController = require('../controllers/dishIngredientsController');

// Get dish ingredients by dish name
router.post('/ingredients', DishIngredientsController.getDishIngredients);

// Get dishes by category
router.post('/by-category', DishIngredientsController.getDishesByCategory);

module.exports = router;