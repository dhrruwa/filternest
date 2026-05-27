const Agent = require('../models/Agent');
const Booking = require('../models/Booking');

// Get Agent Profile
const getProfile = async (req, res) => {
  try {
    const agent = await Agent.findById(req.userId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Agent Status
const updateStatus = async (req, res) => {
  try {
    console.log(`[DEBUG] updateStatus requested for user: ${req.userId}, role: ${req.userRole}, status: ${req.body.status}`);
    const { status } = req.body;

    const agent = await Agent.findByIdAndUpdate(
      req.userId,
      { status },
      { new: true }
    );

    if (!agent) {
      console.log(`[DEBUG] Agent not found for ID: ${req.userId}`);
      return res.status(404).json({ error: 'Agent not found' });
    }

    console.log(`[DEBUG] Agent updated successfully. New status: ${agent.status}`);
    res.json({
      message: 'Status updated successfully',
      status: agent.status,
    });
  } catch (error) {
    console.error('[ERROR] updateStatus failed:', error.stack || error);
    res.status(500).json({ error: error.message });
  }
};

// Update Current Location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const agent = await Agent.findByIdAndUpdate(
      req.userId,
      {
        'currentLocation.type': 'Point',
        'currentLocation.coordinates': [longitude, latitude],
        'currentLocation.updatedAt': new Date(),
      },
      { new: true }
    );

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
    const bookings = await Booking.find({
      assignedAgent: req.userId,
      status: { $ne: 'completed' },
    })
      .populate('customer', 'firstName lastName phone email address')
      .sort({ bookingDate: 1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Completed Services
const getCompletedServices = async (req, res) => {
  try {
    const bookings = await Booking.find({
      assignedAgent: req.userId,
      status: 'completed',
    })
      .populate('customer', 'firstName lastName phone email address')
      .sort({ completedAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Agent Profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const agent = await Agent.findByIdAndUpdate(
      req.userId,
      {
        firstName,
        lastName,
        phone,
        address,
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      agent: agent.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Agent Public Portfolio and Reviews
const getAgentPortfolio = async (req, res) => {
  try {
    const Agent = require('../models/Agent');
    const Booking = require('../models/Booking');

    const agent = await Agent.findById(req.params.agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Find all completed bookings with feedback reviews for this agent
    const reviews = await Booking.find({
      assignedAgent: req.params.agentId,
      status: 'completed',
      'feedback.rating': { $exists: true },
    })
      .populate('customer', 'firstName lastName')
      .sort({ 'feedback.submittedAt': -1 });

    res.json({
      agent: agent.toJSON(),
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
