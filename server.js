const express = require('express');
const cors = require('cors');
const phoneAuthRoutes = require('./routes/phoneAuthRoutes');
const veggieRoutes = require('./routes/veggieroutes');
const dishIngredientsRoutes = require('./routes/dishIngredientsRoutes');
const app = express();
const bookingsRoutes = require('./routes/bookingsRoutes');
const apiRoutes = require('./routes/apiRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');





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
app.use('/api', veggieRoutes);
app.use('/api/dishes', dishIngredientsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api', apiRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
