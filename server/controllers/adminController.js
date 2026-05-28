const Customer = require('../models/Customer');
const Agent = require('../models/Agent');
const Booking = require('../models/Booking');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const Payment = require('../models/Payment');
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const Invoice = require('../models/Invoice');
const { createNotification, sendNotification } = require('../services/notificationService');

// Verification & Image Upload Core Imports
const EmailVerification = require('../models/EmailVerification');
const AadhaarVerification = require('../models/AadhaarVerification');
const otpService = require('../services/otpService');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const axios = require('axios');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { sendEmail } = require('../services/emailService');

const generateUniqueAgentId = async () => {
  let attempts = 0;
  while (attempts < 10) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const id = `AG${randomDigits}`;
    const exists = await Agent.findOne({ agentId: id });
    if (!exists) return id;
    attempts++;
  }
  throw new Error("Failed to generate unique Agent ID");
};

// Get Dashboard Statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalAgents = await Agent.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const activeAgents = await Agent.countDocuments({ status: 'available' });
    const upcomingReminders = await MaintenanceSchedule.countDocuments({
      status: 'pending',
      nextServiceDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      totalCustomers,
      totalAgents,
      totalBookings,
      completedBookings,
      pendingBookings,
      activeAgents,
      upcomingReminders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Customers
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    if (search) {
      const escapeRegex = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const safeSearch = escapeRegex(search);
      query.$or = [
        { firstName: { $regex: safeSearch, $options: 'i' } },
        { lastName: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { phone: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Agents
const getAllAgents = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const agents = await Agent.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Agent.countDocuments(query);

    res.json({
      agents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Service Agent
const createAgent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      passcode,
      profileImage,
      aadharNumber,
      panNumber,
      address,
      licenseNumber,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !passcode || !aadharNumber || !panNumber) {
      return res.status(400).json({
        error: 'First name, last name, email, phone, passcode, Aadhaar number and PAN number are required',
      });
    }

    const cleanAadhaar = aadharNumber.replace(/\s/g, '');
    const upperPan = panNumber.toUpperCase().trim();

    // Validations
    if (cleanAadhaar.length !== 12 || !/^\d+$/.test(cleanAadhaar)) {
      return res.status(400).json({ error: 'Aadhaar must contain exactly 12 digits' });
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(upperPan)) {
      return res.status(400).json({ error: 'PAN format must be exactly ABCDE1234F' });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    const generatedAgentId = await generateUniqueAgentId();
    const existingAgent = await Agent.findOne({
      $or: [{ email }, { phone }, { agentId: generatedAgentId }],
    });
    const existingCustomer = await Customer.findOne({ $or: [{ email }, { phone }] });

    if (existingAgent || existingCustomer) {
      return res.status(400).json({ error: 'Email or phone already exists' });
    }

    const agent = new Agent({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone,
      password: passcode,
      agentId: generatedAgentId,
      profileImage,
      licenseNumber,
      address,
      role: 'agent',
      status: 'offline',
      isVerified: true,
      isActive: true,
      isApproved: true,
      registrationStatus: 'active',
      approvalDate: new Date(),
      approvedBy: req.userId,
      documents: {
        aadhar: cleanAadhaar,
        panCard: upperPan,
      },
    });

    await agent.save();

    res.status(201).json({
      message: 'Agent created successfully',
      agent: agent.toJSON(),
      login: {
        agentId: generatedAgentId,
        passcode,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve Service Agent
const approveAgent = async (req, res) => {
  try {
    const { passcode } = req.body;
    if (!passcode || passcode.length < 6) {
      return res.status(400).json({ error: 'A secure passcode (minimum 6 characters) is required to approve the technician.' });
    }

    const agent = await Agent.findById(req.params.agentId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Set passcode and approved status
    agent.password = passcode;
    agent.isApproved = true;
    agent.isVerified = true;
    agent.isActive = true;
    agent.registrationStatus = 'active';
    agent.approvalDate = new Date();
    agent.approvedBy = req.userId;

    await agent.save();

    // Onboarding HTML Email content
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Technician Approved | FilterNest Care</title>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #faf9f6; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(117, 52, 1, 0.1); box-shadow: 0 20px 50px rgba(108, 47, 0, 0.04); overflow: hidden; }
          .header { background: linear-gradient(135deg, #8B4513 0%, #6c2f00 100%); padding: 35px; text-align: center; }
          .logo { font-size: 26px; font-weight: 800; font-family: 'Georgia', serif; font-style: italic; color: #ffffff; letter-spacing: 2px; }
          .body-content { padding: 40px; }
          h1 { color: #753401; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 16px; }
          p { font-size: 14px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 24px; }
          .credential-box { background-color: #faf9f6; border: 1px solid rgba(117, 52, 1, 0.15); border-radius: 16px; padding: 20px; margin: 30px 0; }
          .credential-row { display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(117, 52, 1, 0.1); padding: 10px 0; font-size: 13px; }
          .credential-row:last-child { border-bottom: none; }
          .label { font-weight: 800; color: #753401; text-transform: uppercase; }
          .value { font-weight: 700; color: #1e293b; font-family: monospace; }
          .btn-container { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #8B4513 0%, #6c2f00 100%); color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: bold; padding: 14px 30px; border-radius: 12px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(117,52,1,0.15); }
          .notice { background-color: #fffaf0; border: 1px solid #feebc8; padding: 14px; border-radius: 12px; font-size: 12px; color: #753401; margin-top: 30px; border-left: 4px solid #8B4513; }
          .footer { background-color: #faf9f6; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
          .footer a { color: #8B4513; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">FILTERNEST</div>
            <div style="color: #f3e2ac; font-size: 10px; font-weight: 800; letter-spacing: 3px; margin-top: 6px; text-transform: uppercase;">Specialist Technician Credentials</div>
          </div>
          <div class="body-content">
            <h1>Congratulations, ${agent.firstName}!</h1>
            <p>Your FilterNest Service Technician application has been approved by our administration team.</p>
            <p>You have been onboarded as a certified care specialist. Below are your secure login credentials:</p>
            
            <div class="credential-box">
              <div class="credential-row">
                <span class="label">TECHNICIAN ID</span>
                <span class="value" style="color: #753401; font-size: 14px;">${agent.agentId}</span>
              </div>
              <div class="credential-row">
                <span class="label">SECURE PASSCODE</span>
                <span class="value" style="font-size: 14px;">${passcode}</span>
              </div>
              <div class="credential-row">
                <span class="label">EMAIL REGISTERED</span>
                <span class="value" style="font-family: inherit;">${agent.email}</span>
              </div>
            </div>
            
            <p>To calibrate your specialist workspace and view your scheduled service jobs, click the secure portal login link below:</p>
            
            <div class="btn-container">
              <a href="http://localhost:3000/login" class="btn">Access Technician Portal</a>
            </div>
            
            <div class="notice">
              <strong>🔒 Security Policy:</strong> Please memorize your secure login passcode immediately. Never share your passcode, technician credentials, or Aadhaar details with any third parties. Our team will never ask for your login passcode.
            </div>
          </div>
          <div class="footer">
            <p>© 2026 FilterNest luxury reverse osmosis networks.</p>
            <p>Specialist Hotline: 1-800-FILTER-1 | <a href="mailto:support@waterfilter.com">support@waterfilter.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(agent.email, 'Your FilterNest Service Technician Account Has Been Approved', emailContent);

    res.json({
      message: 'Agent approved successfully and onboarding credentials email dispatched.',
      agent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Bookings
const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'firstName lastName phone email address')
      .populate('assignedAgent', 'firstName lastName agentId')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Assign Service Agent
const assignAgent = async (req, res) => {
  try {
    const { bookingId, agentId } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { assignedAgent: agentId, status: 'confirmed' },
      { new: true }
    ).populate('assignedAgent').populate('customer');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Format the booking date beautifully
    const formattedDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 1. Send notification to the Agent
    const agent = booking.assignedAgent;
    if (agent) {
      const agentMsg = `You have been assigned a new service job (Booking ID: ${booking.bookingId}) for ${booking.customer?.firstName || ''} ${booking.customer?.lastName || ''} scheduled on ${formattedDate}.`;
      const agentNotification = await createNotification(
        agent._id,
        'Agent',
        'new_assignment',
        agentMsg,
        'New Service Job Assignment',
        {
          relatedBooking: booking._id,
          channels: { inApp: true, email: true, sms: false, whatsapp: false }
        }
      );
      await sendNotification(agentNotification);
    }

    // 2. Send notification to the Customer
    if (booking.customer) {
      const customerMsg = `Great news! Your service booking (Booking ID: ${booking.bookingId}) has been confirmed. Your assigned agent is ${agent?.firstName || ''} ${agent?.lastName || ''} and he is coming by ${formattedDate}.`;
      const customerNotification = await createNotification(
        booking.customer._id,
        'Customer',
        'booking_confirmed',
        customerMsg,
        'Your Booking is Confirmed & Agent Assigned',
        {
          relatedBooking: booking._id,
          channels: { inApp: true, email: true, sms: false, whatsapp: false }
        }
      );
      await sendNotification(customerNotification);
    }

    res.json({
      message: 'Agent assigned successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Upcoming Reminders
const getUpcomingReminders = async (req, res) => {
  try {
    const reminders = await MaintenanceSchedule.find({
      status: 'pending',
      nextServiceDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    })
      .populate('customer', 'firstName lastName email phone')
      .sort({ nextServiceDate: 1 });

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unassign Service Agent
const unassignAgent = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate('assignedAgent').populate('customer');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const previousAgent = booking.assignedAgent;
    
    booking.assignedAgent = undefined;
    booking.status = 'pending';
    await booking.save();

    // 1. Notify the previous Agent that they have been unassigned
    if (previousAgent) {
      const agentMsg = `You have been unassigned from service job (Booking ID: ${booking.bookingId}).`;
      const agentNotification = await createNotification(
        previousAgent._id,
        'Agent',
        'alert',
        agentMsg,
        'Job Unassignment Alert',
        {
          relatedBooking: booking._id,
          channels: { inApp: true, email: true, sms: false, whatsapp: false }
        }
      );
      await sendNotification(agentNotification);
    }

    // 2. Notify the Customer that their booking is pending new assignment
    if (booking.customer) {
      const customerMsg = `Your service booking (Booking ID: ${booking.bookingId}) has been updated. We are re-assigning a new agent to your job shortly.`;
      const customerNotification = await createNotification(
        booking.customer._id,
        'Customer',
        'status_update',
        customerMsg,
        'Booking Update: Re-assigning Agent',
        {
          relatedBooking: booking._id,
          channels: { inApp: true, email: true, sms: false, whatsapp: false }
        }
      );
      await sendNotification(customerNotification);
    }

    res.json({
      message: 'Agent unassigned successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Service Agent
const deleteAgent = async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Unassign this agent from any active bookings
    await Booking.updateMany(
      { assignedAgent: agentId, status: { $ne: 'completed' } },
      { $unset: { assignedAgent: "" }, status: 'pending' }
    );

    await Agent.findByIdAndDelete(agentId);

    res.json({
      message: 'Agent deleted successfully',
      agentId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Nodemailer SMTP Transporter setup using active env credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 1. Send secure verification link to email
const sendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    // Generate unique verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiryMinutes = 60;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save or update verification entry in database
    await EmailVerification.findOneAndUpdate(
      { email },
      { token, isVerified: false, expiresAt },
      { upsert: true, new: true }
    );

    // Dynamic, secure verification link pointing to the backend verify-email endpoint
    const verificationLink = `http://localhost:5001/api/admin/verify-email?token=${token}`;

    const mailOptions = {
      from: `"FilterNest Service" <${process.env.SMTP_FROM || 'filternest.service@gmail.com'}>`,
      to: email,
      subject: 'Verify Your Email Address | FilterNest Care Specialist Program',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid rgba(117, 52, 1, 0.1); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02); overflow: hidden; }
            .header { background-color: #753401; padding: 30px; text-align: center; }
            .body-content { padding: 40px; }
            h1 { color: #753401; font-size: 24px; font-weight: 800; margin-top: 0; margin-bottom: 16px; }
            p { font-size: 15px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 24px; }
            .btn-container { text-align: center; margin: 35px 0; }
            .btn { display: inline-block; background-color: #753401; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: bold; padding: 14px 32px; border-radius: 12px; transition: background-color 0.2s; }
            .btn:hover { background-color: #5c2901; }
            .notice { background-color: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; color: #64748b; margin-top: 30px; border-left: 4px solid #753401; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            .footer a { color: #753401; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="color: #ffffff; margin: 0; font-family: 'Georgia', serif; font-style: italic;">FilterNest</h2>
            </div>
            <div class="body-content">
              <h1>Verify Your Email Address</h1>
              <p>Hello,</p>
              <p>You have been nominated as a certified service technician for the FilterNest luxury reverse osmosis sanctuary networks.</p>
              <p>To finalize your specialist credentials and authenticate your account workspace, please click the secure button below within the next 60 minutes:</p>
              <div class="btn-container">
                <a href="${verificationLink}" class="btn">Verify Email Address</a>
              </div>
              <div class="notice">
                <strong>Security Notice:</strong> This secure verification token expires in 1 hour. If you did not request this credentials alignment, please ignore this notice safely.
              </div>
            </div>
            <div class="footer">
              <p>FilterNest white-glove reverse osmosis networks.</p>
              <p>Support Helpline: 1-800-FILTER-1 | <a href="mailto:support@waterfilter.com">support@waterfilter.com</a> / <a href="mailto:info@waterfilter.com">info@waterfilter.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Verification link sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send secure verification email: ' + error.message });
  }
};

// HTML rendering function for verifyEmail landing pages
const renderHtmlStatusPage = ({ success, title, message }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} | FilterNest Care</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background-color: #faf9f6; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: white; border-radius: 24px; padding: 40px 30px; text-align: center; max-width: 500px; width: 100%; border: 1px solid rgba(117, 52, 1, 0.1); box-shadow: 0 20px 50px rgba(108, 47, 0, 0.04); }
    .badge { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    .badge.success { background: #ecfdf5; color: #059669; }
    .badge.error { background: #fef2f2; color: #dc2626; }
    h1 { font-size: 22px; font-weight: 800; color: #753401; margin: 0 0 12px; }
    p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 30px; }
    .btn { display: inline-block; background: #753401; color: white !important; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; box-shadow: 0 4px 12px rgba(117, 52, 1, 0.1); transition: all 0.2s; }
    .btn:hover { background: #5c2901; transform: translateY(-1px); }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge ${success ? 'success' : 'error'}">
      ${success 
        ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" style="width:32px;height:32px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width:32px;height:32px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>'
      }
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="http://localhost:3000/admin-dashboard" class="btn">Return to Dashboard</a>
  </div>
</body>
</html>
`;

// 2. Public Verify Email Route handler linking from clicked email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(renderHtmlStatusPage({
        success: false,
        title: 'Invalid Verification Request',
        message: 'A secure token parameter is required to align your credentials.'
      }));
    }

    const verification = await EmailVerification.findOne({ token });

    if (!verification) {
      return res.status(404).send(renderHtmlStatusPage({
        success: false,
        title: 'Verification Link Expired or Invalid',
        message: 'The secure link is either invalid or has expired. Please ask the administrator to trigger a new link.'
      }));
    }

    if (verification.expiresAt < new Date()) {
      return res.status(400).send(renderHtmlStatusPage({
        success: false,
        title: 'Token Expired',
        message: 'This security token has expired (1-hour window exceeded). Please request a new verification email.'
      }));
    }

    // Update status to verified
    verification.isVerified = true;
    await verification.save();

    res.send(renderHtmlStatusPage({
      success: true,
      title: 'Email Verified Successfully!',
      message: 'Your email address has been securely authenticated. You may now return to the FilterNest Admin Dashboard to finalize your account registration.'
    }));
  } catch (error) {
    res.status(500).send(renderHtmlStatusPage({
      success: false,
      title: 'System Handshake Error',
      message: error.message
    }));
  }
};

// 3. Check email verification status endpoint
const checkEmailVerification = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required.' });
    }

    const verification = await EmailVerification.findOne({ email });
    if (!verification) {
      return res.json({ email, isVerified: false });
    }

    res.json({
      email,
      isVerified: verification.isVerified && (verification.expiresAt >= new Date())
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Secure profile picture upload and compression with multer & sharp
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are supported.'));
  }
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('avatar');

const uploadAvatar = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please physically upload an image file.' });
    }

    try {
      // Create public/uploads directory if not exists
      const uploadsDir = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate secure unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `avatar-${uniqueSuffix}.jpg`;
      const outputPath = path.join(uploadsDir, filename);

      // Sharp image optimization, crop into a perfect square, progressive compression
      await sharp(req.file.buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80, progressive: true })
        .toFile(outputPath);

      const avatarUrl = `http://localhost:5001/uploads/${filename}`;
      res.json({ avatarUrl });
    } catch (error) {
      res.status(500).json({ error: 'Image optimization or save failed: ' + error.message });
    }
  });
};

// 5. Send secure real SMS OTP for Aadhaar verification
const sendAadhaarOTP = async (req, res) => {
  try {
    const { aadharNumber, phone } = req.body;

    if (!aadharNumber) {
      return res.status(400).json({ error: 'Aadhaar number is required.' });
    }
    const cleanAadhaar = aadharNumber.replace(/\s/g, '');
    if (cleanAadhaar.length !== 12 || !/^\d+$/.test(cleanAadhaar)) {
      return res.status(400).json({ error: 'Aadhaar number must be exactly 12 numeric digits.' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Please enter the agent\'s phone number in the form first.' });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Linked phone number must be exactly 10 numeric digits.' });
    }

    // Check rate limit / resend cooldown
    const existingVerification = await AadhaarVerification.findOne({ aadharNumber: cleanAadhaar });
    if (existingVerification && existingVerification.cooldownUntil > new Date()) {
      const waitSeconds = Math.ceil((existingVerification.cooldownUntil - new Date()) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSeconds} seconds before requesting a new OTP.` });
    }

    const expiryMinutes = 5;
    const cooldownSeconds = 60;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const cooldownUntil = new Date(Date.now() + cooldownSeconds * 1000);

    // 1. Real Surepass API flow if SUREPASS_API_TOKEN is configured in environment
    if (process.env.SUREPASS_API_TOKEN) {
      try {
        console.log(`[SUREPASS] Dispatching real Aadhaar OTP request to Surepass endpoint for ${cleanAadhaar}`);
        const response = await axios.post(
          'https://api.surepass.io/api/v1/aadhaar-v2/generate-otp',
          { aadhaar_number: cleanAadhaar },
          {
            headers: {
              'Authorization': `Bearer ${process.env.SUREPASS_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && response.data.success && response.data.data?.client_id) {
          const clientId = response.data.data.client_id;
          
          await AadhaarVerification.findOneAndUpdate(
            { aadharNumber: cleanAadhaar },
            {
              phone: cleanPhone,
              clientId,
              attempts: 0,
              isVerified: false,
              expiresAt,
              cooldownUntil
            },
            { upsert: true, new: true }
          );

          console.log(`
✅ SMS Gateway Connected (Surepass e-KYC)
✅ Production OTP Mode Enabled
✅ OTP delivered successfully to +91 XXXXXXX${cleanPhone.slice(-3)}
          `);

          return res.json({
            message: 'A secure 6-digit verification code has been dispatched to your Aadhaar-linked mobile.',
            maskedPhone: `+91 XXXXXXX${cleanPhone.slice(-3)}`,
            isSandbox: false
          });
        } else {
          throw new Error(response.data?.message || 'Surepass server returned unsuccessful dispatch');
        }
      } catch (surepassError) {
        console.error(`[SUREPASS ERROR] Generation failed: ${surepassError.response?.data?.message || surepassError.message}`);
        return res.status(surepassError.response?.status || 500).json({
          error: `Surepass gateway failed: ${surepassError.response?.data?.message || surepassError.message}`
        });
      }
    }

    // 2. Sandbox fallback code if token not set
    const otp = crypto.randomInt(100000, 999999).toString();
    await AadhaarVerification.findOneAndUpdate(
      { aadharNumber: cleanAadhaar },
      {
        phone: cleanPhone,
        otp,
        clientId: 'sandbox_client_' + Date.now(),
        attempts: 0,
        isVerified: false,
        expiresAt,
        cooldownUntil
      },
      { upsert: true, new: true }
    );

    // Dispatch SMS or email fallback
    const isSandboxActive = !otpService.isSMSConfigured();
    await otpService.sendSMSOtp(cleanPhone, otp, cleanAadhaar);

    res.json({
      message: isSandboxActive
        ? 'Running in Sandbox Mode – OTP sent to terminal/email'
        : 'A secure 6-digit verification code has been dispatched.',
      maskedPhone: `+91 XXXXXXX${cleanPhone.slice(-3)}`,
      isSandbox: isSandboxActive
    });
  } catch (error) {
    res.status(500).json({ error: 'Aadhaar OTP dispatch failed: ' + error.message });
  }
};

// 6. Verify secure real SMS OTP for Aadhaar verification
const verifyAadhaarOTP = async (req, res) => {
  try {
    const { aadharNumber, otp } = req.body;

    if (!aadharNumber || !otp) {
      return res.status(400).json({ error: 'Aadhaar number and OTP are required.' });
    }

    const cleanAadhaar = aadharNumber.replace(/\s/g, '');
    const verification = await AadhaarVerification.findOne({ aadharNumber: cleanAadhaar });

    if (!verification) {
      return res.status(404).json({ error: 'Verification session has expired or does not exist.' });
    }

    if (verification.isVerified) {
      return res.json({ message: 'Aadhaar is already verified successfully.', success: true });
    }

    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired (5-minute window exceeded).' });
    }

    // Limit verification attempts to prevent brute force (max 3)
    if (verification.attempts >= 3) {
      return res.status(403).json({ error: 'Too many failed attempts. Verification locked. Please request a new OTP.' });
    }

    // 1. Real Surepass verification
    if (process.env.SUREPASS_API_TOKEN && verification.clientId && !verification.clientId.startsWith('sandbox_client_')) {
      try {
        console.log(`[SUREPASS] Submitting OTP to Surepass for client_id: ${verification.clientId}`);
        const response = await axios.post(
          'https://api.surepass.io/api/v1/aadhaar-v2/submit-otp',
          {
            client_id: verification.clientId,
            otp: otp
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.SUREPASS_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && response.data.success && response.data.status_code === 200) {
          console.log('[SUREPASS SUCCESS] e-KYC Verification successful!', response.data.data?.full_name);
          
          verification.isVerified = true;
          await verification.save();

          return res.json({
            message: 'Aadhaar verified successfully via Surepass.',
            success: true,
            kycData: response.data.data
          });
        } else {
          throw new Error(response.data?.message || 'Surepass returned validation mismatch');
        }
      } catch (surepassError) {
        console.error(`[SUREPASS ERROR] Verification failed: ${surepassError.response?.data?.message || surepassError.message}`);
        
        verification.attempts += 1;
        await verification.save();

        const remaining = 3 - verification.attempts;
        const errText = surepassError.response?.data?.message || surepassError.message || 'OTP verification failed';
        
        if (remaining <= 0) {
          return res.status(403).json({ error: `Too many failed attempts. Verification locked. ${errText}` });
        } else {
          return res.status(400).json({
            error: `${errText}. Please try again.`,
            attemptsRemaining: remaining
          });
        }
      }
    }

    // 2. Sandbox Verification Check
    if (verification.otp !== otp) {
      verification.attempts += 1;
      await verification.save();

      const remaining = 3 - verification.attempts;
      if (remaining <= 0) {
        return res.status(403).json({ error: 'Too many failed attempts. Verification locked. Please request a new OTP.' });
      } else {
        return res.status(400).json({
          error: `Invalid OTP entered. Please try again.`,
          attemptsRemaining: remaining
        });
      }
    }

    // Verification successful
    verification.isVerified = true;
    await verification.save();

    res.json({
      message: 'Aadhaar verified successfully.',
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Aadhaar verification sweep failed: ' + error.message });
  }
};

const rejectAgent = async (req, res) => {
  try {
    const { rejectedReason } = req.body;
    const agent = await Agent.findById(req.params.agentId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.isApproved = false;
    agent.registrationStatus = 'rejected';
    agent.rejectedReason = rejectedReason || 'Application does not meet FilterNest workforce guidelines.';
    agent.isActive = false;

    await agent.save();

    res.json({
      message: 'Agent application rejected successfully',
      agent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const suspendAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.agentId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.registrationStatus = 'suspended';
    agent.isActive = false;
    agent.status = 'offline';

    await agent.save();

    // Revoke all active session records for this suspended agent to instantly log them out
    const Session = require('../models/Session');
    await Session.updateMany({ userId: agent._id }, { $set: { isActive: false } });

    res.json({
      message: 'Agent account suspended successfully and all active sessions revoked.',
      agent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ENTERPRISE CONTROL CENTER - FINANCE
// ============================================

// Get All Payments (with customer & booking populates)
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const payments = await Payment.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('booking', 'bookingId serviceType status')
      .populate('invoice', 'invoiceNumber total')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Process Simulated Refund
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate('customer', 'firstName lastName email');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'refunded') return res.status(400).json({ error: 'Payment already refunded' });

    payment.status = 'refunded';
    payment.refundStatus = 'completed';
    await payment.save();

    // Send notification to customer
    try {
      await createNotification({
        recipient: payment.customer._id,
        recipientModel: 'Customer',
        type: 'payment_confirmation',
        title: 'Refund Processed',
        message: `Your refund of ₹${payment.amount} (Txn: ${payment.transactionId}) has been processed successfully.`,
      });
    } catch (e) { /* notification is best-effort */ }

    res.json({ message: 'Refund processed successfully', payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ENTERPRISE CONTROL CENTER - HELPDESK
// ============================================

// Get All Support Tickets / Complaints
const getAllComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;

    const tickets = await SupportTicket.find(query)
      .populate('customer', 'firstName lastName email phone profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SupportTicket.countDocuments(query);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reply to a Support Ticket (admin message)
const replyToComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Reply text is required' });

    const ticket = await SupportTicket.findById(id).populate('customer', 'firstName lastName email');
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found' });

    ticket.messages.push({
      sender: 'admin',
      text: text.trim(),
      timestamp: new Date(),
    });

    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    res.json({ message: 'Reply sent successfully', ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Support Ticket Status (close / escalate)
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['open', 'in_progress', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found' });

    ticket.status = status;
    await ticket.save();

    res.json({ message: `Ticket status updated to ${status}`, ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ENTERPRISE CONTROL CENTER - CUSTOMER OPS
// ============================================

// Suspend / Unsuspend Customer Account
const suspendCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    customer.isActive = !customer.isActive;
    await customer.save();

    res.json({
      message: customer.isActive ? 'Customer account reactivated' : 'Customer account suspended',
      customer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ENTERPRISE CONTROL CENTER - BROADCASTER
// ============================================

// Broadcast Platform-wide Notification
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type = 'alert', audience = 'all' } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });

    let recipients = [];

    if (audience === 'customers' || audience === 'all') {
      const customers = await Customer.find({ isActive: true }).select('_id');
      recipients.push(...customers.map(c => ({ id: c._id, model: 'Customer' })));
    }
    if (audience === 'agents' || audience === 'all') {
      const agents = await Agent.find({ registrationStatus: 'active' }).select('_id');
      recipients.push(...agents.map(a => ({ id: a._id, model: 'Agent' })));
    }

    let created = 0;
    for (const r of recipients) {
      try {
        await createNotification({
          recipient: r.id,
          recipientModel: r.model,
          type,
          title,
          message,
        });
        created++;
      } catch (e) { /* best effort */ }
    }

    res.json({
      message: `Broadcast dispatched to ${created} recipients`,
      totalRecipients: recipients.length,
      delivered: created,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllCustomers,
  getAllAgents,
  createAgent,
  approveAgent,
  rejectAgent,
  suspendAgent,
  getAllBookings,
  assignAgent,
  getUpcomingReminders,
  unassignAgent,
  deleteAgent,
  sendEmailVerification,
  verifyEmail,
  checkEmailVerification,
  uploadAvatar,
  sendAadhaarOTP,
  verifyAadhaarOTP,
  getAllPayments,
  processRefund,
  getAllComplaints,
  replyToComplaint,
  updateComplaintStatus,
  suspendCustomer,
  broadcastNotification,
};
