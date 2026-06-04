const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { sendEmail, maintenanceReminderEmail } = require('./emailService');

// Run daily at 9 AM
const startMaintenanceReminderScheduler = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running maintenance reminder check...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all upcoming maintenance schedules
      const schedules = await prisma.maintenanceSchedule.findMany({
        where: {
          nextServiceDate: { lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) },
          reminderSent: false,
          status: { not: 'completed' },
        },
        include: { customer: true },
      });

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
        await prisma.notification.create({
          data: {
            recipient: customer.id,
            recipientModel: 'Customer',
            type: 'reminder',
            title: 'Maintenance Reminder',
            message: `Your ${schedule.scheduleType} service is due on ${new Date(schedule.nextServiceDate).toLocaleDateString()}. Please book your appointment.`,
            channels: customer.preferences?.smsNotifications ? { email: true, sms: true } : { email: true },
            relatedMaintenanceId: schedule.id,
            sentStatus: { inApp: true, email: true },
          },
        });

        // Mark reminder as sent
        await prisma.maintenanceSchedule.update({
          where: { id: schedule.id },
          data: { reminderSent: true, reminderSentAt: new Date() },
        });
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
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    });

    if (!booking || booking.status !== 'completed') {
      return;
    }

    // Create pre-filter maintenance schedule (3 months)
    const prefilterNextDate = new Date();
    prefilterNextDate.setMonth(prefilterNextDate.getMonth() + 3);

    await prisma.maintenanceSchedule.create({
      data: {
        customerId: booking.customer.id,
        scheduleType: 'prefilter',
        lastServiceDate: booking.completedAt,
        nextServiceDate: prefilterNextDate,
        frequency: 'quarterly',
        relatedBookingId: bookingId,
      },
    });

    // Create membrane maintenance schedule (6 months)
    const membraneNextDate = new Date();
    membraneNextDate.setMonth(membraneNextDate.getMonth() + 6);

    await prisma.maintenanceSchedule.create({
      data: {
        customerId: booking.customer.id,
        scheduleType: 'membrane',
        lastServiceDate: booking.completedAt,
        nextServiceDate: membraneNextDate,
        frequency: 'biannual',
        relatedBookingId: bookingId,
      },
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
