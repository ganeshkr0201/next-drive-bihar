// Authentication service for JWT-based API calls
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
      this.handleError(error);
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });

      // Store tokens and user data
      if (response.data.tokens) {
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.data.user));

      return {
        success: true,
        message: response.data.message,
        user: response.data.user,
        tokens: response.data.tokens
      };
    } catch (error) {
      this.handleError(error);
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

      // If auto-login was successful, store tokens and user data
      if (response.data.autoLogin && response.data.tokens) {
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return {
        success: true,
        message: response.data.message,
        verified: response.data.verified,
        autoLogin: response.data.autoLogin,
        user: response.data.user,
        tokens: response.data.tokens
      };
    } catch (error) {
      this.handleError(error);
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
      this.handleError(error);
    }
  }

  // Google OAuth login - temporarily disabled
  initiateGoogleLogin() {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  }

  // Logout user
  async logout() {
    try {
      // Call logout endpoint (optional for JWT)
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if request fails
      console.log('Logout request failed:', error.message);
    } finally {
      // Always clear local storage
      this.clearAuthData();
      return {
        success: true,
        message: 'Logged out successfully'
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
    const token = localStorage.getItem('accessToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Check user session with backend
  async checkSession() {
    try {
      const response = await api.get('/auth/me');

      if (response.data.user) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }
      
      // Session invalid
      this.clearAuthData();
      return null;
    } catch (error) {
      // If unauthorized, clear local storage
      if (error.response?.status === 401) {
        this.clearAuthData();
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
      this.handleError(error);
    }
  }

  // Delete user account
  async deleteAccount(deleteData) {
    try {
      const response = await api.delete('/auth/delete-account', {
        data: deleteData
      });

      // Clear local storage after successful deletion
      this.clearAuthData();

      return {
        success: true,
        message: response.data.message,
        deletedData: response.data.deletedData
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh-token', {
        refreshToken
      });

      // Update stored tokens
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

      return response.data.tokens;
    } catch (error) {
      // Clear auth data if refresh fails
      this.clearAuthData();
      throw error;
    }
  }

  // Clear all authentication data
  clearAuthData() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Handle API errors consistently
  handleError(error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      throw new Error(`Cannot connect to server. Please make sure the backend is running on ${api.defaults.baseURL}`);
    }
    
    if (error.response) {
      // Check if user needs email verification
      if (error.response.status === 403 && error.response.data.requiresVerification) {
        throw {
          requiresVerification: true,
          email: error.response.data.email,
          message: error.response.data.message
        };
      }
      
      throw new Error(error.response.data.message || `Request failed (${error.response.status})`);
    }
    
    throw error;
  }
}

export default new AuthService();