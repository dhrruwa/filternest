const crypto = require('crypto');

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  return otp;
};

/**
 * Get OTP expiration time (10 minutes from now)
 */
const getOTPExpiration = () => {
  return new Date(Date.now() + 10 * 60 * 1000);
};

module.exports = {
  generateOTP,
  getOTPExpiration,
};
