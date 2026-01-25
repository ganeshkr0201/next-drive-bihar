import api from '../config/axios.js';
import envConfig from '../config/env.js';

class BookingService {
  // Create a new tour booking
  async createTourBooking(bookingData) {
    try {
      const response = await api.post('/api/bookings/tour', bookingData);
      return response.data;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Create tour booking error:', error);
      }
      throw this.handleError(error);
    }
  }

  // Generic create booking function (alias for createTourBooking)
  async createBooking(bookingData) {
    return this.createTourBooking(bookingData);
  }

  // Get user's bookings
  async getUserBookings() {
    try {
      const response = await api.get('/api/bookings/my-bookings');
      return response.data.bookings || [];
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Get user bookings error:', error);
      }
      return [];
    }
  }

  // Get single booking details
  async getBooking(bookingId) {
    try {
      const response = await api.get(`/api/bookings/${bookingId}`);
      return response.data.booking;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Get booking error:', error);
      }
      throw this.handleError(error);
    }
  }

  // Cancel a booking
  async cancelBooking(bookingId, reason) {
    try {
      const response = await api.put(`/api/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Cancel booking error:', error);
      }
      throw this.handleError(error);
    }
  }

  // Submit feedback for completed booking
  async submitFeedback(bookingId, feedbackData) {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Submit feedback error:', error);
      }
      throw this.handleError(error);
    }
  }

  // Get feedback for a booking
  async getBookingFeedback(bookingId) {
    try {
      const response = await api.get(`/api/bookings/${bookingId}/feedback`);
      return response.data.feedback;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Get feedback error:', error);
      }
      return null;
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
          return new Error('Access denied.');
        case 404:
          return new Error('Booking not found.');
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

export default new BookingService();