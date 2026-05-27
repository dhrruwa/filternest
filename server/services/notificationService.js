const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

const createNotification = async (recipientId, recipientModel, type, message, title, options = {}) => {
  try {
    const notification = new Notification({
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
      relatedBooking: options.relatedBooking,
      relatedMaintenance: options.relatedMaintenance,
      actionUrl: options.actionUrl,
      metadata: options.metadata,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const sendNotification = async (notification) => {
  try {
    // Mark in-app notification as sent
    if (notification.channels.inApp) {
      notification.sentStatus.inApp = true;
    }

    // Send email if enabled
    if (notification.channels.email) {
      // Get recipient email from database
      const Model = notification.recipientModel === 'Customer' ? require('../models/Customer') : require('../models/Agent');
      const recipient = await Model.findById(notification.recipient);
      
      if (recipient?.email) {
        const emailSent = await sendEmail(
          recipient.email,
          notification.title,
          notification.message
        );
        if (emailSent) {
          notification.sentStatus.email = true;
        }
      }
    }

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

const getNotifications = async (userId, userModel, unreadOnly = false) => {
  try {
    const query = {
      recipient: userId,
      recipientModel: userModel,
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
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
