const cron = require('node-cron');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { sendEmail, maintenanceReminderEmail } = require('./emailService');
const Customer = require('../models/Customer');

// Run daily at 9 AM
const startMaintenanceReminderScheduler = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running maintenance reminder check...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all upcoming maintenance schedules
      const schedules = await MaintenanceSchedule.find({
        nextServiceDate: { $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) },
        reminderSent: false,
        status: { $ne: 'completed' },
      }).populate('customer');

      for (const schedule of schedules) {
        const customer = schedule.customer;
        
        // Send email reminder
        if (customer.email) {
          const emailContent = maintenanceReminderEmail(
            customer.firstName,
            schedule.scheduleType,
            schedule.nextServiceDate
          );
          await sendEmail(
            customer.email,
            `Maintenance Reminder: ${schedule.scheduleType}`,
            emailContent
          );
        }

        // Create in-app notification
        await Notification.create({
          recipient: customer._id,
          recipientModel: 'Customer',
          type: 'reminder',
          title: 'Maintenance Reminder',
          message: `Your ${schedule.scheduleType} service is due on ${new Date(schedule.nextServiceDate).toLocaleDateString()}. Please book your appointment.`,
          channels: customer.preferences?.smsNotifications ? { email: true, sms: true } : { email: true },
          relatedMaintenance: schedule._id,
          sentStatus: { inApp: true, email: true },
        });

        // Mark reminder as sent
        schedule.reminderSent = true;
        schedule.reminderSentAt = new Date();
        await schedule.save();
      }

      console.log(`Sent ${schedules.length} maintenance reminders`);
    } catch (error) {
      console.error('Error in maintenance reminder scheduler:', error);
    }
  });
};

// Create maintenance schedules after service completion
const createMaintenanceSchedules = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId).populate('customer');

    if (!booking || booking.status !== 'completed') {
      return;
    }

    // Create pre-filter maintenance schedule (3 months)
    const prefilterNextDate = new Date();
    prefilterNextDate.setMonth(prefilterNextDate.getMonth() + 3);

    await MaintenanceSchedule.create({
      customer: booking.customer._id,
      scheduleType: 'prefilter',
      lastServiceDate: booking.completedAt,
      nextServiceDate: prefilterNextDate,
      frequency: 'quarterly',
      relatedBooking: bookingId,
    });

    // Create membrane maintenance schedule (6 months)
    const membraneNextDate = new Date();
    membraneNextDate.setMonth(membraneNextDate.getMonth() + 6);

    await MaintenanceSchedule.create({
      customer: booking.customer._id,
      scheduleType: 'membrane',
      lastServiceDate: booking.completedAt,
      nextServiceDate: membraneNextDate,
      frequency: 'biannual',
      relatedBooking: bookingId,
    });

    console.log('Maintenance schedules created for booking:', bookingId);
  } catch (error) {
    console.error('Error creating maintenance schedules:', error);
  }
};

module.exports = {
  startMaintenanceReminderScheduler,
  createMaintenanceSchedules,
};
