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
        // First check local storage
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            
            // Validate session with backend in the background
            try {
              const sessionUser = await authService.checkSession();
              if (sessionUser) {
                // Update user data from backend if session is valid
                setUser(sessionUser);
                console.log('✅ Session validated, user authenticated');
              } else {
                // Session is invalid, but keep local user for now
                // This prevents logout on every refresh if there are temporary network issues
                console.log('⚠️ Session validation failed, keeping local user');
              }
            } catch (sessionError) {
              // Only clear user if it's a clear 401 authentication error
              if (sessionError.response?.status === 401) {
                console.log('❌ Session expired, clearing user');
                authService.logout();
                setUser(null);
              } else {
                // Session check failed due to network/server issues, keep local user
                console.log('⚠️ Session check failed due to network/server error, keeping local user:', sessionError.message);
              }
            }
          }
        } else {
          // No local authentication, try to check if there's a valid session
          try {
            const sessionUser = await authService.checkSession();
            if (sessionUser) {
              setUser(sessionUser);
              console.log('✅ Found valid session, user authenticated');
            }
          } catch (error) {
            // No valid session, user remains null
            console.log('No valid session found');
          }
        }
      } catch (error) {
        // Auth check failed silently
        console.log('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      // Note: User will need to login after registration since backend doesn't auto-login
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      // Clear user state even if logout request fails
      setUser(null);
      throw error;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
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