// Shared error handling utility
// Provides consistent error handling across all services

import envConfig from '../config/env';

class ErrorHandler {
  // Handle API errors consistently
  handleApiError(error, context = 'API') {
    // Network connection errors
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      return new Error(`Cannot connect to server. Please make sure the backend is running on ${envConfig.apiUrl}`);
    }
    
    // HTTP response errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';
      
      switch (status) {
        case 401:
          return new Error('Authentication required. Please login.');
        case 403:
          return new Error(this.getForbiddenMessage(context));
        case 404:
          return new Error(this.getNotFoundMessage(context));
        case 422:
          return new Error(`Validation error: ${message}`);
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later.');
        case 502:
        case 503:
        case 504:
          return new Error('Service temporarily unavailable. Please try again later.');
        default:
          return new Error(message);
      }
    }
    
    // Return original error if not handled
    return error;
  }

  // Handle service-specific errors
  handleServiceError(error, serviceName, operation) {
    const handledError = this.handleApiError(error, serviceName);
    
    if (envConfig.enableDebugLogs) {
      console.error(`${serviceName} ${operation} error:`, error);
    }
    
    return handledError;
  }

  // Get context-specific forbidden message
  getForbiddenMessage(context) {
    switch (context.toLowerCase()) {
      case 'admin':
        return 'Access denied. Admin privileges required.';
      case 'user':
        return 'Access denied. User privileges required.';
      default:
        return 'Access denied.';
    }
  }

  // Get context-specific not found message
  getNotFoundMessage(context) {
    switch (context.toLowerCase()) {
      case 'booking':
        return 'Booking not found.';
      case 'user':
        return 'User not found.';
      case 'tour':
        return 'Tour package not found.';
      case 'query':
        return 'Query not found.';
      case 'notification':
        return 'Notification not found.';
      default:
        return 'Resource not found.';
    }
  }

  // Handle authentication-specific errors
  handleAuthError(error, operation) {
    // Check for email verification requirement
    if (error.response?.status === 403 && error.response.data?.requiresVerification) {
      return {
        requiresVerification: true,
        email: error.response.data.email,
        message: error.response.data.message
      };
    }
    
    return this.handleServiceError(error, 'Auth', operation);
  }

  // Async wrapper for service methods
  async wrapServiceMethod(serviceMethod, serviceName, operation) {
    try {
      return await serviceMethod();
    } catch (error) {
      throw this.handleServiceError(error, serviceName, operation);
    }
  }

  // Log error for debugging
  logError(error, context) {
    if (envConfig.enableDebugLogs) {
      console.error(`[${context}] Error:`, error);
    }
  }
}

// Export singleton instance
export default new ErrorHandler();