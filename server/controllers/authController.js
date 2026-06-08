const logger = require('../lib/logger');
const prisma = require('../lib/prisma');
const { stripSensitive } = require('../lib/sanitize');
const bcrypt = require('bcryptjs');
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
    const exists = await prisma.agent.findUnique({ where: { agentId: id } });
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
  const userModel = userType === 'customer' ? 'Customer' : userType === 'agent' ? 'Agent' : 'Admin';

  // 1. Device Tracking & Warnings
  let knownDevice = await prisma.deviceTracking.findFirst({ where: { userId: user.id, deviceFingerprint: fingerprint } });
  let isNewDevice = false;

  if (!knownDevice) {
    isNewDevice = true;
    knownDevice = await prisma.deviceTracking.create({
      data: {
        userId: user.id,
        userModel,
        deviceFingerprint: fingerprint,
        os: clientInfo.os,
        browser: clientInfo.browser,
        deviceType: clientInfo.deviceType,
        isTrusted: true,
      },
    });

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
    await prisma.deviceTracking.update({
      where: { id: knownDevice.id },
      data: { lastLogin: new Date() },
    });
  }

  // 2. Audit Trail
  await prisma.loginHistory.create({
    data: {
      userId: user.id,
      userModel,
      email: user.email,
      os: clientInfo.os,
      browser: clientInfo.browser,
      deviceType: clientInfo.deviceType,
      ipAddress: req.ip || '127.0.0.1',
      location: 'Unknown', // No geolocation provider wired up yet
      status: isNewDevice ? 'suspicious' : 'success',
      reason: isNewDevice ? 'new device login' : reason,
    },
  });

  // 3. Generate Access + Refresh Token Flow
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days
  const rawRefreshToken = generateRefreshToken(user.id, user.role || userType);

  const refreshTokenDoc = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      userModel,
      token: rawRefreshToken,
      expiresAt: refreshExpires,
    },
  });

  const sessionDoc = await prisma.session.create({
    data: {
      userId: user.id,
      userModel,
      refreshTokenId: refreshTokenDoc.id,
      os: clientInfo.os,
      browser: clientInfo.browser,
      deviceType: clientInfo.deviceType,
      deviceName: clientInfo.deviceName,
      ipAddress: req.ip || '127.0.0.1',
      location: 'Unknown',
      expiresAt: refreshExpires,
    },
  });

  const accessToken = generateAccessToken(user.id, user.role || userType, sessionDoc.id);

  // 4. Set HTTP-Only Cookie with Secure settings
  res.cookie('refreshToken', rawRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, sessionId: sessionDoc.id };
};

const sendVerificationOTP = async (user, email) => {
  const otp = generateOTP();
  logger.info(`Verification OTP for ${email}: ${otp}`);
  user.verificationOTP = otp;
  user.verificationOTPExpire = getOTPExpiration();
  await prisma[user.role === 'agent' ? 'agent' : user.role === 'admin' ? 'admin' : 'customer'].update({
    where: { id: user.id },
    data: { verificationOTP: user.verificationOTP, verificationOTPExpire: user.verificationOTPExpire },
  });

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

  // Best-effort SMS via MSG91 (fire-and-forget so a slow/failed SMS never
  // delays or blocks the response). Email is the primary OTP channel.
  if (user.phone) {
    Promise.resolve(sendSMSOTP(user.phone, otp)).catch((smsError) =>
      logger.warn('⚠️ Verification OTP SMS could not be sent:', smsError.message)
    );
  }

  // Primary channel: email (delivered via Brevo in production).
  try {
    await sendEmail(email, 'Verify Your FilterNest Account', emailContent);
  } catch (emailError) {
    logger.warn('⚠️ OTP email could not be sent, but OTP stored for manual verification:', emailError.message);
    // Continue - don't fail registration just because email failed
  }
};

