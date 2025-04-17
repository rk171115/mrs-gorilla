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
    origin: "*", // Allow connections from anywhere (you can restrict this)
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "*",
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
const orderRooms = {}; // { bookingId: { vendorId, userId, vendorConnected, clientConnected, lastLocation } }

// Routes for tracking pages
app.get('/vendor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/vendor.html'));
});

// Modified client route to inject userId from URL into the HTML
app.get('/client', (req, res) => {
  // Extract userId from the URL query parameter
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).send('User ID is required. Please use ?userId=X in the URL.');
  }

  // Read the HTML file
  const filePath = path.join(__dirname, 'public/client.html');
  let clientHtml = require('fs').readFileSync(filePath, 'utf8');

  // Find any active orders for this user
  let activeOrderId = null;
  Object.entries(orderRooms).forEach(([orderId, roomInfo]) => {
    if (roomInfo.userId === userId) {
      activeOrderId = orderId;
      console.log(`Found active order ${orderId} for user ${userId} from server memory`);
    }
  });

  // Inject server variables into the HTML
  clientHtml = clientHtml.replace(
    '</head>',
    `
    <script>
      // Server-injected variables
      const SERVER_USER_ID = "${userId}";
      const SERVER_ACTIVE_ORDER_ID = "${activeOrderId || ''}";
      console.log("Using server-injected userId:", SERVER_USER_ID);
      console.log("Using server-injected activeOrderId:", SERVER_ACTIVE_ORDER_ID);
    </script>
    </head>`
  );

  res.send(clientHtml);
});

app.get('/', (req, res) => {
  res.send('Welcome to Real-Time Location Tracking. <br><a href="/vendor">Vendor Dashboard</a> | <a href="/client">Client Dashboard</a>');
});

// API routes for integrating with order request system
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
      clientConnected: false,
      lastLocation: null
    };
    
    console.log(`Tracking room created for order ${orderId}`);
    
    // If vendor is already connected, join them to the room
    if (activeConnections.vendors[vendorId]) {
      activeConnections.vendors[vendorId].join(orderId.toString());
      orderRooms[orderId].vendorConnected = true;
      console.log(`Vendor ${vendorId} automatically joined tracking room for order ${orderId}`);
      
      // Notify vendor that they've been added to a new order room
      activeConnections.vendors[vendorId].emit('order-assigned', {
        orderId,
        userId
      });
    }
    
    // If client is already connected, join them to the room
    if (activeConnections.clients[userId]) {
      activeConnections.clients[userId].join(orderId.toString());
      orderRooms[orderId].clientConnected = true;
      console.log(`Client ${userId} automatically joined tracking room for order ${orderId}`);
      
      // Notify client about the new order
      activeConnections.clients[userId].emit('order-assigned', {
        orderId,
        vendorId
      });
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
    
    // First check in-memory orderRooms for active orders
    const memoryOrders = [];
    Object.entries(orderRooms).forEach(([orderId, roomInfo]) => {
      if (roomInfo.userId === userId) {
        memoryOrders.push({
          booking_id: orderId,
          vendor_id: roomInfo.vendorId,
          from_memory: true
        });
        console.log(`Found order ${orderId} for user ${userId} in server memory`);
      }
    });
    
    // If we found orders in memory, return them
    if (memoryOrders.length > 0) {
      return res.status(200).json({ 
        success: true, 
        orders: memoryOrders,
        source: 'server_memory'
      });
    }
    
    // If no orders in memory, query the database
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
    
    return res.status(200).json({ success: true, orders, source: 'database' });
  } catch (error) {
    console.error('Error fetching client active orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch active orders' });
  }
});

