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
const mongoose = require('mongoose');

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
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Make io accessible to route handlers via req.app.get('io')
app.set('io', io);

// ─── Socket.io Event Handlers ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('joinRestaurant', (restaurantId) => {
    socket.join(`restaurant:${restaurantId}`);
  });

  socket.on('joinOrder', (orderId) => {
    socket.join(`order:${orderId}`);
  });

  socket.on('joinRiderRoom', (restaurantId) => {
    socket.join(`riders:${restaurantId}`);
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
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Allow any origin in production or Vercel preview environments
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images as static files
// Access via: GET /uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Ensure Database Connection Middleware (Critical for Serverless/Vercel) ─
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('❌ Database connection error on incoming request:', error.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MongoDB Atlas IP Access List includes 0.0.0.0/0 (Allow access from anywhere).',
      error: error.message,
    });
  }
});

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
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ─── Server Startup (Local / Standalone Mode) ─────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedSuperAdmin();

  httpServer.listen(PORT, () => {
    console.log('');
    console.log('🚀 Restaurant SaaS Backend running!');
    console.log(`   Server  : http://localhost:${PORT}`);
    console.log(`   Health  : http://localhost:${PORT}/api/health`);
    console.log(`   Env     : ${process.env.NODE_ENV || 'development'}`);
    console.log('');
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });
}

// ─── Export for Vercel Serverless / Multi-Service Runtime ─────────────────
module.exports = app;
module.exports.server = httpServer;
