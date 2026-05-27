const nodemailer = require('nodemailer');

// =========================
console.log(process.env.SMTP_HOST);
console.log(process.env.SMTP_PORT);
console.log(process.env.SMTP_USER);
// =========================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP ERROR:', error);
  } else {
    console.log('✅ SMTP Server Ready');
  }
});

// =========================
// SEND EMAIL FUNCTION
// =========================
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"FilterNest Service" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent:', info.response);

    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);

    return false;
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