// Authentication service for API calls
// Integrated with NextDrive Bihar backend

import api from '../config/axios.js';

class AuthService {
  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password
      });

      return {
        success: true,
        message: response.data.message,
        user: response.data.user,
        requiresVerification: response.data.requiresVerification
      };
    } catch (error) {
      // Handle axios errors
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error(`Cannot connect to server. Please make sure the backend is running on ${api.defaults.baseURL}`);
      }
      
      // Handle HTTP errors
      if (error.response) {
        throw new Error(error.response.data.message || `Registration failed (${error.response.status})`);
      }
      
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });

      // Store user data in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('isAuthenticated', 'true');

      return {
        success: true,
        message: response.data.message,
        user: response.data.user
      };
    } catch (error) {
      // Handle axios errors
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error(`Cannot connect to server. Please make sure the backend is running on ${api.defaults.baseURL}`);
      }
      
      // Handle HTTP errors
      if (error.response) {
        // Check if user needs email verification
        if (error.response.status === 403 && error.response.data.requiresVerification) {
          throw {
            requiresVerification: true,
            email: error.response.data.email,
            message: error.response.data.message
          };
        }
        
        throw new Error(error.response.data.message || `Login failed (${error.response.status})`);
      }
      
      throw error;
    }
  }

  // Verify OTP with optional auto-login
  async verifyOtp(email, otp, autoLogin = false) {
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp,
        autoLogin
      });

      // If auto-login was successful, store user data
      if (response.data.autoLogin && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isAuthenticated', 'true');
      }

      return {
        success: true,
        message: response.data.message,
        verified: response.data.verified,
        autoLogin: response.data.autoLogin,
        user: response.data.user
      };
    } catch (error) {
      // Handle axios errors
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error(`Cannot connect to server. Please make sure the backend is running on ${api.defaults.baseURL}`);
      }
      
      // Handle HTTP errors
      if (error.response) {
        throw new Error(error.response.data.message || `Verification failed (${error.response.status})`);
      }
      
      throw error;
    }
  }

  // Resend OTP
  async resendOtp(email) {
    try {
      const response = await api.post('/auth/resend-otp', { email });

      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      // Handle axios errors
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error(`Cannot connect to server. Please make sure the backend is running on ${api.defaults.baseURL}`);
      }
      
      // Handle HTTP errors
      if (error.response) {
        throw new Error(error.response.data.message || `Failed to resend OTP (${error.response.status})`);
      }
      
      throw error;
    }
  }

  // Google OAuth login - redirect to backend
  initiateGoogleLogin() {
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  }

  // Logout user
  async logout() {
    try {
      const response = await api.get('/auth/logout');

      // Clear local storage regardless of response
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');

      return {
        success: true,
        message: response.data.message || 'Logged out successfully'
      };
    } catch (error) {
      // Clear local storage even if request fails
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
      return {
        success: true,
        message: 'Logged out locally'
      };
    }
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const isAuth = localStorage.getItem('isAuthenticated');
    const user = this.getCurrentUser();
    return isAuth === 'true' && user !== null;
  }

  // Check user session with backend (optional - for extra security)
  async checkSession() {
    try {
      const response = await api.get('/auth/me');

      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isAuthenticated', 'true');
        return response.data.user;
      }
      
      // Session expired or invalid
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      return null;
    } catch (error) {
      // If unauthorized, clear local storage
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      }
      
      return null;
    }
  }

  // Update user profile
  async updateProfile(formData) {
    try {
      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update localStorage with new user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return {
        success: true,
        message: response.data.message,
        user: response.data.user
      };
    } catch (error) {
      // Handle axios errors
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error(`Cannot connect to server. Please make sure the backend is running on ${api.defaults.baseURL}`);
      }
      
      // Handle HTTP errors
      if (error.response) {
        throw new Error(error.response.data.message || `Profile update failed (${error.response.status})`);
      }
      
      throw error;
    }
  }

  // Delete user account
  async deleteAccount(deleteData) {
    try {
      const response = await api.delete('/auth/delete-account', {
        data: deleteData
      });

      // Clear local storage after successful deletion
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');

      return {
        success: true,
        message: response.data.message,
        deletedData: response.data.deletedData
      };
    } catch (error) {
      // Handle axios errors
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error(`Cannot connect to server. Please make sure the backend is running on ${api.defaults.baseURL}`);
      }
      
      // Handle HTTP errors
      if (error.response) {
        throw new Error(error.response.data.message || `Account deletion failed (${error.response.status})`);
      }
      
      throw error;
    }
  }
}

export default new AuthService();