import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TourBookingProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the current location so we can redirect back after login
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please login to book this tour package'
        },
        replace: true 
      });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? children : null;
};

export default TourBookingProtectedRoute;