const logger = require('../lib/logger');
const prisma = require('../lib/prisma');
const { stripSensitive } = require('../lib/sanitize');

// Get Agent Profile
const getProfile = async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.userId } });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(stripSensitive(agent));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Agent Status
const updateStatus = async (req, res) => {
  try {
    logger.info(`[DEBUG] updateStatus requested for user: ${req.userId}, role: ${req.userRole}, status: ${req.body.status}`);
    const { status } = req.body;

    const existing = await prisma.agent.findUnique({ where: { id: req.userId } });
    if (!existing) {
      logger.info(`[DEBUG] Agent not found for ID: ${req.userId}`);
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = await prisma.agent.update({
      where: { id: req.userId },
      data: { status },
    });

    logger.info(`[DEBUG] Agent updated successfully. New status: ${agent.status}`);
    res.json({
      message: 'Status updated successfully',
      status: agent.status,
    });
  } catch (error) {
    logger.error('[ERROR] updateStatus failed:', error.stack || error);
    res.status(500).json({ error: error.message });
  }
};

// Update Current Location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const agent = await prisma.agent.update({
      where: { id: req.userId },
      data: {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
          updatedAt: new Date(),
        },
      },
    });

    res.json({
      message: 'Location updated successfully',
      location: agent.currentLocation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Assigned Bookings
const getAssignedBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        assignedAgentId: req.userId,
        status: { not: 'completed' },
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true, address: true },
        },
      },
      orderBy: { bookingDate: 'asc' },
    });

    res.json(stripSensitive(bookings));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Completed Services
const getCompletedServices = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        assignedAgentId: req.userId,
        status: 'completed',
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true, address: true },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    res.json(stripSensitive(bookings));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Agent Profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const agent = await prisma.agent.update({
      where: { id: req.userId },
      data: {
        firstName,
        lastName,
        phone,
        address,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      agent: stripSensitive(agent),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Agent Public Portfolio and Reviews
const getAgentPortfolio = async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.params.agentId } });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Find all completed bookings with feedback reviews for this agent
    const completed = await prisma.booking.findMany({
      where: {
        assignedAgentId: req.params.agentId,
        status: 'completed',
        feedback: { not: null },
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const reviews = completed
      .filter(r => r.feedback && r.feedback.rating !== undefined && r.feedback.rating !== null)
      .sort((a, b) => {
        const aDate = a.feedback && a.feedback.submittedAt ? new Date(a.feedback.submittedAt).getTime() : 0;
        const bDate = b.feedback && b.feedback.submittedAt ? new Date(b.feedback.submittedAt).getTime() : 0;
        return bDate - aDate;
      });

    res.json({
      agent: stripSensitive(agent),
      reviews: reviews.map(r => ({
        bookingId: r.bookingId,
        serviceType: r.serviceType,
        feedback: r.feedback,
        customerName: r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : 'Anonymous Customer',
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateStatus,
  updateLocation,
  getAssignedBookings,
  getCompletedServices,
  updateProfile,
  getAgentPortfolio,
};
