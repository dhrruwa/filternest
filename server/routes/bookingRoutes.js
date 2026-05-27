const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validateBooking } = require('../middleware/validation');

// Public routes
router.get('/reviews/public', bookingController.getPublicReviews);

// Customer routes
router.post('/', auth, authorize('customer'), validateBooking, bookingController.createBooking);
router.get('/customer', auth, authorize('customer'), bookingController.getCustomerBookings);
router.put('/:bookingId/feedback', auth, authorize('customer'), bookingController.submitFeedback);
router.get('/:bookingId', auth, bookingController.getBookingDetails);
router.put('/:bookingId/cancel', auth, authorize('customer'), bookingController.cancelBooking);

// Agent/Admin routes
router.put('/:bookingId/status', auth, authorize('agent', 'admin'), bookingController.updateBookingStatus);

module.exports = router;
