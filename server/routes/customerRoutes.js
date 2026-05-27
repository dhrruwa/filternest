const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Secure customer group routes
router.use(auth);
router.use(authorize('customer'));

// Profile Workspace
router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);
router.put('/location', customerController.updateLocation);

// Core Dashboard Statistics
router.get('/dashboard', customerController.getDashboard);

// Bookings History & Filters
router.get('/bookings', customerController.getBookings);

// Enterprise Invoices & Billing
router.get('/invoices', customerController.getInvoices);
router.get('/invoices/:id/pdf', customerController.getInvoicePDF);

// Transactions & simulated checkout
router.get('/payments', customerController.getPayments);
router.post('/payments/simulate', customerController.simulatePayment);

// In-app Alert Notifications
router.get('/notifications', customerController.getNotifications);
router.put('/notifications/:id/read', customerController.markNotificationRead);
router.delete('/notifications/:id', customerController.deleteNotification);

// Interactive Support ticketing
router.get('/support/tickets', customerController.getSupportTickets);
router.post('/support/tickets', customerController.createSupportTicket);
router.post('/support/tickets/:id/messages', customerController.addSupportTicketMessage);

// Purifier Reminders & Snooze engine
router.get('/reminders', customerController.getReminders);
router.put('/reminders/:id/snooze', customerController.snoozeReminder);
router.put('/reminders/:id/reschedule', customerController.rescheduleReminder);

module.exports = router;
