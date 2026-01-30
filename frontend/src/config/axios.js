import axios from 'axios';

// Create axios instance with JWT configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true') {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
        hasToken: !!token,
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

// Response interceptor for JWT error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // Log successful responses in debug mode
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true') {
      console.log(`📥 ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          console.log('🔄 Attempting token refresh...');
          
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
          
          // Update stored tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          console.log('✅ Token refreshed successfully');
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError.message);
        
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Dispatch custom event for auth context to handle
        window.dispatchEvent(new CustomEvent('tokenExpired'));
        
        return Promise.reject(refreshError);
      }
    }
    
    // Log errors in development
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true') {
      console.error('📥 API Error:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;