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
        console.log('🔍 Checking authentication status...');
        
        // First check local storage
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            console.log('✅ Found user in localStorage:', currentUser.name);
            
            // Validate session with backend in the background
            try {
              console.log('🔄 Validating session with backend...');
              const sessionUser = await authService.checkSession();
              if (sessionUser) {
                // Update user data from backend if session is valid
                setUser(sessionUser);
                console.log('✅ Session validated, user authenticated:', sessionUser.name);
              } else {
                // Session is invalid, but keep local user for now
                // This prevents logout on every refresh if there are temporary network issues
                console.log('⚠️ Session validation failed, keeping local user');
              }
            } catch (sessionError) {
              console.log('❌ Session check error:', sessionError.message);
              
              // Only clear user if it's a clear 401 authentication error
              if (sessionError.response?.status === 401) {
                console.log('❌ Session expired (401), clearing user');
                authService.logout();
                setUser(null);
              } else if (sessionError.code === 'ECONNREFUSED' || sessionError.message.includes('Network Error')) {
                // Network error - keep local user but log the issue
                console.log('⚠️ Network error during session check, keeping local user');
              } else {
                // Other errors - session check failed due to server issues, keep local user
                console.log('⚠️ Session check failed due to server error, keeping local user:', sessionError.message);
              }
            }
          }
        } else {
          console.log('ℹ️ No local authentication found');
          
          // No local authentication, try to check if there's a valid session
          try {
            console.log('🔄 Checking for existing session...');
            const sessionUser = await authService.checkSession();
            if (sessionUser) {
              setUser(sessionUser);
              console.log('✅ Found valid session, user authenticated:', sessionUser.name);
            } else {
              console.log('ℹ️ No valid session found');
            }
          } catch (error) {
            // No valid session, user remains null
            console.log('ℹ️ No valid session found:', error.message);
          }
        }
      } catch (error) {
        // Auth check failed silently
        console.log('❌ Auth check failed:', error.message);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('✅ Authentication check completed');
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await authService.login(email, password);
      setUser(response.user);
      console.log('✅ Login successful:', response.user.name);
      return response;
    } catch (error) {
      console.log('❌ Login failed:', error.message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      const response = await authService.register(userData);
      console.log('✅ Registration successful');
      // Note: User will need to login after registration since backend doesn't auto-login
      return response;
    } catch (error) {
      console.log('❌ Registration failed:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Attempting logout...');
      await authService.logout();
      setUser(null);
      console.log('✅ Logout successful');
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      // Clear user state even if logout request fails
      console.log('⚠️ Logout request failed, clearing local state:', error.message);
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