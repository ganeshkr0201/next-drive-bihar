import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* 404 Illustration */}
        <div className="relative">
          <div className="text-9xl font-bold text-blue-600 opacity-20 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-32 h-32 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20c-2.22 0-4.239-.896-5.709-2.344M15.364 5.636L21 0m0 0h-5.25m5.25 0v5.25" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-sm text-gray-500">
            Don't worry, let's get you back on track with NextDrive Bihar.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
            </Link>

            {isAuthenticated ? (
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : '/user-dashboard'}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0a2 2 0 012-2h10a2 2 0 012 2v2H3V7z" />
                </svg>
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </Link>
            )}
          </div>

          {/* Quick Links */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Or explore these popular pages:</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                to="/tour-packages"
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Tour Packages
              </Link>
              <Link
                to="/car-rental"
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Car Rental
              </Link>
              <Link
                to="/about"
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Fun Fact */}
        <div className="pt-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Did you know?</span>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              Bihar is home to ancient Nalanda University, one of the world's first residential universities!
            </p>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-5 animate-float" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-5 animate-float" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      </div>
    </div>
  );
};

export default NotFound;