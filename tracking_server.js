const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const { pool } = require('./db_conn.js'); // Adjust path as needed

// Create a separate Express app for the tracking server
const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8000", // Your main app URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:8000",
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // For parsing application/json

// Store active connections
const activeConnections = {
  vendors: {}, // { vendorId: socket }
  clients: {}  // { userId: socket }
};

// Store room info
const orderRooms = {}; // { bookingId: { vendorId, userId, vendorConnected, clientConnected } }

// Routes for tracking pages
app.get('/vendor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/vendor.html'));
});

app.get('/client', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client.html'));
});

app.get('/', (req, res) => {
  res.send('Welcome to Real-Time Location Tracking. <br><a href="/vendor">Vendor Dashboard</a> | <a href="/client">Client Dashboard</a>');
});

// New API routes for integrating with order request system
app.post('/api/tracking/order-accepted', async (req, res) => {
  try {
    const { orderId, vendorId, userId } = req.body;
    
    if (!orderId || !vendorId || !userId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Store the room info for this order
    orderRooms[orderId] = {
      vendorId,
      userId,
      vendorConnected: false,
      clientConnected: false
    };
    
    console.log(`Tracking room created for order ${orderId}`);
    
    // If vendor is already connected, join them to the room
    if (activeConnections.vendors[vendorId]) {
      activeConnections.vendors[vendorId].join(orderId.toString());
      orderRooms[orderId].vendorConnected = true;
      console.log(`Vendor ${vendorId} automatically joined tracking room for order ${orderId}`);
    }
    
    // If client is already connected, join them to the room
    if (activeConnections.clients[userId]) {
      activeConnections.clients[userId].join(orderId.toString());
      orderRooms[orderId].clientConnected = true;
      console.log(`Client ${userId} automatically joined tracking room for order ${orderId}`);
    }
    
    return res.status(200).json({ success: true, message: 'Tracking room created successfully' });
  } catch (error) {
    console.error('Error creating tracking room:', error);
    return res.status(500).json({ success: false, message: 'Failed to create tracking room' });
  }
});

// API to get vendor's active orders
app.get('/api/tracking/vendor/:vendorId/active-orders', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    // Query the database for active orders (accepted orders)
    const [orders] = await pool.query(`
      SELECT 
        req.id as request_id,
        req.booking_id,
        bo.user_id,
        u.full_name as user_name,
        bo.address
      FROM order_request req
      JOIN booking_order bo ON req.booking_id = bo.id
      JOIN users u ON bo.user_id = u.id
      WHERE req.vendor_id = ? AND req.status = 'accepted'
      ORDER BY req.created_at DESC
    `, [vendorId]);
    
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching vendor active orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch active orders' });
  }
});

// API to get client's active orders
app.get('/api/tracking/client/:userId/active-orders', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Query the database for active orders (accepted orders)
    const [orders] = await pool.query(`
      SELECT 
        req.id as request_id,
        req.booking_id,
        req.vendor_id,
        vd.Name as vendor_name,
        bo.address
      FROM order_request req
      JOIN booking_order bo ON req.booking_id = bo.id
      JOIN vendor_details vd ON req.vendor_id = vd.id
      WHERE bo.user_id = ? AND req.status = 'accepted'
      ORDER BY req.created_at DESC
    `, [userId]);
    
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching client active orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch active orders' });
  }
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Identify user type and ID
  socket.on('identify', (data) => {
    const { userType, userId } = data;
    
    if (userType === 'vendor') {
      activeConnections.vendors[userId] = socket;
      console.log(`Vendor ${userId} identified`);
      
      // Check if vendor has any active orders and join rooms
      Object.entries(orderRooms).forEach(([orderId, roomInfo]) => {
        if (roomInfo.vendorId === userId) {
          socket.join(orderId.toString());
          orderRooms[orderId].vendorConnected = true;
          console.log(`Vendor ${userId} automatically joined room for order ${orderId}`);
        }
      });
    } else if (userType === 'client') {
      activeConnections.clients[userId] = socket;
      console.log(`Client ${userId} identified`);
      
      // Check if client has any active orders and join rooms
      Object.entries(orderRooms).forEach(([orderId, roomInfo]) => {
        if (roomInfo.userId === userId) {
          socket.join(orderId.toString());
          orderRooms[orderId].clientConnected = true;
          console.log(`Client ${userId} automatically joined room for order ${orderId}`);
        }
      });
    }
  });
  
  // Join a specific order room (fallback for manual joining)
  socket.on('join-room', (orderId) => {
    console.log(`${socket.id} joined room: ${orderId}`);
    socket.join(orderId.toString());
  });
  
  // Listen for location updates
  socket.on('location-update', (data) => {
    console.log(`Location update for order ${data.orderId}:`, data);
    // Broadcast to everyone in the room except sender
    socket.to(data.orderId.toString()).emit('location-update', data);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove from active connections
    Object.entries(activeConnections.vendors).forEach(([vendorId, vendorSocket]) => {
      if (vendorSocket.id === socket.id) {
        delete activeConnections.vendors[vendorId];
        // Update connected status in order rooms
        Object.entries(orderRooms).forEach(([orderId, roomInfo]) => {
          if (roomInfo.vendorId === vendorId) {
            orderRooms[orderId].vendorConnected = false;
          }
        });
      }
    });
    
    Object.entries(activeConnections.clients).forEach(([userId, clientSocket]) => {
      if (clientSocket.id === socket.id) {
        delete activeConnections.clients[userId];
        // Update connected status in order rooms
        Object.entries(orderRooms).forEach(([orderId, roomInfo]) => {
          if (roomInfo.userId === userId) {
            orderRooms[orderId].clientConnected = false;
          }
        });
      }
    });
  });
});

// Start tracking server on a different port
const TRACKING_PORT = 3001; // Different from your main app
server.listen(TRACKING_PORT, () => {
  console.log(`Tracking server running on port ${TRACKING_PORT}`);
  console.log(`Vendor dashboard: http://localhost:${TRACKING_PORT}/vendor`);
  console.log(`Client dashboard: http://localhost:${TRACKING_PORT}/client`);
});