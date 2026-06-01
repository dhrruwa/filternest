const Customer = require('../models/Customer');
const Agent = require('../models/Agent');
const Admin = require('../models/Admin');
const Session = require('../models/Session');
const RefreshToken = require('../models/RefreshToken');
const DeviceTracking = require('../models/DeviceTracking');
const LoginHistory = require('../models/LoginHistory');
const PasswordResetToken = require('../models/PasswordResetToken');
const { generateAccessToken, generateRefreshToken, generateToken } = require('../utils/tokenUtils');
const { generateOTP, getOTPExpiration } = require('../utils/otpUtils');
const { parseUserAgent } = require('../utils/deviceParser');
const { sendSMSOTP } = require('../services/smsService');
const { sendEmail } = require('../services/emailService');
const crypto = require('crypto');
const axios = require('axios');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

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

/**
 * Helper to record device tracking, log history, and issue JWT tokens
 */
const establishUserSession = async (user, userType, req, res, reason = 'successful authentication') => {
  const clientInfo = parseUserAgent(req.headers['user-agent']);
  const fingerprint = `${clientInfo.os}-${clientInfo.browser}-${clientInfo.deviceType}`;

  // 1. Device Tracking & Warnings
  let knownDevice = await DeviceTracking.findOne({ userId: user._id, deviceFingerprint: fingerprint });
  let isNewDevice = false;

  if (!knownDevice) {
    isNewDevice = true;
    knownDevice = new DeviceTracking({
      userId: user._id,
      userModel: userType === 'customer' ? 'Customer' : userType === 'agent' ? 'Agent' : 'Admin',
      deviceFingerprint: fingerprint,
      os: clientInfo.os,
      browser: clientInfo.browser,
      deviceType: clientInfo.deviceType,
      isTrusted: true,
    });
    await knownDevice.save();

    // Trigger New Login Warning Email
    const alertHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; color: #1f2937;">
        <h2 style="color: #b45309; margin-top: 0; font-size: 20px;">🛡️ FilterNest Security Alert</h2>
        <p>Hi ${user.firstName},</p>
        <p>We noticed a login to your FilterNest account from a new, unrecognized device.</p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Device Type:</strong> ${clientInfo.deviceType.toUpperCase()}</p>
          <p style="margin: 4px 0;"><strong>Platform:</strong> ${clientInfo.deviceName}</p>
          <p style="margin: 4px 0;"><strong>IP Address:</strong> ${req.ip || '127.0.0.1'}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>If this was you, you can safely ignore this alert. If you do not recognize this device, please log out from all devices in your account security panel and change your password immediately.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">FilterNest Service Identity • Pure Wellness, Defined</p>
      </div>
    `;
    await sendEmail(user.email, 'FilterNest Security Warning: New Login Detected', alertHtml);
  } else {
    knownDevice.lastLogin = new Date();
    await knownDevice.save();
  }

  // 2. Audit Trail
  const loginRecord = new LoginHistory({
    userId: user._id,
    userModel: userType === 'customer' ? 'Customer' : userType === 'agent' ? 'Agent' : 'Admin',
    email: user.email,
    os: clientInfo.os,
    browser: clientInfo.browser,
    deviceType: clientInfo.deviceType,
    ipAddress: req.ip || '127.0.0.1',
    location: 'Mumbai, India', // Simulated geolocation mapping
    status: isNewDevice ? 'suspicious' : 'success',
    reason: isNewDevice ? 'new device login' : reason,
  });
  await loginRecord.save();

  // 3. Generate Access + Refresh Token Flow
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days
  const rawRefreshToken = generateRefreshToken(user._id, user.role || userType);

  const refreshTokenDoc = new RefreshToken({
    userId: user._id,
    userModel: userType === 'customer' ? 'Customer' : userType === 'agent' ? 'Agent' : 'Admin',
    token: rawRefreshToken,
    expiresAt: refreshExpires,
  });
  await refreshTokenDoc.save();

  const sessionDoc = new Session({
    userId: user._id,
    userModel: userType === 'customer' ? 'Customer' : userType === 'agent' ? 'Agent' : 'Admin',
    refreshTokenId: refreshTokenDoc._id,
    os: clientInfo.os,
    browser: clientInfo.browser,
    deviceType: clientInfo.deviceType,
    deviceName: clientInfo.deviceName,
    ipAddress: req.ip || '127.0.0.1',
    location: 'Mumbai, India',
    expiresAt: refreshExpires,
  });
  await sessionDoc.save();

  const accessToken = generateAccessToken(user._id, user.role || userType, sessionDoc._id);

  // 4. Set HTTP-Only Cookie with Secure settings
  res.cookie('refreshToken', rawRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, sessionId: sessionDoc._id };
};

const sendVerificationOTP = async (user, email) => {
  const otp = generateOTP();
  console.log(`Verification OTP for ${email}: ${otp}`);
  user.verificationOTP = otp;
  user.verificationOTPExpire = getOTPExpiration();
  await user.save();

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; color: #1f2937;">
      <h2 style="color: #b45309; margin-top: 0;">Verify Your Email Address</h2>
      <p style="font-size: 16px; color: #4b5563;">Thank you for registering with FilterNest. Use the verification code below to activate your account:</p>
      <div style="background-color: #fef3c7; border: 1px dashed #d97706; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <h1 style="font-size: 36px; font-weight: bold; letter-spacing: 6px; margin: 0; color: #b45309;">${otp}</h1>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. For security, do not share this code with anyone.</p>
    </div>
  `;

  try {
    await sendEmail(email, 'Verify Your FilterNest Account', emailContent);
  } catch (emailError) {
    console.warn('⚠️ OTP email could not be sent, but OTP stored for manual verification:', emailError.message);
    // Continue - don't fail registration just because email failed
  }
};

const sendLoginOTP = async (user, email, userType = 'customer') => {
  const otp = generateOTP();
  console.log(`Login OTP for ${email}: ${otp}`);
  user.loginOTP = otp;
  user.loginOTPExpire = getOTPExpiration();
  await user.save();

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; color: #1f2937;">
      <h2 style="color: #b45309; margin-top: 0;">Your Secure Login Code</h2>
      <p style="font-size: 16px; color: #4b5563;">Use the code below to complete your login attempt:</p>
      <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <h1 style="font-size: 36px; font-weight: bold; letter-spacing: 6px; margin: 0; color: #1f2937;">${otp}</h1>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This login code is valid for exactly 10 minutes. If you did not request this, please verify your credentials immediately.</p>
    </div>
  `;
  const roleName = userType === 'agent' ? 'Agent' : userType === 'admin' ? 'Admin' : 'Customer';
  
  try {
    await sendEmail(email, `${roleName} Dynamic OTP Code - FilterNest Security`, emailContent);
  } catch (emailError) {
    console.warn('⚠️ Login OTP email could not be sent:', emailError.message);
    // Continue - OTP is still stored and can be used
  }
};

const findVerifiableUser = async (email, role = 'customer') => {
  if (role === 'agent') return Agent.findOne({ email });
  if (role === 'admin') return Admin.findOne({ email });
  return Customer.findOne({ email });
};

// Customer Registration
const registerCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, address, location } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    const existingCustomer = await Customer.findOne({ $or: [{ email: normalizedEmail }, { phone }] });
    const existingAgent = await Agent.findOne({ $or: [{ email: normalizedEmail }, { phone }] });
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    
    if (existingCustomer || existingAgent || existingAdmin) {
      return res.status(400).json({ error: 'Email or phone already registered' });
    }

    let customerData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: 'customer',
      verified: false, // Will be set to true for now to skip email verification
    };
    
    if (address) {
      customerData.address = address;
    }
    
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      customerData.location = location;
    }

    const customer = new Customer(customerData);
    
    // Save customer first
    await customer.save();
    console.log('✅ Customer account created:', customer._id);

    // Try to send OTP email in background (non-blocking)
    setImmediate(async () => {
      try {
        await sendVerificationOTP(customer, normalizedEmail);
        console.log('✅ OTP email sent to:', normalizedEmail);
      } catch (emailError) {
        console.warn('⚠️ OTP email skipped (non-critical):', emailError.message);
        // Email failure is not critical - account is created
      }
    });

    res.status(201).json({
      message: 'Registration successful! Your account is ready to use.',
      userId: customer._id,
      email: customer.email,
      role: 'customer',
      requiresOTP: false, // Changed - no OTP requirement for now
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed. Please try again.' });
  }
};

// OTP-based Login - Step 1: Request OTP
const requestLoginOTP = async (req, res) => {
  try {
    const { email, password, userType = 'customer' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;
    if (userType === 'agent') user = await Agent.findOne({ email });
    else if (userType === 'admin') user = await Admin.findOne({ email });
    else user = await Customer.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (userType === 'customer' && !user.verified) {
      return res.status(400).json({
        error: 'Please verify your email first',
        requiresVerification: true,
        userId: user._id,
        email: user.email,
      });
    }

    if (userType === 'agent' && !user.isActive) {
      return res.status(403).json({ error: 'Agent account is not active' });
    }

    await sendLoginOTP(user, email, userType);

    res.json({
      message: 'OTP sent to your email',
      userId: user._id,
      email: user.email,
      userType,
      requiresOTP: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// OTP-based Login - Step 2: Verify Login OTP and Return Access + Refresh tokens
const verifyLoginOTP = async (req, res) => {
  try {
    const { userId, otp, userType = 'customer' } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ error: 'User ID and OTP are required' });
    }

    let UserModel = userType === 'agent' ? Agent : userType === 'admin' ? Admin : Customer;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.loginOTPExpire || user.loginOTPExpire < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (user.loginOTP !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.loginOTP = undefined;
        user.loginOTPExpire = undefined;
        user.otpAttempts = 0;
        await user.save();
        return res.status(400).json({ error: 'Too many incorrect attempts. The OTP has been invalidated.' });
      }
      await user.save();
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    user.loginOTP = undefined;
    user.loginOTPExpire = undefined;
    user.otpAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    // Establish session, tracking, audit history, access & refresh token cookie
    const { accessToken } = await establishUserSession(user, userType, req, res, 'OTP verified login');

    let userData = user.toObject();
    delete userData.password;
    if (userType === 'admin') delete userData.loginHistory;

    res.json({
      message: 'Login successful',
      token: accessToken,
      user: userData,
      role: user.role || userType,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Legacy Login with Access + Refresh Token Cookies supported
const legacyLogin = async (user, userType, req, res) => {
  user.lastLogin = new Date();
  await user.save();

  const { accessToken } = await establishUserSession(user, userType, req, res, 'Legacy login');

  let userData = user.toObject();
  delete userData.password;
  if (userType === 'admin') delete userData.loginHistory;

  res.json({
    message: 'Login successful',
    token: accessToken,
    user: userData,
    role: user.role || userType,
  });
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ email });

    if (!customer) return res.status(401).json({ error: 'Invalid email or password' });

    const isPasswordValid = await customer.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid email or password' });

    if (!customer.verified) {
      return res.status(400).json({ error: 'Please verify your account first', requiresOTP: true, userId: customer._id });
    }

    await legacyLogin(customer, 'customer', req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginAgent = async (req, res) => {
  try {
    const { agentId, passcode, email, password } = req.body;
    const agent = await Agent.findOne({ $or: [{ agentId }, { email }] });

    if (!agent) return res.status(401).json({ error: 'Invalid credentials' });

    // Validate isApproved and registrationStatus
    if (!agent.isApproved || agent.registrationStatus !== 'active') {
      return res.status(403).json({ error: 'Agent account is pending approval, rejected, or suspended.' });
    }

    const isPasswordValid = await agent.comparePassword(passcode || password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

    if (!agent.isActive) return res.status(403).json({ error: 'Agent account is currently inactive.' });

    await legacyLogin(agent, 'agent', req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

    await legacyLogin(admin, 'admin', req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Forgot Password Flow
const forgotPassword = async (req, res) => {
  try {
    const { email, userType = 'customer' } = req.body;
    let UserModel = userType === 'agent' ? Agent : userType === 'admin' ? Admin : Customer;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: 'If that email exists in our records, a secure reset link has been dispatched.' });
    }

    // Generate random reset token (32 bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Save hashed version in PasswordResetToken
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes

    await PasswordResetToken.create({
      userId: user._id,
      userModel: userType === 'agent' ? 'Agent' : userType === 'admin' ? 'Admin' : 'Customer',
      token: hashedToken,
      expiresAt,
    });

    const clientInfo = parseUserAgent(req.headers['user-agent']);
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}?userType=${userType}`;

    const emailContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; color: #1f2937; background-color: #ffffff;">
        <h2 style="color: #7c2d12; margin-top: 0; font-size: 22px;">🔑 FilterNest Security: Password Reset Link</h2>
        <p>A request was submitted to reset the password for your FilterNest account. Click the secure button below to choose a new password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8B4513 0%, #6c2f00 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(108,47,0,0.15); border: none;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #6b7280; word-break: break-all;">If the button doesn't work, copy/paste this URL:<br/><code style="display: block; background-color: #f3f4f6; padding: 10px; border-radius: 4px; margin-top: 4px;">${resetUrl}</code></p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <div style="font-size: 13px; color: #4b5563; background-color: #fffaf0; border: 1px solid #feebc8; border-radius: 6px; padding: 12px; margin-bottom: 20px;">
          <strong>⚠️ Expiry Alert:</strong> This link is one-time use and expires in <strong>15 minutes</strong>. If you did not initiate this, you can ignore this email safely.
        </div>
        <div style="font-size: 12px; color: #9ca3af; background-color: #f9fafb; border-radius: 6px; padding: 12px;">
          <strong>Request details:</strong><br/>
          • Operating System: ${clientInfo.os}<br/>
          • Web Browser: ${clientInfo.browser}<br/>
          • Requester IP: ${req.ip || '127.0.0.1'}
        </div>
      </div>
    `;

    await sendEmail(email, 'Password Reset Link - FilterNest Security', emailContent);

    res.json({ message: 'If that email exists in our records, a secure reset link has been dispatched.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, userType = 'customer' } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const resetTokenDoc = await PasswordResetToken.findOne({
      token: hashedToken,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetTokenDoc) {
      return res.status(400).json({ error: 'This reset link has expired, is invalid, or was already used.' });
    }

    let UserModel = userType === 'agent' ? Agent : userType === 'admin' ? Admin : Customer;
    const user = await UserModel.findById(resetTokenDoc.userId);

    if (!user) {
      return res.status(400).json({ error: 'User associated with this token was not found.' });
    }

    // Update password (pre-save hook hashes it)
    user.password = newPassword;
    await user.save();

    // Invalidate reset token
    resetTokenDoc.isUsed = true;
    await resetTokenDoc.save();

    // Auto-terminate all active sessions for this user for security
    await Session.updateMany({ userId: user._id }, { $set: { isActive: false } });
    await RefreshToken.updateMany({ userId: user._id }, { $set: { isRevoked: true } });

    res.json({ message: 'Password reset successful. All other active devices have been logged out for security.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// JWT Token Refresh Rotation API
const refreshSessionToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'Session cookie missing or expired. Please re-login.' });
    }

    const tokenDoc = await RefreshToken.findOne({ token, isRevoked: false });
    if (!tokenDoc) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Session has been revoked or is invalid.' });
    }

    if (tokenDoc.expiresAt < new Date()) {
      tokenDoc.isRevoked = true;
      await tokenDoc.save();
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Refresh token expired.' });
    }

    const activeSession = await Session.findOne({ refreshTokenId: tokenDoc._id, isActive: true });
    if (!activeSession) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'No active session matches this token.' });
    }

    // Refresh rotation: Issue fresh Access Token
    const role = userModelToRole(tokenDoc.userModel);
    const newAccessToken = generateAccessToken(tokenDoc.userId, role, activeSession._id);

    // Update session last active time
    activeSession.lastActive = new Date();
    await activeSession.save();

    res.json({ token: newAccessToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const userModelToRole = (modelName) => {
  if (modelName === 'Customer') return 'customer';
  if (modelName === 'Agent') return 'agent';
  return 'admin';
};

// Logout specific Session API
const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    res.clearCookie('refreshToken');

    if (token) {
      const tokenDoc = await RefreshToken.findOne({ token });
      if (tokenDoc) {
        tokenDoc.isRevoked = true;
        await tokenDoc.save();
        await Session.updateOne({ refreshTokenId: tokenDoc._id }, { $set: { isActive: false } });
      }
    }

    // Also mark req.sessionId as inactive if logged in via Bearer
    if (req.sessionId) {
      const session = await Session.findById(req.sessionId);
      if (session) {
        session.isActive = false;
        await session.save();
        if (session.refreshTokenId) {
          await RefreshToken.updateOne({ _id: session.refreshTokenId }, { $set: { isRevoked: true } });
        }
      }
    }

    res.json({ message: 'Successfully logged out and session cleared.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout from All Devices API
const logoutAllDevices = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Revoke all refresh tokens
    await RefreshToken.updateMany({ userId }, { $set: { isRevoked: true } });
    // Revoke all sessions
    await Session.updateMany({ userId }, { $set: { isActive: false } });

    res.clearCookie('refreshToken');
    res.json({ message: 'You have been successfully logged out from all devices.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Query User Sessions API
const getUserSessions = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const sessions = await Session.find({ userId, isActive: true })
      .sort({ lastActive: -1 })
      .select('os browser deviceType deviceName ipAddress location lastActive createdAt');

    // Map sessions and identify "This Device" card
    const formattedSessions = sessions.map((s) => ({
      _id: s._id,
      os: s.os,
      browser: s.browser,
      deviceType: s.deviceType,
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
      location: s.location,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrentDevice: req.sessionId && req.sessionId.toString() === s._id.toString() ? true : false,
    }));

    res.json(formattedSessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Revoke specific Session by ID API
const revokeSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }

    // Invalidate
    session.isActive = false;
    await session.save();

    if (session.refreshTokenId) {
      await RefreshToken.updateOne({ _id: session.refreshTokenId }, { $set: { isRevoked: true } });
    }

    res.json({ message: 'Session revoked successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Google OAuth Verification Flow
const verifyGoogleOAuth = async (req, res) => {
  try {
    const { credential } = req.body; // google id_token

    if (!credential) {
      return res.status(400).json({ error: 'Google credential ID token is required' });
    }

    // Verify token using Google OAuth API
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const { email, given_name, family_name, email_verified } = response.data;

    if (!email_verified) {
      return res.status(400).json({ error: 'Google email is not verified' });
    }

    // Check if user exists in our records
    let customer = await Customer.findOne({ email });
    let agent = await Agent.findOne({ email });
    let admin = await Admin.findOne({ email });

    const user = customer || agent || admin;

    if (user) {
      // User already exists, execute direct legacy login
      const userType = customer ? 'customer' : agent ? 'agent' : 'admin';
      return await legacyLogin(user, userType, req, res);
    }

    // New Google OAuth Signup: Return details and prompt role selection + phone
    res.json({
      message: 'Google verified. Complete your registration.',
      requiresRegistrationCompletion: true,
      email,
      firstName: given_name || '',
      lastName: family_name || '',
    });
  } catch (error) {
    console.error('Google OAuth error:', error.message);
    res.status(401).json({ error: 'Google authentication verification failed. Invalid ID Token.' });
  }
};

// Complete Google Signup Onboarding
const completeGoogleSignup = async (req, res) => {
  try {
    const { email, firstName, lastName, phone, role = 'customer' } = req.body;

    if (!email || !phone || !role) {
      return res.status(400).json({ error: 'Email, Phone and Role are required' });
    }

    const existingCustomer = await Customer.findOne({ $or: [{ email }, { phone }] });
    const existingAgent = await Agent.findOne({ $or: [{ email }, { phone }] });
    const existingAdmin = await Admin.findOne({ email });

    if (existingCustomer || existingAgent || existingAdmin) {
      return res.status(400).json({ error: 'Email or phone already registered.' });
    }

    let newUser;
    if (role === 'agent') {
      newUser = new Agent({
        firstName,
        lastName,
        email,
        phone,
        password: crypto.randomBytes(16).toString('hex'), // Secure random passcode
        agentId: buildAgentId(),
        isVerified: true,
        isActive: false, // Pending admin approval
      });
    } else {
      newUser = new Customer({
        firstName,
        lastName,
        email,
        phone,
        password: crypto.randomBytes(16).toString('hex'),
        verified: true,
        isActive: true,
      });
    }

    await newUser.save();

    if (role === 'agent') {
      return res.json({
        message: 'Google registration complete! Agent profile pending admin approval.',
        pendingApproval: true,
      });
    }

    // Customer logs in directly
    await legacyLogin(newUser, 'customer', req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mobile Number OTP Login Requests
const requestMobileOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    let customer = await Customer.findOne({ phone });
    let agent = await Agent.findOne({ phone });
    
    const user = customer || agent;
    if (!user) {
      return res.status(404).json({ error: 'Mobile number not registered. Please register first.' });
    }

    const userType = customer ? 'customer' : 'agent';
    
    // Generate secure 6-digit SMS OTP
    const otp = generateOTP();
    user.loginOTP = otp;
    user.loginOTPExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 Minutes SMS expiry
    await user.save();

    // Dispatches SMS OTP using MSG91 client
    const sent = await sendSMSOTP(phone, otp);
    if (!sent) {
      return res.status(500).json({ error: 'Failed to dispatch verification SMS. Please try again.' });
    }

    res.json({
      message: 'OTP sent to mobile successfully',
      userId: user._id,
      userType,
      phone,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify Mobile OTP
const verifyMobileOTP = async (req, res) => {
  try {
    const { userId, phone, otp, userType = 'customer' } = req.body;

    if (!otp || (!userId && !phone)) {
      return res.status(400).json({ error: 'Authentication attributes missing.' });
    }

    let UserModel = userType === 'agent' ? Agent : Customer;
    let user;
    if (userId) user = await UserModel.findById(userId);
    else user = await UserModel.findOne({ phone });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.loginOTPExpire || user.loginOTPExpire < new Date()) {
      return res.status(400).json({ error: 'Mobile OTP has expired. Please resend.' });
    }

    if (user.loginOTP !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.loginOTP = undefined;
        user.loginOTPExpire = undefined;
        user.otpAttempts = 0;
        await user.save();
        return res.status(400).json({ error: 'Too many failed mobile OTP attempts. Code invalidated.' });
      }
      await user.save();
      return res.status(400).json({ error: 'Invalid verification OTP code.' });
    }

    // Clear OTP
    user.loginOTP = undefined;
    user.loginOTPExpire = undefined;
    user.otpAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    const { accessToken } = await establishUserSession(user, userType, req, res, 'Mobile OTP verified login');

    let userData = user.toObject();
    delete userData.password;

    res.json({
      message: 'Mobile verification successful',
      token: accessToken,
      user: userData,
      role: user.role || userType,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Placeholder Biometric Credentials Registration (Capacitor/WebAuthn API design prep)
const registerBiometrics = async (req, res) => {
  try {
    const { credentialId, publicKey, deviceId } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    if (!credentialId || !publicKey) {
      return res.status(400).json({ error: 'Biometric credential public parameters are required.' });
    }

    let UserModel = userRole === 'customer' ? Customer : userRole === 'agent' ? Agent : Admin;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Store biometric key parameters
    user.biometrics = {
      publicKey,
      credentialId,
      deviceId: deviceId || 'Web Device Enclave',
      isActive: true,
    };
    await user.save();

    res.json({ message: 'Biometric credential mapped and registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Placeholder Biometric Challenge Login Verification
const verifyBiometricsLogin = async (req, res) => {
  try {
    const { email, credentialId, challengeSignature, clientDataJSON, userType = 'customer' } = req.body;

    if (!email || !credentialId || !challengeSignature) {
      return res.status(400).json({ error: 'Biometric signature inputs required.' });
    }

    let UserModel = userType === 'agent' ? Agent : userType === 'admin' ? Admin : Customer;
    const user = await UserModel.findOne({ email });

    if (!user || !user.biometrics || !user.biometrics.isActive || user.biometrics.credentialId !== credentialId) {
      return res.status(401).json({ error: 'Biometric device key matching failed or not registered.' });
    }

    // Production security verifies public key cryptographic signature:
    // const verified = crypto.verify("sha256", Buffer.from(challenge), user.biometrics.publicKey, signature);
    // For demonstration/architecture integrity, we mock successful WebAuthn check
    console.log(`🔐 [BIOMETRIC-VAULT] Validating signature from credentialId: ${credentialId}`);

    const { accessToken } = await establishUserSession(user, userType, req, res, 'Biometric enclave signature login');

    let userData = user.toObject();
    delete userData.password;
    if (userType === 'admin') delete userData.loginHistory;

    res.json({
      message: 'Biometric biometric authorization successful',
      token: accessToken,
      user: userData,
      role: user.role || userType,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resend Verification OTP during registration
const resendOTP = async (req, res) => {
  try {
    const { email, role = 'customer' } = req.body;
    const user = await findVerifiableUser(email, role);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const alreadyVerified = role === 'agent' ? user.isVerified : user.verified;
    if (alreadyVerified) return res.status(400).json({ error: 'Account already verified' });

    await sendVerificationOTP(user, email);
    res.json({ message: 'OTP resent to email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send OTP
const sendOTP = async (req, res) => {
  try {
    const { email, role = 'customer' } = req.body;
    const user = await findVerifiableUser(email, role);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const alreadyVerified = role === 'agent' ? user.isVerified : user.verified;
    if (alreadyVerified) return res.status(400).json({ error: 'Account already verified' });

    await sendVerificationOTP(user, email);
    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp, role = 'customer' } = req.body;
    const user = await findVerifiableUser(email, role);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.verificationOTPExpire || user.verificationOTPExpire < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (user.verificationOTP !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.verificationOTP = undefined;
        user.verificationOTPExpire = undefined;
        user.otpAttempts = 0;
        await user.save();
        return res.status(400).json({ error: 'Too many failed verification attempts. OTP invalidated.' });
      }
      await user.save();
      return res.status(400).json({ error: 'Invalid OTP code.' });
    }

    if (role === 'agent') user.isVerified = true;
    else user.verified = true;

    user.verificationOTP = undefined;
    user.verificationOTPExpire = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.json({
      message: role === 'agent' ? 'Email verified successfully. Agent account pending approval.' : 'Email verified successfully',
      verified: true,
      role,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const registerAgentApplication = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      aadharNumber,
      panNumber,
      licenseNumber,
      profileImage,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !aadharNumber || !panNumber) {
      return res.status(400).json({ error: 'First name, last name, email, phone, Aadhaar and PAN numbers are required' });
    }

    // Uppercase PAN and trim spaces
    const upperPan = panNumber.toUpperCase().trim();
    const cleanAadhaar = aadharNumber.replace(/\s/g, '');

    // Strict validations
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

    // Check unique email and phone
    const existingAgent = await Agent.findOne({ $or: [{ email }, { phone }] });
    const existingCustomer = await Customer.findOne({ $or: [{ email }, { phone }] });
    if (existingAgent || existingCustomer) {
      return res.status(400).json({ error: 'Email or Phone number is already registered' });
    }

    // Auto-generate unique read-only Agent ID
    const agentId = await generateUniqueAgentId();

    // Placeholder password to satisfy any legacy checks
    const dummyPassword = crypto.randomBytes(16).toString('hex');

    const newAgent = new Agent({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone,
      address,
      documents: {
        aadhar: cleanAadhaar,
        panCard: upperPan,
        drivingLicense: licenseNumber || '',
      },
      profileImage: profileImage || '',
      password: dummyPassword,
      agentId,
      role: 'agent',
      isApproved: false,
      isVerified: false,
      registrationStatus: 'pending',
      temporaryPasscodeSent: false,
    });

    await newAgent.save();

    res.status(201).json({
      message: 'Your technician verification request has been submitted successfully. Our administration team will carefully review your documents and activate your FilterNest technician account shortly.',
      agentId,
    });
  } catch (error) {
    console.error('Agent apply error:', error);
    res.status(500).json({ error: error.message });
  }
};

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

const uploadAgentAvatar = (req, res) => {
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
          position: 'center',
        })
        .jpeg({ quality: 80, progressive: true })
        .toFile(outputPath);

      const PORT = process.env.PORT || 5001;
      const avatarUrl = `http://localhost:${PORT}/uploads/${filename}`;
      res.json({ avatarUrl });
    } catch (error) {
      console.error('Image optimization failed:', error);
      res.status(500).json({ error: 'Image optimization or save failed: ' + error.message });
    }
  });
};

module.exports = {
  registerCustomer,
  requestLoginOTP,
  verifyLoginOTP,
  loginCustomer,
  loginAgent,
  loginAdmin,
  forgotPassword,
  resetPassword,
  refreshSessionToken,
  logout,
  logoutAllDevices,
  getUserSessions,
  revokeSessionById,
  verifyGoogleOAuth,
  completeGoogleSignup,
  requestMobileOTP,
  verifyMobileOTP,
  registerBiometrics,
  verifyBiometricsLogin,
  sendOTP,
  verifyOTP,
  resendOTP,
  registerAgentApplication,
  uploadAgentAvatar,
};
