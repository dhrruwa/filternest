const prisma = require('../lib/prisma');
const { sendEmail } = require('./emailService');

const createNotification = async (recipientId, recipientModel, type, message, title, options = {}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        recipient: recipientId,
        recipientModel,
        type,
        title: title || type,
        message,
        channels: options.channels || {
          inApp: true,
          email: false,
          sms: false,
          whatsapp: false,
        },
        sentStatus: { inApp: false, email: false, sms: false, whatsapp: false },
        relatedBookingId: options.relatedBooking || undefined,
        relatedMaintenanceId: options.relatedMaintenance || undefined,
        actionUrl: options.actionUrl,
        metadata: options.metadata || undefined,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const sendNotification = async (notification) => {
  try {
    const channels = notification.channels || {};
    const sentStatus = { ...(notification.sentStatus || {}) };

    // Mark in-app notification as sent
    if (channels.inApp) {
      sentStatus.inApp = true;
    }

    // Send email if enabled
    if (channels.email) {
      // Get recipient email from database
      const recipient =
        notification.recipientModel === 'Customer'
          ? await prisma.customer.findUnique({ where: { id: notification.recipient } })
          : await prisma.agent.findUnique({ where: { id: notification.recipient } });

      if (recipient?.email) {
        const emailSent = await sendEmail(
          recipient.email,
          notification.title,
          notification.message
        );
        if (emailSent) {
          sentStatus.email = true;
        }
      }
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { sentStatus },
    });
    return updated;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

const getNotifications = async (userId, userModel, unreadOnly = false) => {
  try {
    const where = {
      recipient: userId,
      recipientModel: userModel,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendNotification,
  getNotifications,
  markNotificationAsRead,
};
