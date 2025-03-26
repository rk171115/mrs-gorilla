const express = require('express');
const router = express.Router();
const DishNutritionController = require('../controllers/DishNutritionController');

// Get nutrition information for a specific dish
router.post('/nutrition', DishNutritionController.getDishNutrition);

// Get dish details with nutrition information
router.post('/with-nutrition', DishNutritionController.getDishWithNutrition);

module.exports = router;