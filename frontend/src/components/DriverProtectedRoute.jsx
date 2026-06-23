import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DriverProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'driver') {
    // Redirect admins to their dashboard, regular users to home
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/'} replace />;
  }

  return children;
};

export default DriverProtectedRoute;
