const rateLimit = require('express-rate-limit');
const { isAllowedOrigin } = require('../lib/allowedOrigins');

/**
 * Strict Rate Limiter specifically configured for high-risk Authentication endpoints.
 * Blocks potential brute force attacks by limiting requests to 10 per 15 minutes.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // A single OTP login is 2 requests (request-otp + verify-otp), and users
  // legitimately retry. 50/15min per IP still blocks brute force.
  max: 50,
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
 * Double-submit CSRF protection for state-changing requests.
 * Enforces BOTH:
 *   1. The Origin/Referer is present AND on the explicit allow-list.
 *   2. A custom anti-forgery header is present (X-Requested-With or X-CSRF-Token).
 * Both are checks a cross-site attacker's <form>/simple request cannot satisfy.
 */
const csrfCheck = (req, res, next) => {
  // Safe requests (GET, HEAD, OPTIONS) do not alter server state and are exempted.
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 1. Origin/Referer must be present on state-changing methods and allow-listed.
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) {
    return res.status(403).json({
      error: 'CSRF Protection Violation: Missing Origin/Referer header on a state-changing request.',
    });
  }
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({
      error: 'CSRF Protection Violation: Request originating from an unauthorized domain.',
    });
  }

  // 2. A custom anti-forgery header must be present. Browsers block these on
  // cross-site simple requests, so their presence proves a same-site XHR/fetch.
  const hasCustomHeader =
    req.headers['x-requested-with'] === 'XMLHttpRequest' || !!req.headers['x-csrf-token'];
  if (!hasCustomHeader) {
    return res.status(403).json({
      error: 'CSRF Protection Violation: Missing required anti-forgery header.',
    });
  }

  next();
};

module.exports = {
  authRateLimiter,
  forgotPasswordRateLimiter,
  xssClean,
  csrfCheck,
};
