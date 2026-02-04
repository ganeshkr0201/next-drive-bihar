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
      {/* Professional Mobile Navigation Menu */}
      <div 
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 right-0 bottom-0 z-50 md:hidden transform transition-all duration-500 ease-out ${
          isMenuOpen 
            ? 'translate-x-0 opacity-100 visible' 
            : 'translate-x-full opacity-0 invisible'
        }`}
      >
        {/* Backdrop with blur effect */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeMobileMenu} />
        
        {/* Sliding menu panel */}
        <div className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-500 ease-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Header Section */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-8">
            {/* Close button */}
            <button
              onClick={closeMobileMenu}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img 
                  src="/nextDriveLogo.png" 
                  alt="NextDrive Bihar" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">NextDrive</h2>
                <p className="text-blue-100 text-sm">Bihar</p>
              </div>
            </div>

            {/* User Info Section */}
            {isAuthenticated && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-white/30 bg-white/20 flex items-center justify-center">
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
                      <svg className="w-7 h-7 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-lg">Welcome back!</div>
                    <div className="text-blue-100 text-sm">{user?.name || 'User'}</div>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-xs text-blue-100">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-2">

              {/* Main Navigation Links */}
              <div className="space-y-1 mb-8">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">Navigation</div>
                
                <Link 
                  to="/" 
                  className="mobile-menu-item group flex items-center px-4 py-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98"
                  onClick={closeMobileMenu}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300 shadow-sm">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">Home</div>
                    <div className="text-xs text-gray-500">Main dashboard</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                {/* Services Section */}
                <div className="space-y-1">
                  <button
                    onClick={toggleServices}
                    className="mobile-menu-item group w-full flex items-center justify-between px-4 py-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300 shadow-sm">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-base">Services</div>
                        <div className="text-xs text-gray-500">Our offerings</div>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 group-hover:text-green-600 transform transition-all duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isServicesOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-8 pr-4 py-2 space-y-2">
                      <Link 
                        to="/car-rental" 
                        className="group flex items-center px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 touch-manipulation active:scale-98"
                        onClick={closeMobileMenu}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                          <img src="/car_logo.svg" alt="Car" className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Car Rental</div>
                          <div className="text-xs text-gray-500">Premium vehicles</div>
                        </div>
                      </Link>
                      <Link 
                        to="/tour-packages" 
                        className="group flex items-center px-4 py-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 touch-manipulation active:scale-98"
                        onClick={closeMobileMenu}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:from-green-100 group-hover:to-green-200 transition-all duration-300">
                          <img src="/tour_logo.svg" alt="Tour" className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Tour Packages</div>
                          <div className="text-xs text-gray-500">Curated experiences</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>

                <Link 
                  to="/about" 
                  className="mobile-menu-item group flex items-center px-4 py-4 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98"
                  onClick={closeMobileMenu}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300 shadow-sm">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">About</div>
                    <div className="text-xs text-gray-500">Our story</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link 
                  to="/contact" 
                  className="mobile-menu-item group flex items-center px-4 py-4 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98"
                  onClick={closeMobileMenu}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300 shadow-sm">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">Contact</div>
                    <div className="text-xs text-gray-500">Get in touch</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* User Menu Section */}
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">Account</div>
                  <Link 
                    to="/login"
                    className="group flex items-center px-4 py-4 text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98 shadow-lg"
                    onClick={closeMobileMenu}
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">Login</div>
                      <div className="text-xs text-blue-100">Access your account</div>
                    </div>
                    <svg className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link 
                    to="/register"
                    className="group flex items-center px-4 py-4 text-green-700 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98"
                    onClick={closeMobileMenu}
                  >
                    <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center mr-4 group-hover:bg-green-300 transition-all duration-300">
                      <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">Register</div>
                      <div className="text-xs text-green-600">Create new account</div>
                    </div>
                    <svg className="w-5 h-5 text-green-500 group-hover:text-green-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">Account</div>
                  {user.role === 'admin' && (
                    <Link 
                      to="/admin/dashboard" 
                      className="group flex items-center px-4 py-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98"
                      onClick={closeMobileMenu}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300 shadow-sm">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base">Admin Dashboard</div>
                        <div className="text-xs text-gray-500">Manage system</div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="group flex items-center px-4 py-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98"
                    onClick={closeMobileMenu}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300 shadow-sm">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">Profile</div>
                      <div className="text-xs text-gray-500">Edit your info</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link 
                    to="/user-dashboard" 
                    className="group flex items-center px-4 py-4 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98"
                    onClick={closeMobileMenu}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-indigo-200 group-hover:to-indigo-300 transition-all duration-300 shadow-sm">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0a2 2 0 012-2h10a2 2 0 012 2v2H3V7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">Dashboard</div>
                      <div className="text-xs text-gray-500">Your overview</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link 
                    to="/my-bookings" 
                    className="group flex items-center px-4 py-4 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98"
                    onClick={closeMobileMenu}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300 shadow-sm">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">My Bookings</div>
                      <div className="text-xs text-gray-500">View reservations</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Logout Section for authenticated users */}
            {isAuthenticated && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <button 
                  onClick={handleLogout}
                  className="group w-full flex items-center px-4 py-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-all duration-300 touch-manipulation active:scale-98"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-red-200 group-hover:to-red-300 transition-all duration-300 shadow-sm">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-base">Logout</div>
                    <div className="text-xs text-red-500">Sign out securely</div>
                  </div>
                  <svg className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Footer Section */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <div className="flex items-center justify-center space-x-6 text-gray-400">
                <a href="https://facebook.com/nextdrivebihar" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/nextdrivebihar" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://wa.me/918709083341" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                  </svg>
                </a>
              </div>
              <div className="text-center mt-4">
                <p className="text-xs text-gray-400">© 2026 NextDrive Bihar</p>
                <p className="text-xs text-gray-500 mt-1">Your Travel Partner</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;