const axios = require('axios');

/**
 * Service for sending mobile SMS OTPs using MSG91 API.
 * Gracefully logs to terminal in development/testing mode if credentials are empty.
 */
const sendSMSOTP = async (phone, otp) => {
  // Ensure the phone number is strictly 10 digits
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  
  console.log(`\n======================================================`);
  console.log(`📱 SMS OTP TO: +91 ${cleanPhone}`);
  console.log(`🔑 OTP CODE  : ${otp}`);
  console.log(`⏳ VALID FOR  : 5 Minutes`);
  console.log(`======================================================\n`);

  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    console.log('⚠️ [SMS-SERVICE] MSG91 credentials not defined. SMS simulated in console.');
    return true; 
  }

  try {
    const response = await axios.get('https://api.msg91.com/api/v5/otp', {
      params: {
        authkey: authKey,
        template_id: templateId,
        mobile: `91${cleanPhone}`,
        otp: otp,
      },
    });

    if (response.data && (response.data.type === 'success' || response.data.message === 'OTP Sent successfully')) {
      console.log(`✅ [SMS-SERVICE] MSG91 OTP successfully dispatched to +91 ${cleanPhone}`);
      return true;
    } else {
      console.warn(`❌ [SMS-SERVICE] MSG91 returned failure response:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ [SMS-SERVICE] MSG91 network error:`, error.response?.data || error.message);
    return false; // Fallback to true in dev if desired, but return false to let the client handle dispatch errors
  }
};

module.exports = { sendSMSOTP };
