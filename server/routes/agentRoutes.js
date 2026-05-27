const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Profile & Configuration
router.get('/profile', auth, authorize('agent'), agentController.getProfile);
router.put('/profile', auth, authorize('agent'), agentController.updateProfile);
router.put('/status', auth, authorize('agent'), agentController.updateStatus);
router.put('/location', auth, authorize('agent'), agentController.updateLocation);

// Attendance system
router.post('/attendance/check-in', auth, authorize('agent'), agentController.checkIn);
router.post('/attendance/check-out', auth, authorize('agent'), agentController.checkOut);
router.get('/attendance/heatmap', auth, authorize('agent'), agentController.getAttendanceHeatmap);

// Earnings system
router.get('/earnings', auth, authorize('agent'), agentController.getEarnings);
router.post('/earnings/withdraw', auth, authorize('agent'), agentController.requestWithdrawal);

// Geolocation pings
router.post('/location/ping', auth, authorize('agent'), agentController.logGPSPing);

// Booking lifecycle
router.get('/bookings/assigned', auth, authorize('agent'), agentController.getAssignedBookings);
router.get('/bookings/completed', auth, authorize('agent'), agentController.getCompletedServices);
router.put('/bookings/:bookingId/accept', auth, authorize('agent'), agentController.acceptJob);
router.put('/bookings/:bookingId/reject', auth, authorize('agent'), agentController.rejectJob);
router.put('/bookings/:bookingId/transition', auth, authorize('agent'), agentController.transitionJobStatus);
router.post('/bookings/:bookingId/complete-proof', auth, authorize('agent'), agentController.submitCompletionProof);

// Public/Customer routes
router.get('/:agentId/portfolio', agentController.getAgentPortfolio);

module.exports = router;
