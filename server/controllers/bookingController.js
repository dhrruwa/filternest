const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Agent = require('../models/Agent');
const Invoice = require('../models/Invoice');
const { v4: uuidv4 } = require('uuid');
const { createNotification, sendNotification } = require('../services/notificationService');
const { createMaintenanceSchedules } = require('../services/schedulerService');

// Create Booking
const createBooking = async (req, res) => {
  try {
    const {
      serviceType,
      bookingDate,
      preferredTimeSlot,
      address,
      landmark,
      description,
      latitude,
      longitude,
      city,
      state,
      pincode,
    } = req.body;

    const customer = await Customer.findById(req.userId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const booking = new Booking({
      bookingId: `BK-${uuidv4().substring(0, 8)}`,
      customer: req.userId,
      serviceType,
      bookingDate: new Date(bookingDate),
      preferredTimeSlot: {
        start: preferredTimeSlot?.start ? new Date(preferredTimeSlot.start) : null,
        end: preferredTimeSlot?.end ? new Date(preferredTimeSlot.end) : null,
      },
      serviceLocation: {
        type: 'Point',
        coordinates: [longitude, latitude],
        address: {
          street: address,
          city: city || customer.address?.city,
          state: state || customer.address?.state,
          pincode: pincode || customer.address?.pincode,
          country: customer.address?.country || 'India',
          landmark,
        },
      },
      description,
      status: 'pending',
    });

    await booking.save();

    // Create notification
    await createNotification(
      req.userId,
      'Customer',
      'booking_confirmed',
      `Your booking for ${serviceType} has been received. Our team will contact you soon.`,
      'Booking Received',
      { relatedBooking: booking._id }
    );

    res.status(201).json({
      message: 'Booking created successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Customer Bookings
const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.userId })
      .populate('assignedAgent', 'firstName lastName phone profileImage rating')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Booking Details
const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('customer')
      .populate('assignedAgent');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    if (booking.customer._id.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Booking Status (Agent or Admin)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, notes, photos } = req.body;

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization: Must be the assigned agent or admin
    if (req.userRole !== 'admin' && (!booking.assignedAgent || booking.assignedAgent.toString() !== req.userId)) {
      return res.status(403).json({ error: 'Unauthorized. You are not assigned to this booking.' });
    }

    booking.status = status;
    if (notes) booking.agentNotes = notes;
    if (photos) booking.photos = photos;

    if (status === 'completed') {
      booking.completedAt = new Date();
      // Create maintenance schedules
      await createMaintenanceSchedules(booking._id);

      // Check if an invoice is already registered for this booking
      let invoice = await Invoice.findOne({ booking: booking._id });
      if (!invoice) {
        const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
        const cost = booking.cost || {
          serviceFee: 200,
          partsCost: 0,
          tax: 36,
          totalCost: 236,
        };

        invoice = await Invoice.create({
          invoiceNumber,
          booking: booking._id,
          customer: booking.customer,
          agent: booking.assignedAgent || null,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days net
          items: [
            {
              description: `${booking.serviceType.replace(/_/g, ' ').toUpperCase()} service flat fee`,
              quantity: 1,
              unitPrice: cost.serviceFee || 200,
              total: cost.serviceFee || 200,
            }
          ],
          subtotal: cost.serviceFee || 200,
          tax: cost.tax || 36,
          taxPercentage: 18,
          total: cost.totalCost || 236,
          paymentStatus: booking.paymentStatus || 'pending',
          paymentMethod: booking.paymentMethod || undefined,
          paymentDate: booking.paymentStatus === 'completed' ? new Date() : undefined,
        });

        // Link the invoice to the booking
        booking.invoice = invoice._id;
      }
    }

    await booking.save();

    // Notify customer
    await createNotification(
      booking.customer,
      'Customer',
      'status_update',
      `Your service status has been updated to ${status}`,
      `Service Status Updated`,
      { relatedBooking: booking._id }
    );

    res.json({
      message: 'Booking status updated',
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel Booking
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization: Booking must belong to the logged-in customer OR caller must be admin
    if (booking.customer.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit Feedback (Rating & Review)
const submitFeedback = async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify ownership
    if (booking.customer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to review this booking' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Feedback can only be submitted for completed bookings' });
    }

    booking.feedback = {
      rating,
      review: review || '',
      submittedAt: new Date(),
    };

    await booking.save();

    // Update Agent's Average Rating
    if (booking.assignedAgent) {
      const Agent = require('../models/Agent');
      const agent = await Agent.findById(booking.assignedAgent);
      if (agent) {
        // Find all completed bookings with feedback for this agent
        const completedBookings = await Booking.find({
          assignedAgent: booking.assignedAgent,
          status: 'completed',
          'feedback.rating': { $exists: true },
        });

        const totalRatings = completedBookings.length;
        const totalRatingSum = completedBookings.reduce((sum, b) => sum + b.feedback.rating, 0);
        
        agent.totalRatings = totalRatings;
        agent.rating = totalRatings > 0 ? parseFloat((totalRatingSum / totalRatings).toFixed(1)) : 0;
        
        await agent.save();
      }
    }

    res.json({
      message: 'Feedback submitted successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Public Reviews for Home Page Reviews Board
const getPublicReviews = async (req, res) => {
  try {
    const reviews = await Booking.find({
      'feedback.rating': { $exists: true },
    })
      .populate('customer', 'firstName lastName')
      .populate('assignedAgent', 'firstName lastName')
      .sort({ 'feedback.submittedAt': -1 })
      .limit(10);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getCustomerBookings,
  getBookingDetails,
  updateBookingStatus,
  cancelBooking,
  submitFeedback,
  getPublicReviews,
};
