import api from '../config/axios';
import envConfig from '../config/env';

const notificationService = {
  // Get user notifications
  getNotifications: async (limit = envConfig.notificationLimit) => {
    try {
      const response = await api.get(`/api/notifications?limit=${limit}`);
      return response.data;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Get notifications error:', error);
      }
      throw error.response?.data || { message: 'Failed to fetch notifications' };
    }
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/notifications/unread-count');
      return response.data;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Get unread count error:', error);
      }
      throw error.response?.data || { message: 'Failed to fetch unread count' };
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Mark as read error:', error);
      }
      throw error.response?.data || { message: 'Failed to mark notification as read' };
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/api/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Mark all as read error:', error);
      }
      throw error.response?.data || { message: 'Failed to mark all notifications as read' };
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/api/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Delete notification error:', error);
      }
      throw error.response?.data || { message: 'Failed to delete notification' };
    }
  },

  // Create notification (admin only)
  createNotification: async (notificationData) => {
    try {
      const response = await api.post('/api/notifications', notificationData);
      return response.data;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Create notification error:', error);
      }
      throw error.response?.data || { message: 'Failed to create notification' };
    }
  }
};

export default notificationService;