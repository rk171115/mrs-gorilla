const express = require('express');
const cors = require('cors');
const phoneAuthRoutes = require('./routes/phoneAuthRoutes');

const app = express();

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

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
