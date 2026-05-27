const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const auth = require('../middleware/auth');

// Get notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await notificationService.getNotifications(
      req.userId,
      req.userRole.charAt(0).toUpperCase() + req.userRole.slice(1)
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:notificationId/read', auth, async (req, res) => {
  try {
    const notification = await notificationService.markNotificationAsRead(req.params.notificationId);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
