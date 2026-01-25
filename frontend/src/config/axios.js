import axios from 'axios';

// Detect if running on mobile device
const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Create axios instance with mobile-friendly configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // Important for session cookies
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || (isMobile ? 20000 : 10000), // Longer timeout for mobile
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
});

// Request interceptor for mobile-specific handling
api.interceptors.request.use(
  (config) => {
    // Add mobile-specific headers
    if (isMobile) {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      config.headers['User-Agent'] = navigator.userAgent;
    }
    
    // Log requests in development or when debug is enabled
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true' || import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
        isMobile,
        withCredentials: config.withCredentials,
        headers: config.headers
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for enhanced error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in debug mode
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true' || import.meta.env.DEV) {
      console.log(`📥 ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        isMobile,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Enhanced error logging for mobile debugging
    const errorInfo = {
      isMobile,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      code: error.code
    };
    
    // Always log errors in development or when debug is enabled
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true' || import.meta.env.DEV) {
      console.error('📥 API Error:', errorInfo);
    }
    
    // Log mobile-specific errors in production too
    if (isMobile && import.meta.env.PROD) {
      console.error('📱 Mobile API Error:', errorInfo);
    }
    
    return Promise.reject(error);
  }
);

export default api;