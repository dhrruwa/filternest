const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Agent routes
router.get('/profile', auth, authorize('agent'), agentController.getProfile);
router.put('/profile', auth, authorize('agent'), agentController.updateProfile);
router.put('/status', auth, authorize('agent'), agentController.updateStatus);
router.put('/location', auth, authorize('agent'), agentController.updateLocation);
router.get('/bookings/assigned', auth, authorize('agent'), agentController.getAssignedBookings);
router.get('/bookings/completed', auth, authorize('agent'), agentController.getCompletedServices);

// Public/Customer routes
router.get('/:agentId/portfolio', agentController.getAgentPortfolio);

module.exports = router;
