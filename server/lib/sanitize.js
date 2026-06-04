// Mongoose used schema `toJSON` transforms to strip secrets from user docs
// before they were serialized. Prisma returns plain rows including those
// columns, so we strip them explicitly before sending user objects to clients.

const SENSITIVE_FIELDS = [
  'password',
  'resetPasswordToken',
  'resetPasswordTokenExpire',
  'verificationToken',
  'verificationTokenExpire',
  'verificationOTP',
  'verificationOTPExpire',
  'loginOTP',
  'loginOTPExpire',
  'otpAttempts',
];

/**
 * Deeply remove sensitive fields from an object/array (including nested user
 * records such as booking.customer or invoice.agent). Dates and other
 * non-plain objects are passed through untouched. Safe on null/undefined.
 */
function stripSensitive(input) {
  if (Array.isArray(input)) {
    return input.map(stripSensitive);
  }
  if (!input || typeof input !== 'object' || input instanceof Date) {
    return input;
  }
  const clone = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_FIELDS.includes(key)) continue;
    clone[key] = stripSensitive(value);
  }
  return clone;
}

module.exports = { stripSensitive, SENSITIVE_FIELDS };
