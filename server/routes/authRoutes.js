const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateCustomerRegistration, validateLogin, validateAgentLogin } = require('../middleware/validation');
const { authRateLimiter, forgotPasswordRateLimiter } = require('../middleware/securityMiddleware');

// Public routes - Registration
router.post('/register/customer', validateCustomerRegistration, authController.registerCustomer);

// Public routes - Technician Application Portal
router.post('/agent/apply', authController.registerAgentApplication);
router.post('/agent/upload-avatar', authController.uploadAgentAvatar);

// Public routes - OTP-based Login (Two-step process)
router.post('/login/request-otp', authRateLimiter, validateLogin, authController.requestLoginOTP);
router.post('/login/verify-otp', authRateLimiter, authController.verifyLoginOTP);

// Public routes - Legacy Logins
router.post('/login/customer', authRateLimiter, validateLogin, authController.loginCustomer);
router.post('/login/agent', authRateLimiter, validateAgentLogin, authController.loginAgent);
router.post('/login/admin', authRateLimiter, validateLogin, authController.loginAdmin);

// Public routes - Email Verification OTP
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Public routes - Password Reset
router.post('/forgot-password', forgotPasswordRateLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Session Refresh Token Rotation Route
router.post('/refresh', authController.refreshSessionToken);

// OAuth Google Logins
router.post('/google', authRateLimiter, authController.verifyGoogleOAuth);
router.post('/google/complete', authRateLimiter, authController.completeGoogleSignup);

// Mobile OTP Logins
router.post('/login/mobile/request', authRateLimiter, authController.requestMobileOTP);
router.post('/login/mobile/verify', authRateLimiter, authController.verifyMobileOTP);

// Placeholder Biometric logins
router.post('/biometric/login', authRateLimiter, authController.verifyBiometricsLogin);

// =====================================
// AUTHENTICATED SECURITY ROUTES
// =====================================

// Logout routes
router.post('/logout', auth, authController.logout);
router.post('/logout-all', auth, authController.logoutAllDevices);

// User Active Sessions Management
router.get('/sessions', auth, authController.getUserSessions);
router.delete('/sessions/:sessionId', auth, authController.revokeSessionById);

// Biometric Enclave Public Key registration
router.post('/biometric/register', auth, authController.registerBiometrics);

module.exports = router;
