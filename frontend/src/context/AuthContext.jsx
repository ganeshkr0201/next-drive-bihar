import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking JWT authentication status...');
        
        // First check local storage for tokens
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            console.log('✅ Found user in localStorage:', currentUser.name);
            
            // Validate token with backend in the background
            try {
              console.log('🔄 Validating JWT token with backend...');
              const sessionUser = await authService.checkSession();
              if (sessionUser) {
                // Update user data from backend if token is valid
                setUser(sessionUser);
                console.log('✅ JWT token validated, user authenticated:', sessionUser.name);
              } else {
                // Token is invalid, clear auth data
                console.log('❌ JWT token invalid, clearing auth data');
                authService.clearAuthData();
                setUser(null);
              }
            } catch (sessionError) {
              console.log('❌ JWT token validation error:', sessionError.message);
              
              // Only clear user if it's a clear 401 authentication error
              if (sessionError.response?.status === 401) {
                console.log('❌ JWT token expired (401), clearing auth data');
                authService.clearAuthData();
                setUser(null);
              } else if (sessionError.code === 'ECONNREFUSED' || sessionError.message.includes('Network Error')) {
                // Network error - keep local user but log the issue
                console.log('⚠️ Network error during token validation, keeping local user');
              } else {
                // Other errors - token validation failed due to server issues, keep local user
                console.log('⚠️ Token validation failed due to server error, keeping local user:', sessionError.message);
              }
            }
          }
        } else {
          console.log('ℹ️ No JWT tokens found in localStorage');
          
          // No local authentication, user remains null
          console.log('ℹ️ No valid JWT authentication found');
        }
      } catch (error) {
        // Auth check failed silently
        console.log('❌ JWT auth check failed:', error.message);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('✅ JWT authentication check completed');
      }
    };

    // Listen for token expiration events
    const handleTokenExpired = () => {
      console.log('🔔 Token expired event received');
      setUser(null);
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    
    checkAuth();

    // Cleanup event listener
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting JWT login for:', email);
      const response = await authService.login(email, password);
      setUser(response.user);
      console.log('✅ JWT login successful:', response.user.name);
      return response;
    } catch (error) {
      console.log('❌ JWT login failed:', error.message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      const response = await authService.register(userData);
      console.log('✅ Registration successful');
      // Note: User will need to verify email before getting JWT tokens
      return response;
    } catch (error) {
      console.log('❌ Registration failed:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Attempting JWT logout...');
      await authService.logout();
      setUser(null);
      console.log('✅ JWT logout successful');
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      // Clear user state even if logout request fails
      console.log('⚠️ JWT logout request failed, clearing local state:', error.message);
      setUser(null);
      throw error;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    console.log('✅ User updated:', updatedUser.name);
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    setUser, // Add setUser to the context
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};