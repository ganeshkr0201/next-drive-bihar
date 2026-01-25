// Authentication service for API calls
// Integrated with NextDrive Bihar backend

import api from '../config/axios.js';
import errorHandler from '../utils/errorHandler.js';
import { authStorage } from '../utils/storage.js';

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
      throw errorHandler.handleServiceError(error, 'Auth', 'register');
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });

      // Store user data using storage utility
      authStorage.login(response.data.user);

      return {
        success: true,
        message: response.data.message,
        user: response.data.user
      };
    } catch (error) {
      const handledError = errorHandler.handleAuthError(error, 'login');
      if (handledError.requiresVerification) {
        throw handledError;
      }
      throw handledError;
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
        authStorage.login(response.data.user);
      }

      return {
        success: true,
        message: response.data.message,
        verified: response.data.verified,
        autoLogin: response.data.autoLogin,
        user: response.data.user
      };
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Auth', 'verifyOtp');
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
      throw errorHandler.handleServiceError(error, 'Auth', 'resendOtp');
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

      // Clear local storage using storage utility
      authStorage.logout();

      return {
        success: true,
        message: response.data.message || 'Logged out successfully'
      };
    } catch (error) {
      // Clear local storage even if request fails
      authStorage.logout();
      
      return {
        success: true,
        message: 'Logged out locally'
      };
    }
  }

  // Get current user from storage
  getCurrentUser() {
    return authStorage.getUser();
  }

  // Check if user is authenticated
  isAuthenticated() {
    return authStorage.isAuthenticated() && authStorage.getUser() !== null;
  }

  // Check user session with backend (optional - for extra security)
  async checkSession() {
    try {
      const response = await api.get('/auth/me');

      if (response.data.user) {
        authStorage.login(response.data.user);
        return response.data.user;
      }
      
      // Session expired or invalid
      authStorage.logout();
      return null;
    } catch (error) {
      // If unauthorized, clear local storage
      if (error.response?.status === 401) {
        authStorage.logout();
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

      // Update storage with new user data
      if (response.data.user) {
        authStorage.updateUser(response.data.user);
      }

      return {
        success: true,
        message: response.data.message,
        user: response.data.user
      };
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Auth', 'updateProfile');
    }
  }

  // Delete user account
  async deleteAccount(deleteData) {
    try {
      const response = await api.delete('/auth/delete-account', {
        data: deleteData
      });

      // Clear storage after successful deletion
      authStorage.logout();

      return {
        success: true,
        message: response.data.message,
        deletedData: response.data.deletedData
      };
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Auth', 'deleteAccount');
    }
  }
}

export default new AuthService();