// API to get the current location of a vendor for a specific order
app.get('/api/tracking/location/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Check if order room exists
    if (!orderRooms[orderId]) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order tracking not found' 
      });
    }
    
    // Return the last known location for this order
    if (orderRooms[orderId].lastLocation) {
      return res.status(200).json({ 
        success: true, 
        location: orderRooms[orderId].lastLocation 
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        message: 'No location updates available yet',
        location: null
      });
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch location',
      error: error.message
    });
  }
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log(`New connection established: ${socket.id}`);
  
  // Identify user type and ID
  socket.on('identify', (data) => {
    const { userType, userId } = data;
    
    if (!userType || !userId) {
      socket.emit('error', { message: 'Invalid identification data. Both userType and userId are required.' });
      return;
    }
    
    console.log(`User identified: ${userType} with ID ${userId}`);
    
    if (userType === 'vendor') {
      // Store vendor socket
      activeConnections.vendors[userId] = socket;
      
      // Associate socket ID with vendor ID for easy lookup
      socket.vendorId = userId;
      
      socket.emit('identification-successful', { 
        userType, 
        userId, 
        message: 'You are now identified as a vendor' 
      });
      
      // Check if vendor has any active orders and join rooms
      Object.entries(orderRooms).forEach(([orderId, roomInfo]) => {
        if (roomInfo.vendorId === userId) {
          socket.join(orderId.toString());
          orderRooms[orderId].vendorConnected = true;
          console.log(`Vendor ${userId} automatically joined room for order ${orderId}`);
          
          // Inform vendor they've been connected to this order
          socket.emit('joined-order', { orderId });
        }
      });
    } else if (userType === 'client') {
      // Store client socket
      activeConnections.clients[userId] = socket;
      
      // Associate socket ID with user ID for easy lookup
      socket.userId = userId;
      
      socket.emit('identification-successful', { 
        userType, 
        userId, 
        message: 'You are now identified as a client' 
      });
      
      // Check if client has any active orders and join rooms
      Object.entries(orderRooms).forEach(([orderId, roomInfo]) => {
        if (roomInfo.userId === userId) {
          socket.join(orderId.toString());
          orderRooms[orderId].clientConnected = true;
          console.log(`Client ${userId} automatically joined room for order ${orderId}`);
          
          // Emit order details back to the client
          socket.emit('joined-order', { 
            orderId,
            vendorId: roomInfo.vendorId,
            lastLocation: roomInfo.lastLocation
          });
        }
      });
    } else {
      socket.emit('error', { message: 'Invalid user type. Must be "vendor" or "client".' });
    }
  });
  
  // Handle order acceptance
  socket.on('accept-order', (data) => {
    const { orderId, userId } = data;
    const vendorId = socket.vendorId; // Get vendorId from socket
    
    if (!vendorId) {
      socket.emit('error', { message: 'You must identify yourself as a vendor first' });
      return;
    }
    
    if (!orderId) {
      socket.emit('error', { message: 'Order ID is required' });
      return;
    }
    
    console.log(`Vendor ${vendorId} accepting order ${orderId}`);
    
    // Create or update order room
    if (!orderRooms[orderId]) {
      orderRooms[orderId] = {
        vendorId,
        userId: userId || null,
        vendorConnected: true,
        clientConnected: false,
        lastLocation: null
      };
    } else {
      // Update vendor info
      orderRooms[orderId].vendorId = vendorId;
      orderRooms[orderId].vendorConnected = true;
    }
    
    // Join vendor to order room
    socket.join(orderId.toString());
    console.log(`Vendor ${vendorId} joined room for order ${orderId}`);
    
    // Notify vendor that the operation was successful
    socket.emit('order-accepted', { 
      orderId, 
      message: `Successfully accepted order ${orderId}` 
    });
  });
  
  // Handle location updates
  socket.on('location-update', (data) => {
    const { orderId, latitude, longitude, status } = data;
    const vendorId = socket.vendorId; // Get vendorId from socket
    
    if (!vendorId) {
      socket.emit('error', { message: 'You must identify yourself as a vendor first' });
      return;
    }
    
    if (!orderId || !latitude || !longitude || !status) {
      socket.emit('error', { message: 'OrderId, latitude, longitude, and status are required' });
      return;
    }
    
    // Validate status
    const validStatuses = ['preparing', 'on_the_way', 'nearby', 'arrived'];
    if (!validStatuses.includes(status)) {
      socket.emit('error', { message: 'Status must be one of: preparing, on_the_way, nearby, arrived' });
      return;
    }
    
    // Check if order room exists
    if (!orderRooms[orderId]) {
      socket.emit('error', { message: `Order room ${orderId} not found. Accept the order first.` });
      return;
    }
    
    // Verify vendor is associated with this order
    if (orderRooms[orderId].vendorId !== vendorId) {
      socket.emit('error', { message: 'You are not authorized for this order' });
      return;
    }
    
    // Create location update object
    const locationData = {
      orderId,
      vendorId,
      latitude,
      longitude,
      status,
      timestamp: new Date().toLocaleTimeString()
    };
    
    // Store the last location
    orderRooms[orderId].lastLocation = locationData;
    
    console.log(`Location update for order ${orderId}:`, locationData);
    
    // Broadcast to everyone in the room
    io.to(orderId.toString()).emit('location-update', locationData);
    
    // Send success acknowledgment to vendor
    socket.emit('location-update-received', {
      success: true,
      orderId,
      timestamp: locationData.timestamp
    });
  });
  
  // For backward compatibility with the client.html
  socket.on('join-room', (orderId) => {
    console.log(`Socket ${socket.id} joining room: ${orderId}`);
    socket.join(orderId.toString());
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Connection disconnected: ${socket.id}`);
    
    const vendorId = socket.vendorId;
    const userId = socket.userId;
    
    // Update vendor connection status
    if (vendorId && activeConnections.vendors[vendorId]) {
      delete activeConnections.vendors[vendorId];
      
      // Update connected status in order rooms
      Object.entries(orderRooms).forEach(([orderId, roomInfo]) => {
        if (roomInfo.vendorId === vendorId) {
          orderRooms[orderId].vendorConnected = false;
          console.log(`Vendor ${vendorId} disconnected from order ${orderId}`);
        }
      });
    }
    
    // Update client connection status
    if (userId && activeConnections.clients[userId]) {
      delete activeConnections.clients[userId];
      
      // Update connected status in order rooms
      Object.entries(orderRooms).forEach(([orderId, roomInfo]) => {
        if (roomInfo.userId === userId) {
          orderRooms[orderId].clientConnected = false;
          console.log(`Client ${userId} disconnected from order ${orderId}`);
        }
      });
    }
  });
});

// Start tracking server
const TRACKING_PORT = 3001;
server.listen(TRACKING_PORT, () => {
  console.log(`Tracking server running on port ${TRACKING_PORT}`);
  console.log(`Vendor dashboard: http://localhost:${TRACKING_PORT}/vendor`);
  console.log(`Client dashboard: http://localhost:${TRACKING_PORT}/client?userId=[user-id]`);
});