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
  
  // Separate mobile services toggle for better control
  const toggleMobileServices = () => {
    setIsServicesOpen(prev => !prev);
  };

  // Close mobile menu when navigating (improved mobile UX)
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsServicesOpen(false);
    setIsUserMenuOpen(false);
  };
  
  // Close mobile menu and services when clicking service links
  const closeMobileMenuAndServices = () => {
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
      // COMPLETELY DISABLE services dropdown click outside for debugging
      
      // Handle user menu dropdown
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      
      // Handle mobile menu - close everything when clicking outside mobile menu
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('[data-mobile-menu-trigger]')) {
        setIsMenuOpen(false);
        setIsServicesOpen(false);
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
  }, [isMenuOpen]);

  // Close mobile menu on route change (for better UX)
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('menu-open');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('menu-open');
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo - Responsive for mobile */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2.5 group" onClick={closeMobileMenu}>
                <div className="relative">
                  <img 
                    src="/nextDriveLogo.png" 
                    alt="NextDrive Bihar" 
                    className="w-11 h-11 sm:w-14 sm:h-14 object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 rounded-full transition-opacity duration-300"></div>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight tracking-tight">
                    {/* Show short name on mobile, full name on larger screens */}
                    <span className="sm:hidden">NextDrive</span>
                    <span className="hidden sm:inline">{envConfig.appName}</span>
                  </h1>
                  <p className="text-[10px] sm:text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-300 font-medium">Explore Bihar</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-1">
                <Link 
                  to="/" 
                  className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 hover:text-blue-600 ${
                    location.pathname === '/' ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Home
                  {location.pathname === '/' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-500"></span>
                  )}
                </Link>
                
                {/* Services Dropdown - Debug Version */}
                <div className="relative" ref={servicesRef}>
                  <button
                    onClick={() => {
                      console.log('Services button clicked, current state:', isServicesOpen);
                      toggleServices();
                    }}
                    className={`relative px-4 py-2 text-sm font-semibold flex items-center transition-all duration-300 hover:text-blue-600 ${
                      location.pathname === '/car-rental' || location.pathname === '/tour-packages' ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Services
                    <svg className={`ml-1.5 h-4 w-4 transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    {(location.pathname === '/car-rental' || location.pathname === '/tour-packages') && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-500"></span>
                    )}
                  </button>
                  
                  {isServicesOpen && (
                    <div 
                      className="absolute left-0 mt-3 w-64 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 border border-gray-100 z-50 overflow-hidden"
                      onMouseDown={(e) => {
                        console.log('Dropdown mousedown');
                        e.stopPropagation();
                      }}
                    >
                      <div className="py-2">
                        <a 
                          href="/car-rental"
                          className="w-full flex items-center px-5 py-3.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-200 group cursor-pointer block border-b border-gray-100 last:border-0"
                          onClick={(e) => {
                            console.log('Car Rental link clicked');
                            e.preventDefault();
                            e.stopPropagation();
                            setIsServicesOpen(false);
                            setTimeout(() => {
                              navigate('/car-rental');
                            }, 50);
                          }}
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-200 shadow-sm">
                            <img src="/car_logo.svg" alt="Car" className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700">Car Rental</div>
                            <div className="text-xs text-gray-500 mt-0.5">Premium vehicles for your journey</div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                        <a 
                          href="/tour-packages"
                          className="w-full flex items-center px-5 py-3.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 transition-all duration-200 group cursor-pointer block"
                          onClick={(e) => {
                            console.log('Tour Packages link clicked');
                            e.preventDefault();
                            e.stopPropagation();
                            setIsServicesOpen(false);
                            setTimeout(() => {
                              navigate('/tour-packages');
                            }, 50);
                          }}
                        >
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-200 shadow-sm">
                            <img src="/tour_logo.svg" alt="Tour" className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 group-hover:text-green-700">Tour Packages</div>
                            <div className="text-xs text-gray-500 mt-0.5">Curated experiences across Bihar</div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transform group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <Link 
                  to="/about" 
                  className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 hover:text-blue-600 ${
                    location.pathname === '/about' ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  About
                  {location.pathname === '/about' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-500"></span>
                  )}
                </Link>

                <Link 
                  to="/gallery" 
                  className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 hover:text-blue-600 ${
                    location.pathname === '/gallery' ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Gallery
                  {location.pathname === '/gallery' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-500"></span>
                  )}
                </Link>

                <Link 
                  to="/contact" 
                  className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 hover:text-blue-600 ${
                    location.pathname === '/contact' ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Contact
                  {location.pathname === '/contact' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-500"></span>
                  )}
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
                            <>
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
                              <Link to="/admin/cars" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 group">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors duration-200">
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="font-medium">Manage Cars</div>
                                  <div className="text-xs text-gray-500">Fleet management</div>
                                </div>
                              </Link>
                            </>
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
            <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
              {/* Notification Panel for mobile - only show for authenticated users */}
              {isAuthenticated && envConfig.enableNotifications && (
                <div className="flex-shrink-0">
                  <NotificationPanel />
                </div>
              )}
              
              {/* Hamburger Menu Button - Always visible on mobile */}
              <button
                onClick={toggleMenu}
                data-mobile-menu-trigger
                type="button"
                className="flex-shrink-0 inline-flex items-center justify-center p-2 rounded-lg text-gray-900 bg-white border-2 border-gray-400 hover:bg-blue-50 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                aria-label="Toggle mobile menu"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                style={{ 
                  minWidth: '44px', 
                  minHeight: '44px',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <svg 
                  className="w-6 h-6 sm:w-7 sm:h-7" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Mobile Navigation Menu */}
      <div 
        id="mobile-menu"
        ref={mobileMenuRef}
        className={`fixed inset-0 z-[100] md:hidden ${
          isMenuOpen 
            ? 'pointer-events-auto' 
            : 'pointer-events-none'
        }`}
        style={{ zIndex: 100 }}
        aria-hidden={!isMenuOpen}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
        
        {/* Sliding menu panel */}
        <div 
          className={`absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          {/* Header with Close Button */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <img 
                    src="/nextDriveLogo.png" 
                    alt="NextDrive Bihar" 
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">NextDrive</h2>
                  <p className="text-blue-100 text-sm">Bihar</p>
                </div>
              </div>

              {/* Close button - Always visible */}
              <button
                onClick={closeMobileMenu}
                className="w-11 h-11 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0 ml-2"
                aria-label="Close menu"
                type="button"
              >
                <svg 
                  className="w-7 h-7 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User greeting */}
            {isAuthenticated && (
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/30">
                  {user?.avatar && user.avatar.trim() !== '' && !mobileImageLoadError ? (
                    <img
                      src={envConfig.getAssetUrl(user.avatar)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setMobileImageLoadError(true)}
                      onLoad={() => setMobileImageLoadError(false)}
                    />
                  ) : (
                    <svg className="w-6 h-6 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-base font-semibold truncate">Hi, {user?.name?.split(' ')[0] || 'User'}!</div>
                  <div className="text-blue-100 text-sm">Welcome back</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-1.5">
              {/* Main Navigation */}
              <Link 
                to="/" 
                className="flex items-center px-4 py-3.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-xl transition-all duration-200 touch-manipulation"
                onClick={closeMobileMenu}
                style={{ 
                  minHeight: '48px',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="font-semibold text-base">Home</span>
              </Link>
              
              {/* Services with toggle */}
              <div>
                <button
                  onClick={toggleMobileServices}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-gray-700 hover:text-green-600 hover:bg-green-50 active:bg-green-100 rounded-xl transition-all duration-200 touch-manipulation"
                  style={{ 
                    minHeight: '48px',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div className="flex items-center">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="font-semibold text-base">Services</span>
                  </div>
                  <svg className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Services submenu */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isServicesOpen ? 'max-h-48 opacity-100 mt-1.5' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-3 space-y-1 bg-gray-50 rounded-xl p-2">
                    <Link 
                      to="/car-rental" 
                      className="flex items-center px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-white active:bg-blue-50 rounded-lg transition-all duration-200 touch-manipulation"
                      onClick={closeMobileMenuAndServices}
                      style={{ 
                        minHeight: '44px',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <img src="/car_logo.svg" alt="Car" className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-sm">Car Rental</span>
                    </Link>
                    <Link 
                      to="/tour-packages" 
                      className="flex items-center px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-white active:bg-green-50 rounded-lg transition-all duration-200 touch-manipulation"
                      onClick={closeMobileMenuAndServices}
                      style={{ 
                        minHeight: '44px',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <img src="/tour_logo.svg" alt="Tour" className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-sm">Tour Packages</span>
                    </Link>
                  </div>
                </div>
              </div>

              <Link 
                to="/about" 
                className="flex items-center px-4 py-3.5 text-gray-700 hover:text-purple-600 hover:bg-purple-50 active:bg-purple-100 rounded-xl transition-all duration-200 touch-manipulation"
                onClick={closeMobileMenu}
                style={{ 
                  minHeight: '48px',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-semibold text-base">About</span>
              </Link>

              <Link 
                to="/gallery" 
                className="flex items-center px-4 py-3.5 text-gray-700 hover:text-pink-600 hover:bg-pink-50 active:bg-pink-100 rounded-xl transition-all duration-200 touch-manipulation"
                onClick={closeMobileMenu}
                style={{ 
                  minHeight: '48px',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-base">Gallery</span>
              </Link>

              <Link 
                to="/contact" 
                className="flex items-center px-4 py-3.5 text-gray-700 hover:text-orange-600 hover:bg-orange-50 active:bg-orange-100 rounded-xl transition-all duration-200 touch-manipulation"
                onClick={closeMobileMenu}
                style={{ 
                  minHeight: '48px',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-base">Contact</span>
              </Link>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Account Section */}
              {!isAuthenticated ? (
                <div className="space-y-2">
                  <Link 
                    to="/login"
                    className="flex items-center px-4 py-3.5 text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 rounded-xl transition-all duration-200 touch-manipulation shadow-lg"
                    onClick={closeMobileMenu}
                    style={{ 
                      minHeight: '52px',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="font-semibold text-base">Login</span>
                  </Link>
                  <Link 
                    to="/register"
                    className="flex items-center px-4 py-3.5 text-green-700 bg-green-50 hover:bg-green-100 active:bg-green-200 border-2 border-green-200 rounded-xl transition-all duration-200 touch-manipulation"
                    onClick={closeMobileMenu}
                    style={{ 
                      minHeight: '52px',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-base">Register</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {user.role === 'admin' && (
                    <>
                      <Link 
                        to="/admin/dashboard" 
                        className="flex items-center px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 touch-manipulation"
                        onClick={closeMobileMenu}
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="font-medium">Admin Dashboard</span>
                      </Link>
                      <Link 
                        to="/admin/cars" 
                        className="flex items-center px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 touch-manipulation"
                        onClick={closeMobileMenu}
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span className="font-medium">Manage Cars</span>
                      </Link>
                    </>
                  )}
                  <Link 
                    to="/profile" 
                    className="flex items-center px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Profile</span>
                  </Link>
                  <Link 
                    to="/user-dashboard" 
                    className="flex items-center px-4 py-3 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0a2 2 0 012-2h10a2 2 0 012 2v2H3V7z" />
                    </svg>
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link 
                    to="/my-bookings" 
                    className="flex items-center px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span className="font-medium">My Bookings</span>
                  </Link>
                  
                  {/* Logout */}
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 touch-manipulation"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">Logout</span>
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