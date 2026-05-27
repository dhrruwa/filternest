const jwt = require('jsonwebtoken');

/**
 * Generate highly secure, short-lived stateless Access Token (15 Minutes)
 */
const generateAccessToken = (userId, role, sessionId) => {
  return jwt.sign(
    { id: userId, role, sessionId },
    process.env.JWT_SECRET || 'filternest_secret_jwt_key_123456789',
    { expiresIn: '15m' }
  );
};

/**
 * Generate long-lived Refresh Token (7 Days) used to rotate Access Tokens
 */
const generateRefreshToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_REFRESH_SECRET || 'filternest_secret_refresh_key_987654321',
    { expiresIn: '7d' }
  );
};

// Kept for backward compatibility
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'filternest_secret_jwt_key_123456789',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'filternest_secret_jwt_key_123456789');
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
