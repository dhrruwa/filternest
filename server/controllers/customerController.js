const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const { generateInvoicePDF } = require('../utils/invoicePdfGenerator');

// 1. Get Customer Profile
const getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.userId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Update Customer Profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, preferences, alternatePhone, preferredServiceTimings } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.userId,
      {
        firstName,
        lastName,
        phone,
        address,
        preferences,
        alternatePhone,
        preferredServiceTimings,
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      customer: customer.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Update Location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.userId,
      {
        'location.type': 'Point',
        'location.coordinates': [longitude, latitude],
      },
      { new: true }
    );

    res.json({
      message: 'Location updated successfully',
      location: customer.location,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Combined Dashboard Stats & Highlights
const getDashboard = async (req, res) => {
  try {
    const customerId = req.userId;

    // Healing block: Auto-create missing invoices for completed bookings
    const completedWithoutInvoice = await Booking.find({
      customer: customerId,
      status: 'completed',
      $or: [{ invoice: { $exists: false } }, { invoice: null }]
    });

    if (completedWithoutInvoice.length > 0) {
      for (const booking of completedWithoutInvoice) {
        const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
        const cost = booking.cost || {
          serviceFee: 200,
          partsCost: 0,
          tax: 36,
          totalCost: 236,
        };

        const invoice = await Invoice.create({
          invoiceNumber,
          booking: booking._id,
          customer: customerId,
          agent: booking.assignedAgent || null,
          issueDate: booking.completedAt || new Date(),
          dueDate: new Date((booking.completedAt || new Date()).getTime() + 14 * 24 * 60 * 60 * 1000),
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
          paymentDate: booking.paymentStatus === 'completed' ? (booking.completedAt || new Date()) : undefined,
        });

        booking.invoice = invoice._id;
        await booking.save();
      }
    }

    // Fetch baseline models
    const [bookings, invoices, upcomingSchedules, unreadNotifications, activeTickets] = await Promise.all([
      Booking.find({ customer: customerId }),
      Invoice.find({ customer: customerId }),
      MaintenanceSchedule.find({ customer: customerId, status: { $ne: 'completed' } }),
      Notification.find({ recipient: customerId, isRead: false }),
      SupportTicket.find({ customer: customerId, status: { $ne: 'closed' } }),
    ]);

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Aggregate statistics
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
    const completedBookings = bookings.filter(b => b.status === 'completed');
    
    const pendingPaymentsAmount = invoices
      .filter(inv => inv.paymentStatus !== 'completed')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const totalMoneySpent = invoices
      .filter(inv => inv.paymentStatus === 'completed')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Get Next Maintenance Date
    let nextMaintenanceDate = null;
    if (upcomingSchedules.length > 0) {
      const dates = upcomingSchedules
        .map(s => new Date(s.nextServiceDate))
        .filter(d => d >= new Date())
        .sort((a, b) => a - b);
      if (dates.length > 0) {
        nextMaintenanceDate = dates[0];
      }
    }

    // Active Live Tracking (takes the most urgent active booking)
    let activeTracker = null;
    if (activeBookings.length > 0) {
      // Find one that is active or assigned
      const trackedBooking = activeBookings.find(b => ['assigned', 'agent_assigned', 'on_the_way', 'in_progress'].includes(b.status)) || activeBookings[0];
      
      // Populate booking's assignedAgent
      activeTracker = await Booking.findById(trackedBooking._id)
        .populate('assignedAgent')
        .populate('invoice');
    }

    res.json({
      profile: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        membershipStatus: customer.membershipStatus || 'premium',
        purifierDetails: customer.purifierDetails || {
          modelName: 'FilterNest Premium Classic',
          serialNumber: 'FN-RO-8829-X',
          installationDate: new Date(),
          waterHealthScore: 98,
          filterHealthScore: 94,
        },
      },
      stats: {
        totalBookings,
        activeServices: activeBookings.length,
        completedServices: completedBookings.length,
        pendingPayments: pendingPaymentsAmount,
        totalMoneySpent,
        nextMaintenanceDate,
      },
      upcomingService: upcomingSchedules[0] || null,
      activeTracker,
      unreadNotificationCount: unreadNotifications.length,
      activeTicketsCount: activeTickets.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Search, Filter, Paginate Bookings
const getBookings = async (req, res) => {
  try {
    const customerId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const status = req.query.status;
    const search = req.query.search;

    let query = { customer: customerId };

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query.status = { $nin: ['completed', 'cancelled'] };
      } else {
        query.status = status;
      }
    }

    // Apply search filter (service type)
    if (search) {
      query.serviceType = { $regex: search, $options: 'i' };
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('assignedAgent')
      .populate('invoice')
      .sort({ bookingDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      bookings,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Invoice List
const getInvoices = async (req, res) => {
  try {
    const customerId = req.userId;

    // Healing block: Auto-create missing invoices for completed bookings
    const completedWithoutInvoice = await Booking.find({
      customer: customerId,
      status: 'completed',
      $or: [{ invoice: { $exists: false } }, { invoice: null }]
    });

    if (completedWithoutInvoice.length > 0) {
      for (const booking of completedWithoutInvoice) {
        const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
        const cost = booking.cost || {
          serviceFee: 200,
          partsCost: 0,
          tax: 36,
          totalCost: 236,
        };

        const invoice = await Invoice.create({
          invoiceNumber,
          booking: booking._id,
          customer: customerId,
          agent: booking.assignedAgent || null,
          issueDate: booking.completedAt || new Date(),
          dueDate: new Date((booking.completedAt || new Date()).getTime() + 14 * 24 * 60 * 60 * 1000),
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
          paymentDate: booking.paymentStatus === 'completed' ? (booking.completedAt || new Date()) : undefined,
        });

        booking.invoice = invoice._id;
        await booking.save();
      }
    }

    const invoices = await Invoice.find({ customer: customerId })
      .populate({
        path: 'booking',
        populate: { path: 'assignedAgent' },
      })
      .sort({ issueDate: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Dynamic PDF Invoice Streaming
const getInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('agent')
      .populate('booking');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Basic permission check (must be the billing customer)
    if (invoice.customer._id.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);

    // Stream PDF
    generateInvoicePDF(invoice, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Payments Log
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ customer: req.userId })
      .populate('booking')
      .populate('invoice')
      .sort({ paymentDate: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Simulating Checkout / Razorpay / UPI pay
const simulatePayment = async (req, res) => {
  try {
    const { invoiceId, method = 'upi' } = req.body;
    const customerId = req.userId;

    const invoice = await Invoice.findById(invoiceId).populate('booking');
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.customer.toString() !== customerId) {
      return res.status(403).json({ error: 'Unauthorized to pay for this invoice' });
    }

    if (invoice.paymentStatus === 'completed') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    // 1. Create a Payment Document
    const transactionId = `FN-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const payment = await Payment.create({
      transactionId,
      customer: customerId,
      booking: invoice.booking?._id,
      invoice: invoice._id,
      amount: invoice.total,
      method,
      status: 'completed',
      paymentReference: `UPI-REF-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    });

    // 2. Mark Invoice as completed
    invoice.paymentStatus = 'completed';
    invoice.paymentDate = new Date();
    invoice.paymentReference = payment.paymentReference;
    invoice.paymentMethod = method;
    await invoice.save();

    // 3. Mark booking payment status as completed
    if (invoice.booking) {
      const booking = await Booking.findById(invoice.booking._id);
      if (booking) {
        booking.paymentStatus = 'completed';
        booking.paymentMethod = method;
        await booking.save();
      }
    }

    // 4. Create an in-app Alert Notification
    await Notification.create({
      recipient: customerId,
      recipientModel: 'Customer',
      type: 'payment_confirmation',
      title: 'Payment Received Successfully',
      message: `Your payment of INR ${invoice.total.toFixed(2)} for invoice ${invoice.invoiceNumber} was successfully processed.`,
      channels: { inApp: true, email: true },
      relatedBooking: invoice.booking?._id,
    });

    res.json({
      message: 'Checkout completed successfully',
      payment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 10. Notifications List
const getNotifications = async (req, res) => {
  try {
    const list = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 11. Toggle Notification Read
const markNotificationRead = async (req, res) => {
  try {
    const alert = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 12. Dismiss/Delete Notification
const deleteNotification = async (req, res) => {
  try {
    const alert = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.userId,
    });
    if (!alert) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification dismissed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 13. Support Tickets Log
const getSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ customer: req.userId })
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 14. Log Support Ticket
const createSupportTicket = async (req, res) => {
  try {
    const { category, subject, description } = req.body;
    const ticketId = `FN-TKT-${Math.floor(10000 + Math.random() * 90000)}`;

    const ticket = await SupportTicket.create({
      ticketId,
      customer: req.userId,
      category,
      subject,
      description,
      messages: [
        {
          sender: 'customer',
          text: description || subject,
          timestamp: new Date(),
        },
        {
          sender: 'system',
          text: `Thank you for contacting FilterNest Support. Ticket ${ticketId} has been created and assigned to technical assistance. Our assistant chatbot or a live executive will respond shortly.`,
          timestamp: new Date(),
        },
      ],
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 15. Message Support chat thread
const addSupportTicketMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      customer: req.userId,
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ error: 'Cannot send message to a closed ticket' });
    }

    // Append customer's text
    ticket.messages.push({
      sender: 'customer',
      text,
      timestamp: new Date(),
    });

    await ticket.save();

    // Trigger standard simulated responses
    setTimeout(async () => {
      let botResponse = '';
      if (text.toLowerCase().includes('leak') || text.toLowerCase().includes('water')) {
        botResponse = "We recommend shutting off the main inlet valve for the purifier immediately to prevent scaling or water damage. A service technician will reach out directly.";
      } else if (text.toLowerCase().includes('invoice') || text.toLowerCase().includes('pay')) {
        botResponse = "You can view invoices and proceed with payments directly inside the 'Invoices & Billing' workspace on your Customer Dashboard. PDF downloads are also immediately available.";
      } else {
        botResponse = "We have received your input. A customer support supervisor has been tagged and will check your purifier warranty details within the hour.";
      }

      const updatedTicket = await SupportTicket.findById(ticket._id);
      if (updatedTicket && updatedTicket.status !== 'closed') {
        updatedTicket.messages.push({
          sender: 'agent',
          text: botResponse,
          timestamp: new Date(),
        });
        await updatedTicket.save();
      }
    }, 2000);

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 16. Maintenance Reminders List
const getReminders = async (req, res) => {
  try {
    const schedules = await MaintenanceSchedule.find({ customer: req.userId })
      .sort({ nextServiceDate: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 17. Snooze Reminder (adds 7 days)
const snoozeReminder = async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findOne({
      _id: req.params.id,
      customer: req.userId,
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule reminder not found' });
    }

    // Push next service date out by 7 days
    const currentDueDate = new Date(schedule.nextServiceDate);
    currentDueDate.setDate(currentDueDate.getDate() + 7);
    
    schedule.nextServiceDate = currentDueDate;
    schedule.reminderSent = false; // Reset to allow reminder notifications later
    await schedule.save();

    res.json({
      message: 'Snoozed maintenance successfully by 7 days',
      schedule,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 18. Reschedule Reminder
const rescheduleReminder = async (req, res) => {
  try {
    const { customDate } = req.body;
    const schedule = await MaintenanceSchedule.findOne({
      _id: req.params.id,
      customer: req.userId,
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule reminder not found' });
    }

    schedule.nextServiceDate = new Date(customDate);
    schedule.reminderSent = false;
    await schedule.save();

    res.json({
      message: 'Rescheduled maintenance appointment successfully',
      schedule,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateLocation,
  getDashboard,
  getBookings,
  getInvoices,
  getInvoicePDF,
  getPayments,
  simulatePayment,
  getNotifications,
  markNotificationRead,
  deleteNotification,
  getSupportTickets,
  createSupportTicket,
  addSupportTicketMessage,
  getReminders,
  snoozeReminder,
  rescheduleReminder,
};
