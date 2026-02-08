import api from '../config/axios.js';

class CarService {
  // Get all cars (admin)
  async getAllCars() {
    try {
      const response = await api.get('/api/cars');
      return response.data.cars || [];
    } catch (error) {
      console.error('Failed to fetch cars:', error);
      throw this.handleError(error);
    }
  }

  // Get available cars (public)
  async getAvailableCars() {
    try {
      const response = await api.get('/api/cars/available');
      return response.data.cars || [];
    } catch (error) {
      console.error('Failed to fetch available cars:', error);
      return [];
    }
  }

  // Get car by ID
  async getCarById(id) {
    try {
      const response = await api.get(`/api/cars/${id}`);
      return response.data.car;
    } catch (error) {
      console.error('Failed to fetch car:', error);
      throw this.handleError(error);
    }
  }

  // Create new car
  async createCar(carData) {
    try {
      const response = await api.post('/api/cars', carData);
      return response.data;
    } catch (error) {
      console.error('Failed to create car:', error);
      throw this.handleError(error);
    }
  }

  // Update car
  async updateCar(id, carData) {
    try {
      const response = await api.put(`/api/cars/${id}`, carData);
      return response.data;
    } catch (error) {
      console.error('Failed to update car:', error);
      throw this.handleError(error);
    }
  }

  // Delete car
  async deleteCar(id) {
    try {
      const response = await api.delete(`/api/cars/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete car:', error);
      throw this.handleError(error);
    }
  }

  // Toggle car availability
  async toggleCarAvailability(id) {
    try {
      const response = await api.patch(`/api/cars/${id}/toggle-availability`);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle car availability:', error);
      throw this.handleError(error);
    }
  }

  // Helper method to handle errors
  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';
      
      switch (status) {
        case 401:
          return new Error('Authentication required. Please login.');
        case 403:
          return new Error('Access denied. Admin privileges required.');
        case 404:
          return new Error('Car not found.');
        case 400:
          return new Error(`Validation error: ${message}`);
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(message);
      }
    }
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      return new Error('Unable to connect to server. Please check your connection.');
    }
    
    return error;
  }
}

export default new CarService();
