import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();
const isDev = import.meta.env.DEV;
const log = (...args) => isDev && console.log(...args);

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
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            try {
              const sessionUser = await authService.checkSession();
              if (sessionUser) {
                setUser(sessionUser);
              } else {
                authService.clearAuthData();
                setUser(null);
              }
            } catch (sessionError) {
              if (sessionError.response?.status === 401) {
                authService.clearAuthData();
                setUser(null);
              }
            }
          }
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const handleTokenExpired = () => { setUser(null); };

    window.addEventListener('tokenExpired', handleTokenExpired);
    checkAuth();
    return () => { window.removeEventListener('tokenExpired', handleTokenExpired); };
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
      setUser(null);
      throw error;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    log('✅ User updated:', updatedUser.name);
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