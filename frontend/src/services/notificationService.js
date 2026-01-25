import api from '../config/axios';
import errorHandler from '../utils/errorHandler';
import envConfig from '../config/env';

const notificationService = {
  // Get user notifications
  getNotifications: async (limit = envConfig.notificationLimit) => {
    try {
      const response = await api.get(`/api/notifications?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Notification', 'getNotifications');
    }
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/notifications/unread-count');
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Notification', 'getUnreadCount');
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Notification', 'markAsRead');
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/api/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Notification', 'markAllAsRead');
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/api/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Notification', 'deleteNotification');
    }
  },

  // Create notification (admin only)
  createNotification: async (notificationData) => {
    try {
      const response = await api.post('/api/notifications', notificationData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Notification', 'createNotification');
    }
  }
};

export default notificationService;