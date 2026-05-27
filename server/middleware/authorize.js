const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: 'You do not have permission to access this resource' });
    }
    next();
  };
};

module.exports = authorize;
