const prisma = require('../lib/prisma');
const { stripSensitive } = require('../lib/sanitize');
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

    const customer = await prisma.customer.findUnique({ where: { id: req.userId } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const booking = await prisma.booking.create({
      data: {
        bookingId: `BK-${uuidv4().substring(0, 8)}`,
        customerId: req.userId,
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
      },
    });

    // Create notification
    await createNotification(
      req.userId,
      'Customer',
      'booking_confirmed',
      `Your booking for ${serviceType} has been received. Our team will contact you soon.`,
      'Booking Received',
      { relatedBooking: booking.id }
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
    const bookings = await prisma.booking.findMany({
      where: { customerId: req.userId },
      include: {
        assignedAgent: {
          select: { id: true, firstName: true, lastName: true, phone: true, profileImage: true, rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(stripSensitive(bookings));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Booking Details
const getBookingDetails = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: {
        customer: true,
        assignedAgent: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    if (booking.customer.id.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(stripSensitive(booking));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Booking Status (Agent or Admin)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, notes, photos } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization: Must be the assigned agent or admin
    if (req.userRole !== 'admin' && (!booking.assignedAgentId || booking.assignedAgentId.toString() !== req.userId)) {
      return res.status(403).json({ error: 'Unauthorized. You are not assigned to this booking.' });
    }

    const updateData = { status };
    if (notes) updateData.agentNotes = notes;
    if (photos) updateData.photos = photos;

    if (status === 'completed') {
      updateData.completedAt = new Date();
      // Create maintenance schedules
      await createMaintenanceSchedules(booking.id);

      // Check if an invoice is already registered for this booking
      let invoice = await prisma.invoice.findUnique({ where: { bookingId: booking.id } });
      if (!invoice) {
        const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
        const cost = booking.cost || {
          serviceFee: 200,
          partsCost: 0,
          tax: 36,
          totalCost: 236,
        };

        invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            bookingId: booking.id,
            customerId: booking.customerId,
            agentId: booking.assignedAgentId || null,
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
          },
        });

        // Invoice link is owned by Invoice.bookingId (set above); no Booking-side update needed.
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: updateData,
    });

    // Notify customer
    await createNotification(
      updatedBooking.customerId,
      'Customer',
      'status_update',
      `Your service status has been updated to ${status}`,
      `Service Status Updated`,
      { relatedBooking: updatedBooking.id }
    );

    res.json({
      message: 'Booking status updated',
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel Booking
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization: Booking must belong to the logged-in customer OR caller must be admin
    if (booking.customerId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
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

    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify ownership
    if (booking.customerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to review this booking' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Feedback can only be submitted for completed bookings' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        feedback: {
          rating,
          review: review || '',
          submittedAt: new Date(),
        },
      },
    });

    // Update Agent's Average Rating
    if (updatedBooking.assignedAgentId) {
      const agent = await prisma.agent.findUnique({ where: { id: updatedBooking.assignedAgentId } });
      if (agent) {
        // Find all completed bookings with feedback for this agent
        const completedBookings = await prisma.booking.findMany({
          where: {
            assignedAgentId: updatedBooking.assignedAgentId,
            status: 'completed',
            feedback: { not: null },
          },
        });

        const ratedBookings = completedBookings.filter(
          (b) => b.feedback && b.feedback.rating != null
        );

        const totalRatings = ratedBookings.length;
        const totalRatingSum = ratedBookings.reduce((sum, b) => sum + b.feedback.rating, 0);

        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            totalRatings,
            rating: totalRatings > 0 ? parseFloat((totalRatingSum / totalRatings).toFixed(1)) : 0,
          },
        });
      }
    }

    res.json({
      message: 'Feedback submitted successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Public Reviews for Home Page Reviews Board
const getPublicReviews = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        feedback: { not: null },
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        assignedAgent: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const reviews = bookings
      .filter((b) => b.feedback && b.feedback.rating != null)
      .sort((a, b) => {
        const aDate = a.feedback?.submittedAt ? new Date(a.feedback.submittedAt).getTime() : 0;
        const bDate = b.feedback?.submittedAt ? new Date(b.feedback.submittedAt).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 10);

    res.json(stripSensitive(reviews));
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
