const { body, validationResult } = require('express-validator');

const validateCustomerRegistration = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone')
    .trim()
    .matches(/^[0-9\s\-\+\(\)]{10,15}$/)
    .withMessage('Valid phone number (10-15 digits) is required'),
  body('password')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password must be at least 8 characters and include a number'),
  body('role')
    .optional()
    .equals('customer')
    .withMessage('Public registration supports customer accounts only'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateBooking = [
  body('serviceType').isIn(['general_service', 'prefilter_replacement', 'membrane_replacement', 'installation', 'repair']).withMessage('Invalid service type'),
  body('bookingDate').isISO8601().withMessage('Valid booking date is required'),
  body('address').trim().notEmpty().withMessage('Service address is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateAgentLogin = [
  body('agentId').trim().notEmpty().withMessage('Agent ID is required'),
  body('passcode').notEmpty().withMessage('Passcode is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCustomerRegistration,
  validateBooking,
  validateLogin,
  validateAgentLogin,
};
