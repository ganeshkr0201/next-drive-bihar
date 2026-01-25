import express from 'express';
import * as notificationControllers from '../controllers/notificationControllers.js';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false,
      message: "Authentication required" 
    });
  }
  next();
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false,
      message: "Authentication required" 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: "Admin privileges required" 
    });
  }

  next();
};

// Get user notifications
router.get('/', requireAuth, notificationControllers.getUsersNotifications);

// Get unread notifications count
router.get('/unread-count', requireAuth, notificationControllers.getUnreadNotificationsCount);

// Mark notification as read
router.patch('/:id/read', requireAuth, notificationControllers.markNotification);

// Mark all notifications as read
router.patch('/mark-all-read', requireAuth, notificationControllers.markAllNotificationsRead);

// Delete notification
router.delete('/:id', requireAuth, notificationControllers.deleteNotification);

// Create notification (admin only)
router.post('/', requireAdmin, notificationControllers.adminNotification);

// Send notification to user by email (admin only)
router.post('/send-to-user', requireAdmin, notificationControllers.sendNotificationViaEmail);

export default router;