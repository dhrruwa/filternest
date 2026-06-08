require('dotenv').config();
const express = require('express');
const prisma = require('./lib/prisma');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { startMaintenanceReminderScheduler } = require('./services/schedulerService');
const seedDefaultAdmin = require('./utils/seedDefaultAdmin');
const seedTestCustomer = require('./utils/seedTestCustomer');
const { xssClean, csrfCheck } = require('./middleware/securityMiddleware');
const { isAllowedOrigin } = require('./lib/allowedOrigins');
const path = require('path');

const app = express();

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Requests with no Origin header (curl, health checks, same-origin
    // server-to-server) are not browser cross-origin requests -> allow.
    if (!origin) {
      return callback(null, true);
    }
    // Browser cross-origin requests must be on the explicit allow-list.
    // No wildcards / pattern matching (required because credentials: true).
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    // Not allow-listed: don't set CORS headers (so the browser blocks the
    // response) and let the request fall through to csrfCheck, which returns
    // a clean 403 for unauthorized origins instead of a 500.
    return callback(null, false);
  },
  credentials: true,
}));

// Rate limiting (global). A SPA makes many calls per page, so 100/15min is far
// too low for real use. Keep it very lenient in development; reasonable in prod.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cookieParser());

// Body parsers MUST run before xssClean/csrfCheck so req.body is populated
// when those middlewares sanitize/inspect it.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security hardening middlewares (operate on the parsed body)
app.use(xssClean);
app.use(csrfCheck);

// Request logging middleware. Logs method/status/duration only.
// Never logs the request body in production; in development it logs the body
// with sensitive fields redacted so passwords/tokens/OTPs are never exposed.
const SENSITIVE_FIELDS = ['password', 'newPassword', 'currentPassword', 'confirmPassword', 'token', 'refreshToken', 'otp', 'passcode', 'authkey', 'jwt_secret'];
const redact = (value) => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = SENSITIVE_FIELDS.includes(key) ? '[REDACTED]' : redact(value[key]);
    }
    return out;
  }
  return value;
};
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  if (process.env.NODE_ENV === 'development' && req.method !== 'GET' && req.body && Object.keys(req.body).length) {
    console.log('[BODY]', JSON.stringify(redact(req.body)));
  }
  next();
});

// Database connection (Supabase PostgreSQL via Prisma)
prisma.$connect()
  .then(async () => {
    console.log('PostgreSQL (Supabase) connected via Prisma');
    if (process.env.NODE_ENV === 'development') {
      console.log('Database seeding active (development mode)...');
      await seedDefaultAdmin();
      await seedTestCustomer();
    } else {
      console.log('Database seeding bypassed (production/external environment)...');
    }
  })
  .catch(err => console.error('Database connection error:', err));

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
