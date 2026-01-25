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
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            
            // Also validate session with backend to ensure it's still valid
            try {
              const sessionUser = await authService.checkSession();
              if (sessionUser) {
                // Update user data from backend if session is valid
                setUser(sessionUser);
              } else {
                // Session is invalid, clear local storage
                setUser(null);
              }
            } catch (sessionError) {
              // Session check failed, but keep local user for now
              console.log('Session validation failed, using local user data');
            }
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