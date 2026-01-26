import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import envConfig from '../../config/env';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [mobileImageLoadError, setMobileImageLoadError] = useState(false);
  
  const servicesRef = useRef(null);
  const userMenuRef = useRef(null);

  // Reset image error state when user changes
  useEffect(() => {
    setImageLoadError(false);
    setMobileImageLoadError(false);
    // Debug: Log user avatar info
    if (user?.avatar && envConfig.enableDebugLogs) {
      console.log('User avatar URL:', user.avatar);
      console.log('Avatar starts with http:', user.avatar.startsWith('http'));
      console.log('Avatar starts with data:', user.avatar.startsWith('data:'));
    }
  }, [user?.avatar]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleServices = () => setIsServicesOpen(!isServicesOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  // Close mobile menu when navigating (improved mobile UX)
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsServicesOpen(false);
    setIsUserMenuOpen(false); // Also close user menu for consistency
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Logged out successfully!');
      setIsUserMenuOpen(false);
      closeMobileMenu(); // Close mobile menu on logout
      navigate('/');
    } catch (error) {
      showError('Logout failed. Please try again.');
    }
  };

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target)) {
        setIsServicesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mobile menu on route change (for better UX)
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">ND</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{envConfig.appName}</h1>
                <p className="text-xs text-gray-600">Bihar</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Home
              </Link>
              
              {/* Services Dropdown */}
              <div className="relative" ref={servicesRef}>
                <button
                  onClick={toggleServices}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium flex items-center transition-colors"
                >
                  Services
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isServicesOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link to="/car-rental" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <img src="/car_logo.svg" alt="Car" className="w-6 h-6 mr-3" />
                        Car Rental
                      </Link>
                      <Link to="/tour-packages" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <img src="/tour_logo.svg" alt="Tour" className="w-6 h-6 mr-3" />
                        Tour Packages
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                About
              </Link>

              <Link to="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notification Panel - only show for authenticated users */}
            {isAuthenticated && envConfig.enableNotifications && <NotificationPanel />}
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                {isAuthenticated ? (
                  <>
                    {/* User Profile Picture */}
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                      {user?.avatar && user.avatar.trim() !== '' && !imageLoadError ? (
                        <img
                          src={envConfig.getAssetUrl(user.avatar)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={() => {
                            setImageLoadError(true);
                          }}
                          onLoad={() => {
                            setImageLoadError(false);
                          }}
                        />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {/* First Name Only */}
                    <span>{user?.name ? user.name.split(' ')[0] : 'User'}</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Account</span>
                  </>
                )}
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    {!isAuthenticated ? (
                      <>
                        <Link 
                          to="/login"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <svg className="w-4 h-4 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Login
                        </Link>
                        <Link 
                          to="/register"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <svg className="w-4 h-4 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Register
                        </Link>
                      </>
                    ) : (
                      <>
                        {user.role === 'admin' && (
                          <Link to="/admin/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                            <svg className="w-4 h-4 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Admin Dashboard
                          </Link>
                        )}
                        <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                          <svg className="w-4 h-4 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        <Link to="/user-dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                          <svg className="w-4 h-4 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0a2 2 0 012-2h10a2 2 0 012 2v2H3V7z" />
                          </svg>
                          Dashboard
                        </Link>
                        <Link to="/my-bookings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                          <svg className="w-4 h-4 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          My Bookings
                        </Link>
                        <hr className="my-1" />
                        <button 
                          onClick={handleLogout}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                        >
                          <svg className="w-4 h-4 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            {/* Notification Panel for mobile - only show for authenticated users */}
            {isAuthenticated && envConfig.enableNotifications && <NotificationPanel />}
            
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-3 rounded-md transition-colors touch-manipulation"
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
            >
              <svg className="h-6 w-6 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}
        
        <div className={`md:hidden transition-all duration-300 ease-in-out relative z-50 ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2 shadow-lg">
            <Link 
              to="/" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            
            {/* Mobile Services */}
            <div className="space-y-1">
              <button
                onClick={toggleServices}
                className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md flex items-center justify-between transition-colors touch-manipulation"
              >
                Services
                <svg className={`h-4 w-4 transform transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className={`pl-4 space-y-1 transition-all duration-200 ease-in-out ${isServicesOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <Link 
                  to="/car-rental" 
                  className="flex items-center px-4 py-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                  onClick={closeMobileMenu}
                >
                  <img src="/car_logo.svg" alt="Car" className="w-6 h-6 mr-3" />
                  Car Rental
                </Link>
                <Link 
                  to="/tour-packages" 
                  className="flex items-center px-4 py-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                  onClick={closeMobileMenu}
                >
                  <img src="/tour_logo.svg" alt="Tour" className="w-6 h-6 mr-3" />
                  Tour Packages
                </Link>
              </div>
            </div>

            <Link 
              to="/about" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
              onClick={closeMobileMenu}
            >
              About
            </Link>

            <Link 
              to="/contact" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
              onClick={closeMobileMenu}
            >
              Contact
            </Link>

            {/* Mobile User Menu */}
            <div className="pt-2 border-t border-gray-200">
              {!isAuthenticated ? (
                <>
                  <Link 
                    to="/login"
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </Link>
                  <Link 
                    to="/register"
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-4 py-3 text-sm text-gray-500 flex items-center space-x-2">
                    {/* Mobile Profile Picture */}
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
                      {user?.avatar && user.avatar.trim() !== '' && !mobileImageLoadError ? (
                        <img
                          src={envConfig.getAssetUrl(user.avatar)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={() => {
                            setMobileImageLoadError(true);
                          }}
                          onLoad={() => {
                            setMobileImageLoadError(false);
                          }}
                        />
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span>Welcome, {user?.name ? user.name.split(' ')[0] : 'User'}!</span>
                  </div>
                  {user.role === 'admin' && (
                    <Link 
                      to="/admin/dashboard" 
                      className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                      onClick={closeMobileMenu}
                    >
                      <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Admin Dashboard
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <Link 
                    to="/user-dashboard" 
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0a2 2 0 012-2h10a2 2 0 012 2v2H3V7z" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link 
                    to="/my-bookings" 
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    My Bookings
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors touch-manipulation"
                  >
                    <svg className="w-5 h-5 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;