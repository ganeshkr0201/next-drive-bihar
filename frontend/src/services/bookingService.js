import api from '../config/axios.js';
import errorHandler from '../utils/errorHandler.js';

class BookingService {
  // Create a new tour booking
  async createTourBooking(bookingData) {
    try {
      const response = await api.post('/api/bookings/tour', bookingData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Booking', 'createTourBooking');
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
      errorHandler.logError(error, 'BookingService.getUserBookings');
      return [];
    }
  }

  // Get single booking details
  async getBooking(bookingId) {
    try {
      const response = await api.get(`/api/bookings/${bookingId}`);
      return response.data.booking;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Booking', 'getBooking');
    }
  }

  // Cancel a booking
  async cancelBooking(bookingId, reason) {
    try {
      const response = await api.patch(`/api/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Booking', 'cancelBooking');
    }
  }

  // Submit feedback for completed booking
  async submitFeedback(bookingId, feedbackData) {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Booking', 'submitFeedback');
    }
  }

  // Get feedback for a booking
  async getBookingFeedback(bookingId) {
    try {
      const response = await api.get(`/api/bookings/${bookingId}/feedback`);
      return response.data.feedback;
    } catch (error) {
      errorHandler.logError(error, 'BookingService.getBookingFeedback');
      return null;
    }
  }
}

export default new BookingService();