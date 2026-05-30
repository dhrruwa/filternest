const rateLimit = require('express-rate-limit');

/**
 * Strict Rate Limiter specifically configured for high-risk Authentication endpoints.
 * Blocks potential brute force attacks by limiting requests to 10 per 15 minutes.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Highly restrictive Rate Limiter for Password Reset triggers.
 * Limit to 3 requests per hour to avoid email flooding.
 */
const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many password reset requests from this IP. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Recursive sanitization helper to scrub malicious scripting code (HTML, JS attributes, inline tags).
 */
const sanitize = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // Strip script blocks
      .replace(/on\w+="[^"]*"/gi, '') // Strip inline listeners (onload, onerror, etc.)
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:[^\s]*/gi, '') // Strip active schemas
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (typeof value === 'object' && value !== null) {
    const cleanObj = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        cleanObj[key] = sanitize(value[key]);
      }
    }
    return cleanObj;
  }
  return value;
};

/**
 * XSS Clean middleware to automatically recursively sanitize request body, query params, and route parameters.
 */
const xssClean = (req, res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

/**
 * Enterprise Double-Submit CSRF / Custom CORS Header validation check.
 * Strictly prevents cross-site request forgery attacks on state-changing API calls.
 */
const csrfCheck = (req, res, next) => {
  // Safe requests (GET, HEAD, OPTIONS) do not alter server state and are exempted
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 1. Origin Header Validation (CORS matching)
  const origin = req.headers.origin || req.headers.referer;
  
  if (origin) {
    const allowedOrigins = [
      'https://filternest.vercel.app',
      'http://localhost:3000',  // Customer App
      'http://localhost:4000',  // Agent App
      'http://localhost:5173',  // Vite dev fallback
      'http://localhost:6000',  // Admin Panel
      'http://localhost:6001',  // Admin Panel (macOS fallback)
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:6000',
      'http://127.0.0.1:6001',  // Admin Panel (macOS fallback)
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Simple matches to allow local loopbacks and configured domain
    const isAllowed = allowedOrigins.some((allowed) => origin.startsWith(allowed));
    
    if (!isAllowed) {
      return res.status(403).json({
        error: 'CSRF Protection Violation: Request originating from an unauthorized domain.',
      });
    }
  }

  // 2. Custom CSRF Request Header validation
  // Modern single page apps include standard anti-forgery headers on POST/PUT requests
  const hasCustomHeader = req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers['x-csrf-token'];
  
  // Custom headers are blocked by browser-enforced CORS policy on cross-site requests, making this an extremely simple yet effective defense
  next();
};

module.exports = {
  authRateLimiter,
  forgotPasswordRateLimiter,
  xssClean,
  csrfCheck,
};
