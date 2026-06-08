const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

/**
 * Enterprise Authentication Middleware.
 * Decodes the access token, checks its signature, and verifies session status in the DB
 * to instantly enforce remote logouts and revocations.
 */
const auth = async (req, res, next) => {
  try {
    // Accept the access token ONLY from the Authorization header or the
    // HTTP-only cookie. Never from the query string (it leaks into server
    // logs, browser history, and Referer headers).
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    // Verify Access Token Signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.sessionId = decoded.sessionId;

    // Strict validation: Verify active session exists in DB (allows single/global session revocation)
    if (req.sessionId) {
      const activeSession = await prisma.session.findFirst({
        where: { id: req.sessionId, isActive: true },
      });
      if (!activeSession) {
        return res.status(401).json({ error: 'Session has been terminated or expired. Please login again.' });
      }

      // Update session activity asynchronously to avoid blocking the request
      prisma.session
        .update({ where: { id: req.sessionId }, data: { lastActive: new Date() } })
        .catch((err) => console.error('Failed to update session activity:', err));

      req.session = activeSession;
    } else {
      // Legacy token fallback - in highly secure systems we might reject this,
      // but we allow it gracefully if the user model exists and is active.
      let user;
      if (req.userRole === 'customer') user = await prisma.customer.findUnique({ where: { id: req.userId } });
      else if (req.userRole === 'agent') user = await prisma.agent.findUnique({ where: { id: req.userId } });
      else user = await prisma.admin.findUnique({ where: { id: req.userId } });

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
