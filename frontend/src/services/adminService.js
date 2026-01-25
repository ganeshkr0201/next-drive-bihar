// Admin service for API calls
// Handles all admin-related API requests

import api from '../config/axios.js';
import errorHandler from '../utils/errorHandler.js';

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
      errorHandler.logError(error, 'AdminService.getStats');
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
      errorHandler.logError(error, 'AdminService.getQueries');
      return [];
    }
  }

  // Get all tour bookings
  async getTourBookings() {
    try {
      const response = await api.get('/admin/tour-bookings');
      return response.data.bookings || [];
    } catch (error) {
      errorHandler.logError(error, 'AdminService.getTourBookings');
      return [];
    }
  }

  // Get all car bookings
  async getCarBookings() {
    try {
      const response = await api.get('/admin/car-bookings');
      return response.data.bookings || [];
    } catch (error) {
      errorHandler.logError(error, 'AdminService.getCarBookings');
      return [];
    }
  }

  // Get all tour packages
  async getTourPackages() {
    try {
      const response = await api.get('/admin/tour-packages');
      return response.data.packages || [];
    } catch (error) {
      errorHandler.logError(error, 'AdminService.getTourPackages');
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
      throw errorHandler.handleServiceError(error, 'Admin', 'createTourPackage');
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
      throw errorHandler.handleServiceError(error, 'Admin', 'updateTourPackage');
    }
  }

  // Update tour package status
  async updateTourPackageStatus(id, status) {
    try {
      const response = await api.patch(`/admin/tour-packages/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'updateTourPackageStatus');
    }
  }

  // Delete tour package
  async deleteTourPackage(id) {
    try {
      const response = await api.delete(`/admin/tour-packages/${id}`);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'deleteTourPackage');
    }
  }

  // Update booking status
  async updateBookingStatus(type, id, status) {
    try {
      const response = await api.put(`/admin/${type}-bookings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'updateBookingStatus');
    }
  }

  // Confirm booking
  async confirmBooking(bookingId) {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/confirm`);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'confirmBooking');
    }
  }

  // Cancel booking (admin)
  async cancelBooking(bookingId, reason) {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'cancelBooking');
    }
  }

  // Mark booking as completed
  async completeBooking(bookingId) {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/complete`);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'completeBooking');
    }
  }

  // Get all feedbacks
  async getFeedbacks() {
    try {
      const response = await api.get('/admin/feedbacks');
      return response.data.feedbacks || [];
    } catch (error) {
      errorHandler.logError(error, 'AdminService.getFeedbacks');
      return [];
    }
  }

  // Respond to feedback
  async respondToFeedback(feedbackId, responseData) {
    try {
      const response = await api.patch(`/admin/feedbacks/${feedbackId}/respond`, responseData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'respondToFeedback');
    }
  }

  // Get all users
  async getUsers() {
    try {
      const response = await api.get('/admin/users');
      return response.data.users || [];
    } catch (error) {
      errorHandler.logError(error, 'AdminService.getUsers');
      return [];
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'deleteUser');
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
      throw errorHandler.handleServiceError(error, 'Admin', 'getBookings');
    }
  }

  // Reply to a query
  async replyToQuery(queryId, replyData) {
    try {
      const response = await api.post(`/admin/queries/${queryId}/reply`, replyData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'replyToQuery');
    }
  }

  // Respond to a query
  async respondToQuery(queryId, responseData) {
    try {
      const response = await api.patch(`/admin/queries/${queryId}/respond`, responseData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'respondToQuery');
    }
  }

  // Assign query to admin
  async assignQuery(queryId, assignData) {
    try {
      const response = await api.patch(`/admin/queries/${queryId}/assign`, assignData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'assignQuery');
    }
  }

  // Assign booking to admin
  async assignBooking(bookingId, assignData) {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/assign`, assignData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'assignBooking');
    }
  }

  // Get all admin users
  async getAdminUsers() {
    try {
      const response = await api.get('/admin/users/admins');
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'getAdminUsers');
    }
  }

  // Update query priority
  async updateQueryPriority(queryId, priorityData) {
    try {
      const response = await api.patch(`/admin/queries/${queryId}/priority`, priorityData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'updateQueryPriority');
    }
  }

  // Update booking priority
  async updateBookingPriority(bookingId, priorityData) {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/priority`, priorityData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'updateBookingPriority');
    }
  }

  // Submit a new query (public endpoint)
  async submitQuery(queryData) {
    try {
      const response = await api.post('/public/queries', queryData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'submitQuery');
    }
  }

  // Submit a new booking (public endpoint)
  async submitBooking(bookingData) {
    try {
      const response = await api.post('/public/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Admin', 'submitBooking');
    }
  }
}

export default new AdminService();