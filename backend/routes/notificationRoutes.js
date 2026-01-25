import express from 'express';
import { authenticateJWT, requireUser, requireAdmin } from '../middlewares/auth.js';
import * as notificationControllers from '../controllers/notificationControllers.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateJWT);

// User notification routes
router.get('/', requireUser, notificationControllers.getUsersNotifications);
router.get('/unread-count', requireUser, notificationControllers.getUnreadNotificationsCount);
router.patch('/:id/read', requireUser, notificationControllers.markNotification);
router.patch('/mark-all-read', requireUser, notificationControllers.markAllNotificationsRead);
router.delete('/:id', requireUser, notificationControllers.deleteNotification);

// Admin notification routes
router.post('/', requireAdmin, notificationControllers.adminNotification);
router.post('/send-to-user', requireAdmin, notificationControllers.sendNotificationViaEmail);

export default router;