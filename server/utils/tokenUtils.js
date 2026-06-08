const jwt = require('jsonwebtoken');

// Fail fast at startup if the signing secrets are not configured. There are NO
// hardcoded fallbacks — a default secret would let anyone forge valid tokens.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in the environment. ' +
      'Refusing to start with insecure default secrets.'
  );
}

/**
 * Generate highly secure, short-lived stateless Access Token (15 Minutes)
 */
const generateAccessToken = (userId, role, sessionId) => {
  return jwt.sign({ id: userId, role, sessionId }, JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Generate long-lived Refresh Token (7 Days) used to rotate Access Tokens
 */
const generateRefreshToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Kept for backward compatibility
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  verifyToken,
};
