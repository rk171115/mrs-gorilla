const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');


// Load environment variables
dotenv.config();

const app = express();



const phoneAuthRoutes = require('./routes/phoneAuthRoutes');
const veggieRoutes = require('./routes/veggieroutes');
const bookingsRoutes = require('./routes/bookingsRoutes');
const apiRoutes = require('./routes/apiRoutes');
const addressRoutes = require('./routes/addressRoutes');
const basketRoutes = require('./routes/basketRoutes');
const orderBasketRoutes = require('./routes/orderBasketRoutes');
const userRoutes = require('./routes/userRoutes');
const vendorauthRoutes = require('./routes/vendor/vendorAuthRoutes');
const feeRoutes = require('./routes/feeRoutes');
const ordercartRoutes = require('./routes/ordercartRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const fetchvendorRoutes = require('./routes/vendor/fetchvendorRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const cartRoutes = require('./routes/vendor/cartRoutes');
const orderRequestRoutes = require('./routes/vendor/orderRequestRoutes');
const billingRoutes = require('./routes/vendor/billingRoutes');
const NotificationRoutes = require('./routes/vendor/NotificationRoutes');











// Middleware


// Routes



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
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/items', apiRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/baskets', basketRoutes);
app.use('/api/v1/order', orderBasketRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/vendor', vendorauthRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/book', ordercartRoutes);
app.use('/api/v1/promotion', promotionRoutes);
app.use('/api/v1/fetch', fetchvendorRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/v1/request', orderRequestRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/notification', NotificationRoutes);



const PORT = process.env.PORT || 8000;





// Async function to start server with migration
const startServer = async () => {
  try {
    // Run database migration before starting the server
    // await runMigration();
  
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// module.exports = connection;



// Call the start server function
startServer();