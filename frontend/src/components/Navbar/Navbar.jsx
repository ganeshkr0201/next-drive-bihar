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
  const mobileMenuRef = useRef(null);

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
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Logged out successfully!');
      setIsUserMenuOpen(false);
      closeMobileMenu();
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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('[data-mobile-menu-trigger]')) {
        setIsMenuOpen(false);
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2 group" onClick={closeMobileMenu}>
                <div className="relative">
                  <img 
                    src="/nextDriveLogo.png" 
                    alt="NextDrive Bihar" 
                    className="w-12 h-12 object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 rounded-full transition-opacity duration-200"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">{envConfig.appName}</h1>
                  <p className="text-xs text-gray-600 group-hover:text-blue-500 transition-colors duration-200">Bihar</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-blue-50 rounded-md">
                  Home
                </Link>
                
                {/* Services Dropdown */}
                <div className="relative" ref={servicesRef}>
                  <button
                    onClick={toggleServices}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium flex items-center transition-all duration-200 hover:bg-blue-50 rounded-md"
                  >
                    Services
                    <svg className={`ml-1 h-4 w-4 transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isServicesOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                      <div className="py-2">
                        <Link to="/car-rental" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
                            <img src="/car_logo.svg" alt="Car" className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium">Car Rental</div>
                            <div className="text-xs text-gray-500">Premium vehicles</div>
                          </div>
                        </Link>
                        <Link to="/tour-packages" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors duration-200">
                            <img src="/tour_logo.svg" alt="Tour" className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium">Tour Packages</div>
                            <div className="text-xs text-gray-500">Curated experiences</div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-blue-50 rounded-md">
                  About
                </Link>

                <Link to="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-blue-50 rounded-md">
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
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-blue-50 rounded-md"
                >
                  {isAuthenticated ? (
                    <>
                      {/* User Profile Picture */}
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 bg-gray-100 flex items-center justify-center hover:border-blue-400 transition-colors duration-200">
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
                  <svg className={`ml-1 h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                      {!isAuthenticated ? (
                        <>
                          <Link 
                            to="/login"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">Login</div>
                              <div className="text-xs text-gray-500">Access your account</div>
                            </div>
                          </Link>
                          <Link 
                            to="/register"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all duration-200 group"
                          >
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors duration-200">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">Register</div>
                              <div className="text-xs text-gray-500">Create new account</div>
                            </div>
                          </Link>
                        </>
                      ) : (
                        <>
                          {user.role === 'admin' && (
                            <Link to="/admin/dashboard" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium">Admin Dashboard</div>
                                <div className="text-xs text-gray-500">Manage system</div>
                              </div>
                            </Link>
                          )}
                          <Link to="/profile" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all duration-200 group">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors duration-200">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">Profile</div>
                              <div className="text-xs text-gray-500">Edit your info</div>
                            </div>
                          </Link>
                          <Link to="/user-dashboard" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 group">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-indigo-200 transition-colors duration-200">
                              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0a2 2 0 012-2h10a2 2 0 012 2v2H3V7z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">Dashboard</div>
                              <div className="text-xs text-gray-500">Your overview</div>
                            </div>
                          </Link>
                          <Link to="/my-bookings" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 group">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors duration-200">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">My Bookings</div>
                              <div className="text-xs text-gray-500">View reservations</div>
                            </div>
                          </Link>
                          <div className="border-t border-gray-100 my-2"></div>
                          <button 
                            onClick={handleLogout}
                            className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                          >
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors duration-200">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">Logout</div>
                              <div className="text-xs text-gray-500">Sign out</div>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button and notification */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Notification Panel for mobile - only show for authenticated users */}
              {isAuthenticated && envConfig.enableNotifications && <NotificationPanel />}
              
              <button
                onClick={toggleMenu}
                data-mobile-menu-trigger
                className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-3 rounded-lg transition-all duration-200 hover:bg-blue-50 touch-manipulation active:scale-95"
                aria-label="Toggle mobile menu"
                aria-expanded={isMenuOpen}
              >
                <svg className={`h-6 w-6 transition-all duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
        
      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
      
      {/* Enhanced Mobile Navigation Menu */}
      <div 
        ref={mobileMenuRef}
        className={`fixed top-16 left-0 right-0 bg-white z-50 md:hidden transform transition-all duration-300 ease-out ${
          isMenuOpen 
            ? 'translate-y-0 opacity-100 visible' 
            : '-translate-y-full opacity-0 invisible'
        }`}
        style={{ maxHeight: 'calc(100vh - 4rem)' }}
      >
        <div className="overflow-y-auto h-full">
          <div className="px-4 py-6 space-y-2 bg-gradient-to-b from-white to-gray-50">
            {/* Mobile User Info Section */}
            {isAuthenticated && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-200 bg-white flex items-center justify-center">
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
                      <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Welcome back!</div>
                    <div className="text-sm text-blue-600">{user?.name ? user.name.split(' ')[0] : 'User'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Navigation Links */}
            <div className="space-y-1">
              <Link 
                to="/" 
                className="flex items-center px-4 py-4 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 touch-manipulation active:scale-98 group"
                onClick={closeMobileMenu}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors duration-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Home</div>
                  <div className="text-xs text-gray-500">Main page</div>
                </div>
              </Link>
              
              {/* Enhanced Mobile Services */}
              <div className="space-y-1">
                <button
                  onClick={toggleServices}
                  className="w-full flex items-center justify-between px-4 py-4 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 touch-manipulation active:scale-98 group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors duration-200">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Services</div>
                      <div className="text-xs text-gray-500">Our offerings</div>
                    </div>
                  </div>
                  <svg className={`h-5 w-5 transform transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isServicesOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="pl-6 space-y-1 py-2">
                    <Link 
                      to="/car-rental" 
                      className="flex items-center px-4 py-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 touch-manipulation active:scale-98 group"
                      onClick={closeMobileMenu}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
                        <img src="/car_logo.svg" alt="Car" className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">Car Rental</div>
                        <div className="text-xs text-gray-500">Premium vehicles</div>
                      </div>
                    </Link>
                    <Link 
                      to="/tour-packages" 
                      className="flex items-center px-4 py-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 touch-manipulation active:scale-98 group"
                      onClick={closeMobileMenu}
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors duration-200">
                        <img src="/tour_logo.svg" alt="Tour" className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">Tour Packages</div>
                        <div className="text-xs text-gray-500">Curated experiences</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              <Link 
                to="/about" 
                className="flex items-center px-4 py-4 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 touch-manipulation active:scale-98 group"
                onClick={closeMobileMenu}
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors duration-200">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">About</div>
                  <div className="text-xs text-gray-500">Our story</div>
                </div>
              </Link>

              <Link 
                to="/contact" 
                className="flex items-center px-4 py-4 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 touch-manipulation active:scale-98 group"
                onClick={closeMobileMenu}
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-orange-200 transition-colors duration-200">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Contact</div>
                  <div className="text-xs text-gray-500">Get in touch</div>
                </div>
              </Link>
            </div>

            {/* Mobile User Menu */}
            <div className="pt-4 border-t border-gray-200">
              {!isAuthenticated ? (
                <div className="space-y-2">
                  <Link 
                    to="/login"
                    className="flex items-center px-4 py-4 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 touch-manipulation active:scale-98 shadow-lg"
                    onClick={closeMobileMenu}
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Login</div>
                      <div className="text-xs text-blue-100">Access your account</div>
                    </div>
                  </Link>
                  <Link 
                    to="/register"
                    className="flex items-center px-4 py-4 text-base font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all duration-200 touch-manipulation active:scale-98"
                    onClick={closeMobileMenu}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Register</div>
                      <div className="text-xs text-green-600">Create new account</div>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {user.role === 'admin' && (
                    <Link 
                      to="/admin/dashboard" 
                      className="flex items-center px-4 py-4 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 touch-manipulation active:scale-98 group"
                      onClick={closeMobileMenu}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors duration-200">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">Admin Dashboard</div>
                        <div className="text-xs text-gray-500">Manage system</div>
                      </div>
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="flex items-center px-4 py-4 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 touch-manipulation active:scale-98 group"
                    onClick={closeMobileMenu}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors duration-200">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Profile</div>
                      <div className="text-xs text-gray-500">Edit your info</div>
                    </div>
                  </Link>
                  <Link 
                    to="/user-dashboard" 
                    className="flex items-center px-4 py-4 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 touch-manipulation active:scale-98 group"
                    onClick={closeMobileMenu}
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-200 transition-colors duration-200">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0a2 2 0 012-2h10a2 2 0 012 2v2H3V7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Dashboard</div>
                      <div className="text-xs text-gray-500">Your overview</div>
                    </div>
                  </Link>
                  <Link 
                    to="/my-bookings" 
                    className="flex items-center px-4 py-4 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 touch-manipulation active:scale-98 group"
                    onClick={closeMobileMenu}
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors duration-200">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">My Bookings</div>
                      <div className="text-xs text-gray-500">View reservations</div>
                    </div>
                  </Link>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-4 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 touch-manipulation active:scale-98 group"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-red-200 transition-colors duration-200">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">Logout</div>
                        <div className="text-xs text-red-500">Sign out</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;