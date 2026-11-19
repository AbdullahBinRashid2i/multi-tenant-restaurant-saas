/**
 * Restaurant SaaS – Main Server Entry Point
 * Phase 1: Backend Core
 *
 * Stack: Node.js, Express, Mongoose, Socket.io, JWT, bcryptjs, Multer
 * Reads: MONGODB_URI, JWT_SECRET, PORT from /backend/.env
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const seedSuperAdmin = require('./scripts/seed');
const errorHandler = require('./middleware/errorHandler');

// ─── Route Imports ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const menuItemRoutes = require('./routes/menuItems');
const orderRoutes = require('./routes/orders');
const storefrontRoutes = require('./routes/storefront');

// ─── App & Server Setup ───────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Make io accessible to route handlers via req.app.get('io')
app.set('io', io);

// ─── Socket.io Event Handlers ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Client joins a restaurant room to receive real-time order updates
  // Used by: Restaurant Admin dashboard, Public storefront, Delivery Rider
  socket.on('joinRestaurant', (restaurantId) => {
    socket.join(`restaurant:${restaurantId}`);
    console.log(`   → Joined room: restaurant:${restaurantId}`);
  });

  // Customer joins a specific order room to track live delivery status
  socket.on('joinOrder', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`   → Joined room: order:${orderId}`);
  });

  // Rider joins their restaurant's rider room (receives READY order notifications)
  socket.on('joinRiderRoom', (restaurantId) => {
    socket.join(`riders:${restaurantId}`);
    console.log(`   → Joined room: riders:${restaurantId}`);
  });

  socket.on('leaveRestaurant', (restaurantId) => {
    socket.leave(`restaurant:${restaurantId}`);
  });

  socket.on('leaveOrder', (orderId) => {
    socket.leave(`order:${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images as static files
// Access via: GET /uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/storefront', storefrontRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant SaaS API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Connect to MongoDB Atlas
  await connectDB();

  // 2. Auto-seed Super Admin if none exists
  await seedSuperAdmin();

  // 3. Start listening
  httpServer.listen(PORT, () => {
    console.log('');
    console.log('🚀 Restaurant SaaS Backend running!');
    console.log(`   Server  : http://localhost:${PORT}`);
    console.log(`   Health  : http://localhost:${PORT}/api/health`);
    console.log(`   Env     : ${process.env.NODE_ENV || 'development'}`);
    console.log('');
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});
