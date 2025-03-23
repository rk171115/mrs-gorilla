const express = require('express');
const path = require('path');
const cors = require('cors');
const phoneAuthRoutes = require('./routes/phoneAuthRoutes');
const veggieRoutes = require('./routes/veggieroutes');
const dishIngredientsRoutes = require('./routes/dishIngredientsRoutes');
const app = express();
const bookingsRoutes = require('./routes/bookingsRoutes');
const apiRoutes = require('./routes/apiRoutes');
const dishNutritionRoutes = require('./routes/dishNutritionRoutes');
const addressRoutes = require('./routes/addressRoutes');
const basketRoutes = require('./routes/basketRoutes');
const orderBasketRoutes = require('./routes/orderBasketRoutes');
const userRoutes = require('./routes/userRoutes');
const vendorauthRoutes = require('./routes/vendor/vendorAuthRoutes');
const feeRoutes = require('./routes/feeRoutes');
const ordercartRoutes = require('./routes/ordercartRoutes');




// Use user routes








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
app.use('/api/v1/veggies', veggieRoutes);
app.use('/api/v1/dishes', dishIngredientsRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1', apiRoutes);

app.use('/api/v1/dish', dishNutritionRoutes);
// Mount address routes
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1', basketRoutes);
app.use('/api/v1', orderBasketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/v1/vendor', vendorauthRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/book',ordercartRoutes );







const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
