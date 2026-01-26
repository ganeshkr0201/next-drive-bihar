// Admin service for API calls
// Handles all admin-related API requests

import api from '../config/axios.js';
import envConfig from '../config/env.js';

class AdminService {
  // Get dashboard statistics
  async getStats() {
    try {
      const response = await api.get('/admin/stats');
      return response.data.stats || {
        totalQueries: 0,
        totalTourBookings: 0,
        totalCarBookings: 0,
        totalTourPackages: 0,
        totalUsers: 0
      };
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Failed to fetch stats:', error);
      }
      return {
        totalQueries: 0,
        totalTourBookings: 0,
        totalCarBookings: 0,
        totalTourPackages: 0,
        totalUsers: 0
      };
    }
  }

  // Get all customer queries
  async getQueries(params = {}) {
    try {
      const response = await api.get('/admin/queries', { params });
      // Return just the queries array for data synchronization
      return response.data.queries || [];
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Failed to fetch queries:', error);
      }
      return [];
    }
  }

  // Get all tour bookings
  async getTourBookings() {
    try {
      const response = await api.get('/admin/tour-bookings');
      return response.data.bookings || [];
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Failed to fetch tour bookings:', error);
      }
      return [];
    }
  }

  // Get all car bookings
  async getCarBookings() {
    try {
      const response = await api.get('/admin/car-bookings');
      return response.data.bookings || [];
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Failed to fetch car bookings:', error);
      }
      return [];
    }
  }

  // Get all tour packages
  async getTourPackages() {
    try {
      const response = await api.get('/admin/tour-packages');
      return response.data.packages || [];
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Failed to fetch tour packages:', error);
      }
      return [];
    }
  }

  // Create new tour package
  async createTourPackage(formData) {
    try {
      const response = await api.post('/admin/tour-packages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to create tour package');
      }
      throw error;
    }
  }

  // Update tour package
  async updateTourPackage(id, formData) {
    try {
      const response = await api.put(`/admin/tour-packages/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update tour package');
      }
      throw error;
    }
  }

  // Update tour package status
  async updateTourPackageStatus(id, status) {
    try {
      const response = await api.patch(`/admin/tour-packages/${id}/status`, { status });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update tour package status');
      }
      throw error;
    }
  }

  // Delete tour package
  async deleteTourPackage(id) {
    try {
      const response = await api.delete(`/admin/tour-packages/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete tour package');
      }
      throw error;
    }
  }

  // Update booking status
  async updateBookingStatus(type, id, status) {
    try {
      const response = await api.put(`/admin/${type}-bookings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update booking status');
      }
      throw error;
    }
  }

  // Confirm booking
  async confirmBooking(bookingId) {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/confirm`);
      return response.data;
    } catch (error) {
      console.error('Confirm booking error:', error);
      throw this.handleError(error);
    }
  }

  // Cancel booking (admin)
  async cancelBooking(bookingId, reason) {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Cancel booking error:', error);
      throw this.handleError(error);
    }
  }

  // Mark booking as completed
  async completeBooking(bookingId) {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Complete booking error:', error);
      throw this.handleError(error);
    }
  }

  // Get all feedbacks
  async getFeedbacks() {
    try {
      const response = await api.get('/admin/feedbacks');
      return response.data.feedbacks || [];
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
      return [];
    }
  }

  // Respond to feedback
  async respondToFeedback(feedbackId, responseData) {
    try {
      const response = await api.patch(`/admin/feedbacks/${feedbackId}/respond`, responseData);
      return response.data;
    } catch (error) {
      console.error('Respond to feedback error:', error);
      throw this.handleError(error);
    }
  }

  // Get all users
  async getUsers() {
    try {
      const response = await api.get('/admin/users', {
        timeout: 30000 // Increase timeout to 30 seconds for admin operations
      });
      return response.data.users || [];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete user');
      }
      throw error;
    }
  }

  // Get dashboard statistics (legacy method)
  async getDashboardStats() {
    return this.getStats();
  }

  // Get all bookings with pagination and filters (legacy method)
  async getBookings(params = {}) {
    try {
      const response = await api.get('/admin/bookings', { params });
      return response.data;
    } catch (error) {
      console.error('Get bookings error:', error);
      throw this.handleError(error);
    }
  }

  // Reply to a query
  async replyToQuery(queryId, replyData) {
    try {
      const response = await api.post(`/admin/queries/${queryId}/reply`, replyData);
      return response.data;
    } catch (error) {
      console.error('Reply to query error:', error);
      throw this.handleError(error);
    }
  }

  // Respond to a query
  async respondToQuery(queryId, responseData) {
    try {
      const response = await api.patch(`/admin/queries/${queryId}/respond`, responseData);
      return response.data;
    } catch (error) {
      console.error('Respond to query error:', error);
      throw this.handleError(error);
    }
  }

  // Assign query to admin
  async assignQuery(queryId, assignData) {
    try {
      const response = await api.patch(`/admin/queries/${queryId}/assign`, assignData);
      return response.data;
    } catch (error) {
      console.error('Assign query error:', error);
      throw this.handleError(error);
    }
  }

  // Assign booking to admin
  async assignBooking(bookingId, assignData) {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/assign`, assignData);
      return response.data;
    } catch (error) {
      console.error('Assign booking error:', error);
      throw this.handleError(error);
    }
  }

  // Get all admin users
  async getAdminUsers() {
    try {
      const response = await api.get('/admin/users/admins');
      return response.data;
    } catch (error) {
      console.error('Get admin users error:', error);
      throw this.handleError(error);
    }
  }

  // Update query priority
  async updateQueryPriority(queryId, priorityData) {
    try {
      const response = await api.patch(`/admin/queries/${queryId}/priority`, priorityData);
      return response.data;
    } catch (error) {
      console.error('Update query priority error:', error);
      throw this.handleError(error);
    }
  }

  // Update booking priority
  async updateBookingPriority(bookingId, priorityData) {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/priority`, priorityData);
      return response.data;
    } catch (error) {
      console.error('Update booking priority error:', error);
      throw this.handleError(error);
    }
  }

  // Submit a new query (public endpoint)
  async submitQuery(queryData) {
    try {
      const response = await api.post('/public/queries', queryData);
      return response.data;
    } catch (error) {
      console.error('Submit query error:', error);
      throw this.handleError(error);
    }
  }

  // Submit a new booking (public endpoint)
  async submitBooking(bookingData) {
    try {
      const response = await api.post('/public/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Submit booking error:', error);
      throw this.handleError(error);
    }
  }

  // Helper method to handle errors consistently
  handleError(error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      return new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';
      
      switch (status) {
        case 401:
          return new Error('Authentication required. Please login.');
        case 403:
          return new Error('Access denied. Admin privileges required.');
        case 404:
          return new Error('Resource not found.');
        case 422:
          return new Error(`Validation error: ${message}`);
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(message);
      }
    }
    
    return error;
  }
}

export default new AdminService();