const nodemailer = require('nodemailer');

// =========================
// SMTP Configuration with timeout
// =========================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports (587 uses STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 5000, // 5 seconds timeout
  socketTimeout: 5000, // 5 seconds timeout
  pool: {
    maxConnections: 1,
    maxMessages: 5,
    rateDelta: 2000,
    rateLimit: 5,
  },
});

// Verify SMTP connection with timeout
transporter.verify((error, success) => {
  if (error) {
    console.log('⚠️ SMTP Verification Error:', error.code || error.message);
  } else {
    console.log('✅ SMTP Server Ready');
  }
});

// =========================
// SEND EMAIL FUNCTION (Non-blocking with timeout)
// =========================
const sendEmail = async (to, subject, html) => {
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Email timeout - took too long')), 4000);
  });

  try {
    const emailPromise = transporter.sendMail({
      from: `"FilterNest Service" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });

    // Race between email and timeout
    const info = await Promise.race([emailPromise, timeoutPromise]);
    console.log('✅ Email sent:', info.response);
    return true;

  } catch (error) {
    console.warn('⚠️ Email sending failed (non-blocking):', error.message);
    
    // Log more details in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Email error details:', {
        to,
        subject,
        code: error.code,
        message: error.message,
      });
    }
    
    // Don't throw - return false so email failure doesn't break registration
    // Send to background job queue if needed
    if (process.env.NODE_ENV === 'production') {
      console.warn(`📧 Email queue: Failed to send OTP to ${to}. User can request OTP manually.`);
    }
    return false;
  }
};
  }
};

// =========================
// OTP EMAIL
// =========================
const sendOTPEmail = async (to, otp) => {
  return await sendEmail(
    to,
    'FilterNest Login OTP',
    `
      <div style="font-family: Arial; padding: 20px;">
        <h2 style="color:#b45309;">
          FilterNest Verification
        </h2>

        <p>Your OTP code is:</p>

        <h1 style="
          letter-spacing: 6px;
          font-size: 36px;
          color: #b45309;
        ">
          ${otp}
        </h1>

        <p>
          This OTP expires in 10 minutes.
        </p>

        <br/>

        <p>
          Thank you,<br/>
          FilterNest Service Team
        </p>
      </div>
    `
  );
};

// =========================
// BOOKING CONFIRMATION
// =========================
const bookingConfirmationEmail = (
  customerName,
  bookingDetails
) => `
  <div style="font-family: Arial; padding: 20px;">
    <h2>Booking Confirmation</h2>

    <p>Hi ${customerName},</p>

    <p>
      Your service booking has been confirmed.
    </p>

    <p><strong>Booking Details:</strong></p>

    <ul>
      <li>
        Service Type:
        ${bookingDetails.serviceType}
      </li>

      <li>
        Date:
        ${new Date(
          bookingDetails.bookingDate
        ).toLocaleDateString()}
      </li>

      <li>
        Time:
        ${
          bookingDetails.preferredTimeSlot?.start ||
          'To be confirmed'
        }
      </li>

      <li>
        Address:
        ${bookingDetails.address}
      </li>
    </ul>

    <p>
      Thank you for choosing FilterNest!
    </p>
  </div>
`;

// =========================
// MAINTENANCE REMINDER
// =========================
const maintenanceReminderEmail = (
  customerName,
  serviceType,
  dueDate
) => `
  <div style="font-family: Arial; padding: 20px;">
    <h2>Maintenance Reminder</h2>

    <p>Hi ${customerName},</p>

    <p>
      This is a reminder that your
      <strong>${serviceType}</strong>
      service is due on
      <strong>
        ${new Date(dueDate).toLocaleDateString()}
      </strong>.
    </p>

    <p>
      Please book your service appointment
      at your earliest convenience.
    </p>

    <p>
      Best regards,<br/>
      FilterNest Service Team
    </p>
  </div>
`;

// =========================
// COMPLETION NOTIFICATION
// =========================
const completionNotificationEmail = (
  customerName,
  bookingDetails
) => `
  <div style="font-family: Arial; padding: 20px;">
    <h2>Service Completed</h2>

    <p>Hi ${customerName},</p>

    <p>
      Your service has been successfully completed.
    </p>

    <p><strong>Service Details:</strong></p>

    <ul>
      <li>
        Service Type:
        ${bookingDetails.serviceType}
      </li>

      <li>
        Completed Date:
        ${new Date(
          bookingDetails.completedAt
        ).toLocaleDateString()}
      </li>

      <li>
        Total Cost:
        ₹${bookingDetails.cost?.totalCost || 0}
      </li>
    </ul>

    <p>
      Thank you for using FilterNest!
    </p>
  </div>
`;

module.exports = {
  sendEmail,
  sendOTPEmail,
  bookingConfirmationEmail,
  maintenanceReminderEmail,
  completionNotificationEmail,
};