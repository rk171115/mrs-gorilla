const express = require('express');
const router = express.Router();
const DishNutritionController = require('../controllers/DishNutritionController');

// Get nutrition information for a specific dish
router.post('/dish-nutrition', DishNutritionController.getDishNutrition);

// Get dish details with nutrition information
router.post('/dish-with-nutrition', DishNutritionController.getDishWithNutrition);

module.exports = router;