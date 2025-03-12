const express = require('express');
const path = require('path');
const cors = require('cors');
const phoneAuthRoutes = require('./routes/phoneAuthRoutes');
const veggieRoutes = require('./routes/veggieroutes');
const dishIngredientsRoutes = require('./routes/dishIngredientsRoutes');
const app = express();
const bookingsRoutes = require('./routes/bookingsRoutes');
const apiRoutes = require('./routes/apiRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dishNutritionRoutes = require('./routes/dishNutritionRoutes');
const addressRoutes = require('./routes/addressRoutes');







app.use(express.static(path.join(__dirname, 'public')));


// ✅ CORS Middleware (Move to Top)
app.use(cors({
    origin: "http://localhost:8000", // Your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
}));

// ✅ Body Parser Middleware (Move to Top)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 



// ✅ Define Routes After Middleware
app.use('/auth', phoneAuthRoutes);
app.use('/api/veggies', veggieRoutes);
app.use('/api/dishes', dishIngredientsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api', apiRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/dish', dishNutritionRoutes);
// Mount address routes
app.use('/api/addresses', addressRoutes);





const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
