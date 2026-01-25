import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Component to handle unauthorized access
const UnauthorizedRedirect = () => {
  const { showError } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Show error message once when component mounts
    showError('Unauthorized access. Admin privileges required.');
  }, []); // Empty dependency array ensures it runs only once

  // Redirect to home page
  return <Navigate to="/" replace state={{ from: location }} />;
};

// Loading component
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading...
        </h2>
        <p className="text-gray-600">Please wait while we verify your access.</p>
      </div>
    </div>
  );
};

const AdminProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Wait for user data to be loaded before checking role
  if (!user) {
    return <LoadingScreen />;
  }

  // If authenticated but not admin, show unauthorized component
  if (user.role !== 'admin') {
    return <UnauthorizedRedirect />;
  }

  // If admin, render the protected component
  return children;
};

export default AdminProtectedRoute;