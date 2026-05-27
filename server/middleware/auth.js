const jwt = require('jsonwebtoken');
const Session = require('../models/Session');

/**
 * Enterprise Authentication Middleware.
 * Decodes the access token, checks its signature, and verifies session status in MongoDB
 * to instantly enforce remote logouts and revocations.
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify Access Token Signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.sessionId = decoded.sessionId;

    // Strict validation: Verify active session exists in DB (allows single/global session revocation)
    if (req.sessionId) {
      const activeSession = await Session.findOne({ _id: req.sessionId, isActive: true });
      if (!activeSession) {
        return res.status(401).json({ error: 'Session has been terminated or expired. Please login again.' });
      }

      // Update session activity asynchronously to avoid blocking the request
      Session.updateOne(
        { _id: req.sessionId },
        { $set: { lastActive: new Date() } }
      ).catch((err) => console.error('Failed to update session activity:', err));
      
      req.session = activeSession;
    } else {
      // Legacy token fallback - in highly secure systems we might reject this,
      // but we allow it gracefully if the user model exists and is active.
      const Customer = require('../models/Customer');
      const Agent = require('../models/Agent');
      const Admin = require('../models/Admin');

      let user;
      if (req.userRole === 'customer') user = await Customer.findById(req.userId);
      else if (req.userRole === 'agent') user = await Agent.findById(req.userId);
      else user = await Admin.findById(req.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User account is inactive or not found.' });
      }
    }

    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid or malformed authentication token.' });
  }
};

module.exports = auth;
