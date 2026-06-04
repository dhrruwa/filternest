const prisma = require('../lib/prisma');
const { stripSensitive } = require('../lib/sanitize');
const { generateInvoicePDF } = require('../utils/invoicePdfGenerator');

// 1. Get Customer Profile
const getProfile = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.userId } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(stripSensitive(customer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Update Customer Profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, preferences, alternatePhone, preferredServiceTimings } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.userId },
      data: {
        firstName,
        lastName,
        phone,
        address,
        preferences,
        alternatePhone,
        preferredServiceTimings,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      customer: stripSensitive(customer),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Update Location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.userId },
      data: {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
    });

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
    const completedWithoutInvoice = await prisma.booking.findMany({
      where: {
        customerId: customerId,
        status: 'completed',
        invoice: null,
      },
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

        await prisma.invoice.create({
          data: {
            invoiceNumber,
            bookingId: booking.id,
            customerId: customerId,
            agentId: booking.assignedAgentId || null,
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
          },
        });
      }
    }

    // Fetch baseline models
    const [bookings, invoices, upcomingSchedules, unreadNotifications, activeTickets] = await Promise.all([
      prisma.booking.findMany({ where: { customerId: customerId } }),
      prisma.invoice.findMany({ where: { customerId: customerId } }),
      prisma.maintenanceSchedule.findMany({ where: { customerId: customerId, status: { not: 'completed' } } }),
      prisma.notification.findMany({ where: { recipient: customerId, isRead: false } }),
      prisma.supportTicket.findMany({ where: { customerId: customerId, status: { not: 'closed' } } }),
    ]);

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
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
      activeTracker = await prisma.booking.findUnique({
        where: { id: trackedBooking.id },
        include: {
          assignedAgent: true,
          invoice: true,
        },
      });
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
      activeTracker: stripSensitive(activeTracker),
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

    let query = { customerId: customerId };

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query.status = { notIn: ['completed', 'cancelled'] };
      } else {
        query.status = status;
      }
    }

    // Apply search filter (service type)
    if (search) {
      query.serviceType = { contains: search, mode: 'insensitive' };
    }

    const total = await prisma.booking.count({ where: query });
    const bookings = await prisma.booking.findMany({
      where: query,
      include: {
        assignedAgent: true,
        invoice: true,
      },
      orderBy: { bookingDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      bookings: stripSensitive(bookings),
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
    const completedWithoutInvoice = await prisma.booking.findMany({
      where: {
        customerId: customerId,
        status: 'completed',
        invoice: null,
      },
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

        await prisma.invoice.create({
          data: {
            invoiceNumber,
            bookingId: booking.id,
            customerId: customerId,
            agentId: booking.assignedAgentId || null,
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
          },
        });
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: { customerId: customerId },
      include: {
        booking: {
          include: { assignedAgent: true },
        },
      },
      orderBy: { issueDate: 'desc' },
    });
    res.json(stripSensitive(invoices));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Dynamic PDF Invoice Streaming
const getInvoicePDF = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        agent: true,
        booking: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Basic permission check (must be the billing customer)
    if (invoice.customer.id.toString() !== req.userId) {
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
    const payments = await prisma.payment.findMany({
      where: { customerId: req.userId },
      include: {
        booking: true,
        invoice: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
    res.json(stripSensitive(payments));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Simulating Checkout / Razorpay / UPI pay
const simulatePayment = async (req, res) => {
  try {
    const { invoiceId, method = 'upi' } = req.body;
    const customerId = req.userId;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { booking: true },
    });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.customerId.toString() !== customerId) {
      return res.status(403).json({ error: 'Unauthorized to pay for this invoice' });
    }

    if (invoice.paymentStatus === 'completed') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    // 1. Create a Payment Document
    const transactionId = `FN-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const payment = await prisma.payment.create({
      data: {
        transactionId,
        customerId: customerId,
        bookingId: invoice.booking?.id || null,
        invoiceId: invoice.id,
        amount: invoice.total,
        method,
        status: 'completed',
        paymentReference: `UPI-REF-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      },
    });

    // 2. Mark Invoice as completed
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentStatus: 'completed',
        paymentDate: new Date(),
        paymentReference: payment.paymentReference,
        paymentMethod: method,
      },
    });

    // 3. Mark booking payment status as completed
    if (invoice.booking) {
      const booking = await prisma.booking.findUnique({ where: { id: invoice.booking.id } });
      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'completed',
            paymentMethod: method,
          },
        });
      }
    }

    // 4. Create an in-app Alert Notification
    await prisma.notification.create({
      data: {
        recipient: customerId,
        recipientModel: 'Customer',
        type: 'payment_confirmation',
        title: 'Payment Received Successfully',
        message: `Your payment of INR ${invoice.total.toFixed(2)} for invoice ${invoice.invoiceNumber} was successfully processed.`,
        channels: { inApp: true, email: true },
        relatedBookingId: invoice.booking?.id || null,
      },
    });

    res.json({
      message: 'Checkout completed successfully',
      payment: stripSensitive(payment),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 10. Notifications List
const getNotifications = async (req, res) => {
  try {
    const list = await prisma.notification.findMany({
      where: { recipient: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 11. Toggle Notification Read
const markNotificationRead = async (req, res) => {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, recipient: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const alert = await prisma.notification.update({
      where: { id: existing.id },
      data: { isRead: true, readAt: new Date() },
    });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 12. Dismiss/Delete Notification
const deleteNotification = async (req, res) => {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, recipient: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await prisma.notification.delete({ where: { id: existing.id } });
    res.json({ message: 'Notification dismissed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 13. Support Tickets Log
const getSupportTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { customerId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
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

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketId,
        customerId: req.userId,
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
      },
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
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        customerId: req.userId,
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ error: 'Cannot send message to a closed ticket' });
    }

    // Append customer's text
    const updatedMessages = [
      ...(ticket.messages || []),
      {
        sender: 'customer',
        text,
        timestamp: new Date(),
      },
    ];

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { messages: updatedMessages },
    });
    ticket.messages = updatedMessages;

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

      const updatedTicket = await prisma.supportTicket.findUnique({ where: { id: ticket.id } });
      if (updatedTicket && updatedTicket.status !== 'closed') {
        const agentMessages = [
          ...(updatedTicket.messages || []),
          {
            sender: 'agent',
            text: botResponse,
            timestamp: new Date(),
          },
        ];
        await prisma.supportTicket.update({
          where: { id: updatedTicket.id },
          data: { messages: agentMessages },
        });
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
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: { customerId: req.userId },
      orderBy: { nextServiceDate: 'asc' },
    });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 17. Snooze Reminder (adds 7 days)
const snoozeReminder = async (req, res) => {
  try {
    const schedule = await prisma.maintenanceSchedule.findFirst({
      where: {
        id: req.params.id,
        customerId: req.userId,
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule reminder not found' });
    }

    // Push next service date out by 7 days
    const currentDueDate = new Date(schedule.nextServiceDate);
    currentDueDate.setDate(currentDueDate.getDate() + 7);

    const updatedSchedule = await prisma.maintenanceSchedule.update({
      where: { id: schedule.id },
      data: {
        nextServiceDate: currentDueDate,
        reminderSent: false, // Reset to allow reminder notifications later
      },
    });

    res.json({
      message: 'Snoozed maintenance successfully by 7 days',
      schedule: updatedSchedule,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 18. Reschedule Reminder
const rescheduleReminder = async (req, res) => {
  try {
    const { customDate } = req.body;
    const schedule = await prisma.maintenanceSchedule.findFirst({
      where: {
        id: req.params.id,
        customerId: req.userId,
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule reminder not found' });
    }

    const updatedSchedule = await prisma.maintenanceSchedule.update({
      where: { id: schedule.id },
      data: {
        nextServiceDate: new Date(customDate),
        reminderSent: false,
      },
    });

    res.json({
      message: 'Rescheduled maintenance appointment successfully',
      schedule: updatedSchedule,
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