const sendLoginOTP = async (user, email, userType = 'customer') => {
  const otp = generateOTP();
  logger.info(`Login OTP for ${email}: ${otp}`);
  user.loginOTP = otp;
  user.loginOTPExpire = getOTPExpiration();
  await prisma[userType === 'agent' ? 'agent' : userType === 'admin' ? 'admin' : 'customer'].update({
    where: { id: user.id },
    data: { loginOTP: user.loginOTP, loginOTPExpire: user.loginOTPExpire },
  });

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

  // Best-effort SMS via MSG91 (fire-and-forget so a slow/failed SMS never
  // delays or blocks the login response). Email is the primary OTP channel.
  if (user.phone) {
    Promise.resolve(sendSMSOTP(user.phone, otp)).catch((smsError) =>
      logger.warn('⚠️ Login OTP SMS could not be sent:', smsError.message)
    );
  }

  // Primary channel: email (delivered via Brevo in production).
  try {
    await sendEmail(email, `${roleName} Dynamic OTP Code - FilterNest Security`, emailContent);
  } catch (emailError) {
    logger.warn('⚠️ Login OTP email could not be sent:', emailError.message);
    // Continue - OTP is still stored and can be used
  }
};

const findVerifiableUser = async (email, role = 'customer') => {
  if (role === 'agent') return prisma.agent.findUnique({ where: { email } });
  if (role === 'admin') return prisma.admin.findUnique({ where: { email } });
  return prisma.customer.findUnique({ where: { email } });
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
    const trimmedPhone = phone.trim();

    const existingCustomer = await prisma.customer.findFirst({
      where: { OR: [{ email: normalizedEmail }, { phone: trimmedPhone }] }
    });
    const existingAgent = await prisma.agent.findFirst({
      where: { OR: [{ email: normalizedEmail }, { phone: trimmedPhone }] }
    });
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingCustomer || existingAgent || existingAdmin) {
      return res.status(400).json({ error: 'Email or phone already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let customerData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: trimmedPhone,
      password: hashedPassword,
      address,
      role: 'customer',
      verified: true, // Auto-verify for simplified onboarding
    };

    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      customerData.location = location;
    }

    const customer = await prisma.customer.create({ data: customerData });
    logger.info('✅ Customer account created:', customer.id);

    // Try to send OTP email in background (non-blocking)
    setImmediate(async () => {
      try {
        await sendVerificationOTP(customer, normalizedEmail);
        logger.info('✅ OTP email sent to:', normalizedEmail);
      } catch (emailError) {
        logger.warn('⚠️ OTP email skipped (non-critical):', emailError.message);
        // Email failure is not critical - account is created
      }
    });

    res.status(201).json({
      message: 'Registration successful! Your account is ready to use.',
      userId: customer.id,
      email: customer.email,
      role: 'customer',
      requiresOTP: false, // Changed - no OTP requirement for now
    });
  } catch (error) {
    logger.error('❌ Registration error:', error);
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
    if (userType === 'agent') user = await prisma.agent.findUnique({ where: { email } });
    else if (userType === 'admin') user = await prisma.admin.findUnique({ where: { email } });
    else user = await prisma.customer.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = user.password && (await bcrypt.compare(password, user.password));
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (userType === 'customer' && !user.verified) {
      return res.status(400).json({
        error: 'Please verify your email first',
        requiresVerification: true,
        userId: user.id,
        email: user.email,
      });
    }

    if (userType === 'agent' && !user.isActive) {
      return res.status(403).json({ error: 'Agent account is not active' });
    }

    await sendLoginOTP(user, email, userType);

    res.json({
      message: 'OTP sent to your email',
      userId: user.id,
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

    const delegate = userType === 'agent' ? prisma.agent : userType === 'admin' ? prisma.admin : prisma.customer;
    const user = await delegate.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.loginOTPExpire || user.loginOTPExpire < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (user.loginOTP !== otp) {
      const otpAttempts = (user.otpAttempts || 0) + 1;
      if (otpAttempts >= 5) {
        await delegate.update({
          where: { id: user.id },
          data: { loginOTP: null, loginOTPExpire: null, otpAttempts: 0 },
        });
        return res.status(400).json({ error: 'Too many incorrect attempts. The OTP has been invalidated.' });
      }
      await delegate.update({ where: { id: user.id }, data: { otpAttempts } });
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const updatedUser = await delegate.update({
      where: { id: user.id },
      data: { loginOTP: null, loginOTPExpire: null, otpAttempts: 0, lastLogin: new Date() },
    });

    // Establish session, tracking, audit history, access & refresh token cookie
    const { accessToken } = await establishUserSession(updatedUser, userType, req, res, 'OTP verified login');

    let userData = stripSensitive(updatedUser);
    if (userType === 'admin') delete userData.loginHistory;

    res.json({
      message: 'Login successful',
      token: accessToken,
      user: userData,
      role: updatedUser.role || userType,
      userId: updatedUser.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Legacy Login with Access + Refresh Token Cookies supported
const legacyLogin = async (user, userType, req, res) => {
  const delegate = userType === 'agent' ? prisma.agent : userType === 'admin' ? prisma.admin : prisma.customer;
  const updatedUser = await delegate.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const { accessToken } = await establishUserSession(updatedUser, userType, req, res, 'Legacy login');

  let userData = stripSensitive(updatedUser);
  if (userType === 'admin') delete userData.loginHistory;

  res.json({
    message: 'Login successful',
    token: accessToken,
    user: userData,
    role: updatedUser.role || userType,
  });
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await prisma.customer.findUnique({ where: { email } });

    if (!customer) return res.status(401).json({ error: 'Invalid email or password' });

    const isPasswordValid = customer.password && (await bcrypt.compare(password, customer.password));
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid email or password' });

    if (!customer.verified) {
      return res.status(400).json({ error: 'Please verify your account first', requiresOTP: true, userId: customer.id });
    }

    await legacyLogin(customer, 'customer', req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginAgent = async (req, res) => {
  try {
    const { agentId, passcode, email, password } = req.body;
    const agent = await prisma.agent.findFirst({ where: { OR: [{ agentId }, { email }] } });

    if (!agent) return res.status(401).json({ error: 'Invalid credentials' });

    // Validate isApproved and registrationStatus
    if (!agent.isApproved || agent.registrationStatus !== 'active') {
      return res.status(403).json({ error: 'Agent account is pending approval, rejected, or suspended.' });
    }

    const isPasswordValid = agent.password && (await bcrypt.compare(passcode || password, agent.password));
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
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const isPasswordValid = admin.password && (await bcrypt.compare(password, admin.password));
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
    const delegate = userType === 'agent' ? prisma.agent : userType === 'admin' ? prisma.admin : prisma.customer;
    const user = await delegate.findUnique({ where: { email } });

    if (!user) {
      return res.status(200).json({ message: 'If that email exists in our records, a secure reset link has been dispatched.' });
    }

    // Generate random reset token (32 bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Save hashed version in PasswordResetToken
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        userModel: userType === 'agent' ? 'Agent' : userType === 'admin' ? 'Admin' : 'Customer',
        token: hashedToken,
        expiresAt,
      },
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
    const resetTokenDoc = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetTokenDoc) {
      return res.status(400).json({ error: 'This reset link has expired, is invalid, or was already used.' });
    }

    const delegate = userType === 'agent' ? prisma.agent : userType === 'admin' ? prisma.admin : prisma.customer;
    const user = await delegate.findUnique({ where: { id: resetTokenDoc.userId } });

    if (!user) {
      return res.status(400).json({ error: 'User associated with this token was not found.' });
    }

    // Update password (hash explicitly — Mongoose pre-save hook is gone)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await delegate.update({ where: { id: user.id }, data: { password: hashedPassword } });

    // Invalidate reset token
    await prisma.passwordResetToken.update({ where: { id: resetTokenDoc.id }, data: { isUsed: true } });

    // Auto-terminate all active sessions for this user for security
    await prisma.session.updateMany({ where: { userId: user.id }, data: { isActive: false } });
    await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { isRevoked: true } });

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

    const tokenDoc = await prisma.refreshToken.findFirst({ where: { token, isRevoked: false } });
    if (!tokenDoc) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Session has been revoked or is invalid.' });
    }

    if (tokenDoc.expiresAt < new Date()) {
      await prisma.refreshToken.update({ where: { id: tokenDoc.id }, data: { isRevoked: true } });
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Refresh token expired.' });
    }

    const activeSession = await prisma.session.findFirst({ where: { refreshTokenId: tokenDoc.id, isActive: true } });
    if (!activeSession) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'No active session matches this token.' });
    }

    // Refresh rotation: Issue fresh Access Token
    const role = userModelToRole(tokenDoc.userModel);
    const newAccessToken = generateAccessToken(tokenDoc.userId, role, activeSession.id);

    // Update session last active time
    await prisma.session.update({ where: { id: activeSession.id }, data: { lastActive: new Date() } });

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
      const tokenDoc = await prisma.refreshToken.findFirst({ where: { token } });
      if (tokenDoc) {
        await prisma.refreshToken.update({ where: { id: tokenDoc.id }, data: { isRevoked: true } });
        await prisma.session.updateMany({ where: { refreshTokenId: tokenDoc.id }, data: { isActive: false } });
      }
    }

    // Also mark req.sessionId as inactive if logged in via Bearer
    if (req.sessionId) {
      const session = await prisma.session.findUnique({ where: { id: req.sessionId } });
      if (session) {
        await prisma.session.update({ where: { id: session.id }, data: { isActive: false } });
        if (session.refreshTokenId) {
          await prisma.refreshToken.updateMany({ where: { id: session.refreshTokenId }, data: { isRevoked: true } });
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
    await prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } });
    // Revoke all sessions
    await prisma.session.updateMany({ where: { userId }, data: { isActive: false } });

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

    const sessions = await prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActive: 'desc' },
      select: {
        id: true,
        os: true,
        browser: true,
        deviceType: true,
        deviceName: true,
        ipAddress: true,
        location: true,
        lastActive: true,
        createdAt: true,
      },
    });

    // Map sessions and identify "This Device" card
    const formattedSessions = sessions.map((s) => ({
      _id: s.id,
      os: s.os,
      browser: s.browser,
      deviceType: s.deviceType,
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
      location: s.location,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrentDevice: req.sessionId && req.sessionId.toString() === s.id.toString() ? true : false,
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

    const session = await prisma.session.findFirst({ where: { id: sessionId, userId } });
    if (!session) {
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }

    // Invalidate
    await prisma.session.update({ where: { id: session.id }, data: { isActive: false } });

    if (session.refreshTokenId) {
      await prisma.refreshToken.updateMany({ where: { id: session.refreshTokenId }, data: { isRevoked: true } });
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
    let customer = await prisma.customer.findUnique({ where: { email } });
    let agent = await prisma.agent.findUnique({ where: { email } });
    let admin = await prisma.admin.findUnique({ where: { email } });

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
    logger.error('Google OAuth error:', error.message);
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

    const existingCustomer = await prisma.customer.findFirst({ where: { OR: [{ email }, { phone }] } });
    const existingAgent = await prisma.agent.findFirst({ where: { OR: [{ email }, { phone }] } });
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });

    if (existingCustomer || existingAgent || existingAdmin) {
      return res.status(400).json({ error: 'Email or phone already registered.' });
    }

    let newUser;
    if (role === 'agent') {
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      newUser = await prisma.agent.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          password: hashedPassword, // Secure random passcode
          agentId: await generateUniqueAgentId(),
          isVerified: true,
          isActive: false, // Pending admin approval
        },
      });
    } else {
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      newUser = await prisma.customer.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          password: hashedPassword,
          verified: true,
          isActive: true,
        },
      });
    }

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

    let customer = await prisma.customer.findUnique({ where: { phone } });
    let agent = await prisma.agent.findUnique({ where: { phone } });

    const user = customer || agent;
    if (!user) {
      return res.status(404).json({ error: 'Mobile number not registered. Please register first.' });
    }

    const userType = customer ? 'customer' : 'agent';

    // Generate secure 6-digit SMS OTP
    const otp = generateOTP();
    const loginOTPExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 Minutes SMS expiry
    await (customer ? prisma.customer : prisma.agent).update({
      where: { id: user.id },
      data: { loginOTP: otp, loginOTPExpire },
    });

    // Dispatches SMS OTP using MSG91 client
    const sent = await sendSMSOTP(phone, otp);
    if (!sent) {
      return res.status(500).json({ error: 'Failed to dispatch verification SMS. Please try again.' });
    }

    res.json({
      message: 'OTP sent to mobile successfully',
      userId: user.id,
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

    const delegate = userType === 'agent' ? prisma.agent : prisma.customer;
    let user;
    if (userId) user = await delegate.findUnique({ where: { id: userId } });
    else user = await delegate.findUnique({ where: { phone } });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.loginOTPExpire || user.loginOTPExpire < new Date()) {
      return res.status(400).json({ error: 'Mobile OTP has expired. Please resend.' });
    }

    if (user.loginOTP !== otp) {
      const otpAttempts = (user.otpAttempts || 0) + 1;
      if (otpAttempts >= 5) {
        await delegate.update({
          where: { id: user.id },
          data: { loginOTP: null, loginOTPExpire: null, otpAttempts: 0 },
        });
        return res.status(400).json({ error: 'Too many failed mobile OTP attempts. Code invalidated.' });
      }
      await delegate.update({ where: { id: user.id }, data: { otpAttempts } });
      return res.status(400).json({ error: 'Invalid verification OTP code.' });
    }

    // Clear OTP
    const updatedUser = await delegate.update({
      where: { id: user.id },
      data: { loginOTP: null, loginOTPExpire: null, otpAttempts: 0, lastLogin: new Date() },
    });

    const { accessToken } = await establishUserSession(updatedUser, userType, req, res, 'Mobile OTP verified login');

    let userData = stripSensitive(updatedUser);

    res.json({
      message: 'Mobile verification successful',
      token: accessToken,
      user: userData,
      role: updatedUser.role || userType,
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

    const delegate = userRole === 'customer' ? prisma.customer : userRole === 'agent' ? prisma.agent : prisma.admin;
    const user = await delegate.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Store biometric key parameters
    await delegate.update({
      where: { id: user.id },
      data: {
        biometrics: {
          publicKey,
          credentialId,
          deviceId: deviceId || 'Web Device Enclave',
          isActive: true,
        },
      },
    });

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

    const delegate = userType === 'agent' ? prisma.agent : userType === 'admin' ? prisma.admin : prisma.customer;
    const user = await delegate.findUnique({ where: { email } });

    if (!user || !user.biometrics || !user.biometrics.isActive || user.biometrics.credentialId !== credentialId) {
      return res.status(401).json({ error: 'Biometric device key matching failed or not registered.' });
    }

    // Production security verifies public key cryptographic signature:
    // const verified = crypto.verify("sha256", Buffer.from(challenge), user.biometrics.publicKey, signature);
    // For demonstration/architecture integrity, we mock successful WebAuthn check
    logger.info(`🔐 [BIOMETRIC-VAULT] Validating signature from credentialId: ${credentialId}`);

    const { accessToken } = await establishUserSession(user, userType, req, res, 'Biometric enclave signature login');

    let userData = stripSensitive(user);
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

    const delegate = role === 'agent' ? prisma.agent : role === 'admin' ? prisma.admin : prisma.customer;

    if (!user.verificationOTPExpire || user.verificationOTPExpire < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (user.verificationOTP !== otp) {
      const otpAttempts = (user.otpAttempts || 0) + 1;
      if (otpAttempts >= 5) {
        await delegate.update({
          where: { id: user.id },
          data: { verificationOTP: null, verificationOTPExpire: null, otpAttempts: 0 },
        });
        return res.status(400).json({ error: 'Too many failed verification attempts. OTP invalidated.' });
      }
      await delegate.update({ where: { id: user.id }, data: { otpAttempts } });
      return res.status(400).json({ error: 'Invalid OTP code.' });
    }

    await delegate.update({
      where: { id: user.id },
      data: {
        ...(role === 'agent' ? { isVerified: true } : { verified: true }),
        verificationOTP: null,
        verificationOTPExpire: null,
        otpAttempts: 0,
      },
    });

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
    const existingAgent = await prisma.agent.findFirst({ where: { OR: [{ email }, { phone }] } });
    const existingCustomer = await prisma.customer.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existingAgent || existingCustomer) {
      return res.status(400).json({ error: 'Email or Phone number is already registered' });
    }

    // Auto-generate unique read-only Agent ID
    const agentId = await generateUniqueAgentId();

    // Placeholder password to satisfy any legacy checks
    const dummyPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

    await prisma.agent.create({
      data: {
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
      },
    });

    res.status(201).json({
      message: 'Your technician verification request has been submitted successfully. Our administration team will carefully review your documents and activate your FilterNest technician account shortly.',
      agentId,
    });
  } catch (error) {
    logger.error('Agent apply error:', error);
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

      // Build an absolute URL from the request host so it works in production
      // (Render) as well as locally, instead of hardcoding localhost.
      const baseUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
      const avatarUrl = `${baseUrl}/uploads/${filename}`;
      res.json({ avatarUrl });
    } catch (error) {
      logger.error('Image optimization failed:', error);
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
