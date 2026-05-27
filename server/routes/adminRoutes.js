const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Admin routes
router.get('/stats', auth, authorize('admin', 'super_admin'), adminController.getDashboardStats);
router.get('/customers', auth, authorize('admin', 'super_admin'), adminController.getAllCustomers);
router.get('/agents', auth, authorize('admin', 'super_admin'), adminController.getAllAgents);
router.post('/agents', auth, authorize('admin', 'super_admin'), adminController.createAgent);
router.put('/agents/:agentId/approve', auth, authorize('admin', 'super_admin'), adminController.approveAgent);
router.put('/agents/:agentId/reject', auth, authorize('admin', 'super_admin'), adminController.rejectAgent);
router.put('/agents/:agentId/suspend', auth, authorize('admin', 'super_admin'), adminController.suspendAgent);
router.get('/bookings', auth, authorize('admin', 'super_admin'), adminController.getAllBookings);
router.post('/bookings/assign-agent', auth, authorize('admin', 'super_admin'), adminController.assignAgent);
router.post('/bookings/unassign-agent', auth, authorize('admin', 'super_admin'), adminController.unassignAgent);
router.delete('/agents/:agentId', auth, authorize('admin', 'super_admin'), adminController.deleteAgent);
router.get('/reminders/upcoming', auth, authorize('admin', 'super_admin'), adminController.getUpcomingReminders);

// Interactive Email & Avatar KYC Verification Routes
router.post('/send-email-verification', auth, authorize('admin', 'super_admin'), adminController.sendEmailVerification);
router.get('/check-email-verification', auth, authorize('admin', 'super_admin'), adminController.checkEmailVerification);
router.post('/upload-avatar', auth, authorize('admin', 'super_admin'), adminController.uploadAvatar);
router.get('/verify-email', adminController.verifyEmail); // public unauthenticated link clicked by agent

// Aadhaar Mobile OTP KYC Verification Routes
router.post('/send-aadhaar-otp', auth, authorize('admin', 'super_admin'), adminController.sendAadhaarOTP);
router.post('/verify-aadhaar-otp', auth, authorize('admin', 'super_admin'), adminController.verifyAadhaarOTP);

module.exports = router;
