const mysql = require('mysql2/promise');
require('dotenv').config();
// const redis = require('redis');

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'veggie_cart',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully.');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};



// // Create Redis client (v4+ uses createClient)
// const client = redis.createClient();

// client.on('error', (err) => console.error('❌ Redis Error:', err));

// (async () => {
//   await client.connect(); // Required in Redis v4+
//   console.log('🚀 Redis Connected');
// })();

// module.exports = client;


module.exports = { pool, testConnection };
