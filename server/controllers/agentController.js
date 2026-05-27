const fs = require('fs');
const path = require('path');
const Agent = require('../models/Agent');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const AgentEarnings = require('../models/AgentEarnings');
const GPSLog = require('../models/GPSLog');
const TaskTracking = require('../models/TaskTracking');

// Helper to format date as YYYY-MM-DD in local time
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

// Update Agent Profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const agent = await Agent.findByIdAndUpdate(
      req.userId,
      { firstName, lastName, phone, address },
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

// Update Agent Duty Status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const agent = await Agent.findByIdAndUpdate(
      req.userId,
      { status },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Broadcast status update
    if (req.io) {
      req.io.emit('agent_status_updated', { agentId: req.userId, status });
    }

    res.json({
      message: 'Status updated successfully',
      status: agent.status,
    });
  } catch (error) {
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

// ----------------------------------------------------
// ATTENDANCE SYSTEM CONTROLLERS
// ----------------------------------------------------

const checkIn = async (req, res) => {
  try {
    const today = getTodayDateString();
    
    // Check if check-in already exists for today
    let attendance = await Attendance.findOne({ agent: req.userId, date: today });
    if (attendance) {
      return res.status(400).json({ error: 'Already checked in for today' });
    }

    // Detect late logins (e.g. check-in after 10:00 AM)
    const now = new Date();
    const isLate = now.getHours() >= 10;
    
    const shiftStart = new Date();
    shiftStart.setHours(9, 0, 0, 0); // shift baseline at 9:00 AM
    
    const shiftEnd = new Date();
    shiftEnd.setHours(18, 0, 0, 0); // shift baseline end at 6:00 PM

    attendance = new Attendance({
      agent: req.userId,
      checkIn: now,
      date: today,
      status: isLate ? 'late' : 'present',
      lateLogin: isLate,
      shiftStart,
      shiftEnd,
      activityLogs: [{ action: 'check_in', time: now }]
    });

    await attendance.save();

    // Auto toggle agent status to available
    await Agent.findByIdAndUpdate(req.userId, { status: 'available' });

    if (req.io) {
      req.io.emit('attendance_check_in', { agentId: req.userId, time: now });
    }

    res.status(201).json({
      message: 'Checked in successfully',
      attendance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkOut = async (req, res) => {
  try {
    const today = getTodayDateString();
    const attendance = await Attendance.findOne({ agent: req.userId, date: today });
    
    if (!attendance) {
      return res.status(404).json({ error: 'No check-in record found for today' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already checked out for today' });
    }

    const now = new Date();
    attendance.checkOut = now;
    
    // Calculate total working hours
    const hours = (now.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);
    attendance.workingHours = parseFloat(hours.toFixed(2));
    attendance.activityLogs.push({ action: 'check_out', time: now });

    await attendance.save();

    // Auto toggle agent status to offline
    await Agent.findByIdAndUpdate(req.userId, { status: 'offline' });

    if (req.io) {
      req.io.emit('attendance_check_out', { agentId: req.userId, time: now, workingHours: attendance.workingHours });
    }

    res.json({
      message: 'Checked out successfully',
      attendance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAttendanceHeatmap = async (req, res) => {
  try {
    const records = await Attendance.find({ agent: req.userId })
      .select('date status workingHours')
      .sort({ date: 1 });
    
    // Map records into date -> record dictionary
    const heatmap = {};
    records.forEach(r => {
      heatmap[r.date] = {
        status: r.status,
        workingHours: r.workingHours
      };
    });

    res.json(heatmap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ----------------------------------------------------
// EARNINGS CONTROLLERS
// ----------------------------------------------------

const getEarnings = async (req, res) => {
  try {
    const earnings = await AgentEarnings.find({ agent: req.userId }).sort({ createdAt: -1 });

    let totalEarnings = 0;
    let todayEarnings = 0;
    let weeklyEarnings = 0;
    let monthlyEarnings = 0;
    let incentives = 0;
    let bonusRewards = 0;
    let completedJobsCount = 0;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr = getTodayDateString();

    earnings.forEach(record => {
      const recordDate = new Date(record.createdAt);
      const isToday = recordDate.toDateString() === now.toDateString();

      // Accumulate balance and separate payouts
      if (record.status !== 'cancelled') {
        if (record.amount > 0) {
          totalEarnings += record.amount;
        }

        if (isToday && record.amount > 0) {
          todayEarnings += record.amount;
        }

        if (recordDate >= oneWeekAgo && record.amount > 0) {
          weeklyEarnings += record.amount;
        }

        if (recordDate >= oneMonthAgo && record.amount > 0) {
          monthlyEarnings += record.amount;
        }

        if (record.type === 'incentive') {
          incentives += record.amount;
        }

        if (record.type === 'bonus') {
          bonusRewards += record.amount;
        }

        if (record.type === 'payout') {
          completedJobsCount += 1;
        }
      }
    });

    // Compute virtual current withdrawable balance (total earned - total successfully withdrawn)
    const withdrawals = earnings
      .filter(r => r.type === 'withdrawal' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    const balance = totalEarnings - withdrawals;

    res.json({
      balance: parseFloat(balance.toFixed(2)),
      todayEarnings: parseFloat(todayEarnings.toFixed(2)),
      weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
      monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
      incentives: parseFloat(incentives.toFixed(2)),
      bonusRewards: parseFloat(bonusRewards.toFixed(2)),
      completedJobsCount,
      transactions: earnings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid withdrawal amount' });
    }

    // Check balance
    const earnings = await AgentEarnings.find({ agent: req.userId });
    let totalEarned = 0;
    let totalWithdrawn = 0;

    earnings.forEach(record => {
      if (record.status === 'paid' || record.status === 'pending') {
        if (record.type === 'withdrawal') {
          totalWithdrawn += record.amount;
        } else {
          totalEarned += record.amount;
        }
      }
    });

    const currentBalance = totalEarned - totalWithdrawn;
    if (amount > currentBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const withdrawal = new AgentEarnings({
      agent: req.userId,
      amount,
      type: 'withdrawal',
      description: 'Payout Transfer Completed to Bank Account',
      status: 'paid' // Automatically process immediately for UX
    });

    await withdrawal.save();

    res.status(201).json({
      message: 'Withdrawal completed successfully',
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ----------------------------------------------------
// GPS & GEOLOCATION CONTROLLERS
// ----------------------------------------------------

const logGPSPing = async (req, res) => {
  try {
    const { latitude, longitude, activeBookingId } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and Longitude required' });
    }

    // 1. Log GPS ping history
    const log = new GPSLog({
      agent: req.userId,
      booking: activeBookingId || null,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });
    await log.save();

    // 2. Update agent current coordinates
    await Agent.findByIdAndUpdate(req.userId, {
      'currentLocation.type': 'Point',
      'currentLocation.coordinates': [longitude, latitude],
      'currentLocation.updatedAt': new Date(),
    });

    // 3. Broadcast to Socket rooms (Admin Dashboard and Active Customer tracking rooms)
    if (req.io) {
      req.io.to('admin').emit('agent_location_update', {
        agentId: req.userId,
        coordinates: [longitude, latitude],
        timestamp: new Date()
      });

      if (activeBookingId) {
        req.io.to(`booking_${activeBookingId}`).emit('agent_track_update', {
          bookingId: activeBookingId,
          coordinates: [longitude, latitude]
        });
      }
    }

    res.json({ message: 'GPS coordinates synced successfully', coordinates: [longitude, latitude] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ----------------------------------------------------
// BOOKING ASSIGNMENT & LIFECYCLE CONTROLLERS
// ----------------------------------------------------

// Get Assigned Bookings
const getAssignedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      assignedAgent: req.userId,
      status: { $nin: ['completed', 'cancelled'] },
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

const acceptJob = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.assignedAgent?.toString() !== req.userId) {
      return res.status(403).json({ error: 'This booking is not assigned to you' });
    }
    if (booking.status === 'accepted') {
      return res.status(400).json({ error: 'Job already accepted' });
    }

    booking.status = 'accepted';
    booking.acceptedAt = new Date();
    booking.assignmentExpiresAt = undefined; // Clear expiry timer

    await booking.save();

    // Toggle agent duty status to busy
    await Agent.findByIdAndUpdate(req.userId, { status: 'busy' });

    // Log lifecycle tracking
    const tracking = new TaskTracking({
      booking: booking._id,
      agent: req.userId,
      status: 'accepted'
    });
    await tracking.save();

    if (req.io) {
      req.io.emit('booking_status_updated', { bookingId, status: 'accepted', agentId: req.userId });
    }

    res.json({ message: 'Job accepted successfully', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectJob = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.assignedAgent?.toString() !== req.userId) {
      return res.status(403).json({ error: 'This booking is not assigned to you' });
    }

    // Add rejection reason and reset booking to pending
    booking.rejectedByAgents.push({
      agent: req.userId,
      reason: reason || 'Declined by agent',
      rejectedAt: new Date()
    });

    booking.assignedAgent = undefined;
    booking.status = 'pending';
    booking.assignmentExpiresAt = undefined;

    await booking.save();

    // Restore agent duty status to available
    await Agent.findByIdAndUpdate(req.userId, { status: 'available' });

    // Log lifecycle tracking
    const tracking = new TaskTracking({
      booking: booking._id,
      agent: req.userId,
      status: 'rejected',
      remarks: reason || 'Declined'
    });
    await tracking.save();

    if (req.io) {
      req.io.emit('booking_status_updated', { bookingId, status: 'pending', agentId: null });
      req.io.emit('booking_rejected_notify_admin', { bookingId, agentId: req.userId, reason });
    }

    res.json({ message: 'Job rejected and returned to queue', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const transitionJobStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, latitude, longitude } = req.body;

    const allowedTransitions = ['travelling', 'arrived', 'started'];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({ error: 'Invalid transition status' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.assignedAgent?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to transition this booking' });
    }

    booking.status = status;
    await booking.save();

    // Log lifecycle tracking
    const tracking = new TaskTracking({
      booking: booking._id,
      agent: req.userId,
      status,
      location: latitude && longitude ? {
        type: 'Point',
        coordinates: [longitude, latitude]
      } : undefined
    });
    await tracking.save();

    if (req.io) {
      req.io.emit('booking_status_updated', { bookingId, status, agentId: req.userId });
    }

    res.json({ message: `Successfully transitioned to ${status}`, booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitCompletionProof = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { signature, remarks, purityData } = req.body;

    const booking = await Booking.findOne({ _id: bookingId }).populate('customer');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.assignedAgent?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to complete this service' });
    }

    let signatureUrl = '';

    // Save base64 signature as image on the filesystem
    if (signature && signature.startsWith('data:image')) {
      const base64Data = signature.replace(/^data:image\/\w+;base64,/, '');
      const dataBuffer = Buffer.from(base64Data, 'base64');
      
      const uploadDir = path.join(__dirname, '../public/uploads/signatures');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const fileName = `sig_${bookingId}_${Date.now()}.png`;
      const filePath = path.join(uploadDir, fileName);
      
      fs.writeFileSync(filePath, dataBuffer);
      signatureUrl = `/uploads/signatures/${fileName}`;
    }

    // Set notes as purity certificate details if purityData is passed
    let agentNotes = remarks || '';
    if (purityData) {
      agentNotes = `[PURITY_CERTIFICATE]:${JSON.stringify(purityData)}`;
    }

    const now = new Date();

    // Update booking completion details
    booking.status = 'completed';
    booking.completedAt = now;
    booking.agentNotes = agentNotes;
    booking.completionProof = {
      photos: [],
      signatureUrl,
      remarks: remarks || 'Service Completed Successfully',
      completedAt: now
    };

    await booking.save();

    // 1. Calculate Agent Commission Payout (e.g. 70% of booking cost)
    const bookingCost = booking.cost?.totalCost || 1500; // fallback default
    const payoutAmount = Math.round(bookingCost * 0.7);

    const payout = new AgentEarnings({
      agent: req.userId,
      booking: booking._id,
      amount: payoutAmount,
      type: 'payout',
      description: `Earnings for Service Order: ${booking.bookingId}`,
      status: 'paid'
    });
    await payout.save();

    // 2. Increment Agent completed jobs count and restore status to available
    await Agent.findByIdAndUpdate(req.userId, {
      $inc: { completedJobs: 1 },
      status: 'available'
    });

    // 3. Log task completed in tracking
    const tracking = new TaskTracking({
      booking: booking._id,
      agent: req.userId,
      status: 'completed'
    });
    await tracking.save();

    if (req.io) {
      req.io.emit('booking_status_updated', { bookingId, status: 'completed', agentId: req.userId });
    }

    res.json({ message: 'Service completed and earnings ledger updated', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Public Agent Portfolio get details
const getAgentPortfolio = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

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
  updateProfile,
  updateStatus,
  updateLocation,
  checkIn,
  checkOut,
  getAttendanceHeatmap,
  getEarnings,
  requestWithdrawal,
  logGPSPing,
  getAssignedBookings,
  getCompletedServices,
  acceptJob,
  rejectJob,
  transitionJobStatus,
  submitCompletionProof,
  getAgentPortfolio
};
