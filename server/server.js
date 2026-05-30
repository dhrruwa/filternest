require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { startMaintenanceReminderScheduler } = require('./services/schedulerService');
const seedDefaultAdmin = require('./utils/seedDefaultAdmin');
const seedTestCustomer = require('./utils/seedTestCustomer');
const { xssClean, csrfCheck } = require('./middleware/securityMiddleware');
const path = require('path');

const app = express();

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // In development, allow any localhost origin
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    // In production, check against allowed list
    const allowedOrigins = [
      'http://localhost:3000',  // customer-app
      'http://localhost:4000',  // agent-app
      'http://localhost:6000',  // admin-panel
      'http://localhost:6001',  // admin-panel (macOS fallback)
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:6000',
      'http://127.0.0.1:6001',  // admin-panel (macOS fallback)
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Cookie & Security Hardening Middlewares
app.use(cookieParser());
app.use(xssClean);
app.use(csrfCheck);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[DEBUG] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  if (req.method !== 'GET') {
    console.log('[DEBUG] Body:', JSON.stringify(req.body));
  }
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-filter-service')
  .then(async () => {
    console.log('MongoDB connected');
    await seedDefaultAdmin();
    await seedTestCustomer();
  })
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/agents', require('./routes/agentRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start maintenance reminder scheduler
startMaintenanceReminderScheduler();
console.log('Maintenance reminder scheduler started');

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('All services initialized successfully');
});
