const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Protected routes
router.get('/profile', auth, authorize('customer'), customerController.getProfile);
router.put('/profile', auth, authorize('customer'), customerController.updateProfile);
router.put('/location', auth, authorize('customer'), customerController.updateLocation);

module.exports = router;
