import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserQueries from '../components/UserQueries/UserQueries';
import bookingService from '../services/bookingService';

const UserDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [carBookings, setCarBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalQueries: 0
  });

  const tabs = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'queries', 
      name: 'Support', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all bookings (both tour and car bookings are in the same collection)
      const allBookings = await bookingService.getUserBookings();
      
      // Separate tour and car bookings
      const tourBookings = allBookings.filter(booking => booking.type === 'tour' || booking.tourPackage);
      const userCarBookings = allBookings.filter(booking => booking.type === 'car' || booking.carType);
      
      setBookings(tourBookings);
      setCarBookings(userCarBookings);

      // Calculate stats
      const activeBookings = allBookings.filter(b => ['pending', 'confirmed', 'in-progress'].includes(b.status)).length;
      const completedBookings = allBookings.filter(b => b.status === 'completed').length;

      setStats({
        totalBookings: allBookings.length,
        activeBookings,
        completedBookings,
        totalQueries: 0 // This would need to be fetched from queries API
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage your bookings and explore new adventures
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => window.location.href = '/my-bookings'}
                className="inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-purple-600 text-white text-sm sm:text-base rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                All Bookings
              </button>
              <button
                onClick={() => window.location.href = '/tour-packages'}
                className="inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-blue-600 text-white text-sm sm:text-base rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Book Tour
              </button>
              <button
                onClick={() => window.location.href = '/car-rental'}
                className="inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-green-600 text-white text-sm sm:text-base rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Rent Car
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-1.5 sm:p-2">
            <nav className="flex space-x-1.5 sm:space-x-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6 sm:space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatsCard
                  title="Total Bookings"
                  value={stats.totalBookings}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                  color="blue"
                />
                <StatsCard
                  title="Active Trips"
                  value={stats.activeBookings}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                  color="green"
                />
                <StatsCard
                  title="Completed"
                  value={stats.completedBookings}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  color="purple"
                />
                <StatsCard
                  title="Support Tickets"
                  value={stats.totalQueries}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  }
                  color="orange"
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <QuickActionCard
                  title="Explore Tour Packages"
                  description="Discover amazing destinations across Bihar"
                  icon={<img src="/tour_logo.svg" alt="Tour" className="w-8 h-8" />}
                  color="blue"
                  link="/tour-packages"
                />
                <QuickActionCard
                  title="Rent a Car"
                  description="Book comfortable vehicles for your journey"
                  icon={<img src="/car_logo.svg" alt="Car" className="w-8 h-8" />}
                  color="green"
                  link="/car-rental"
                />
              </div>
            </div>
          )}

          {/* Tour Bookings Tab */}
          {/* Support Tab */}
          {activeTab === 'queries' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Support Center</h2>
                  <p className="text-sm sm:text-base text-gray-600">Get help from our support team and manage your queries</p>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <UserQueries />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 hover:shadow-xl transition-all duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center">
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${colorClasses[color]} mb-2 sm:mb-0`}>
          {icon}
        </div>
        <div className="sm:ml-4">
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Quick Action Card Component
const QuickActionCard = ({ title, description, icon, color, link }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
  };

  return (
    <button
      onClick={() => window.location.href = link}
      className={`bg-gradient-to-r ${colorClasses[color]} text-white rounded-xl sm:rounded-2xl p-5 sm:p-6 text-left hover:shadow-xl transition-all duration-200`}
    >
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
          <p className="text-white/80 text-xs sm:text-sm">{description}</p>
        </div>
      </div>
    </button>
  );
};

// Empty State Component
const EmptyState = ({ icon, title, description, actionText, actionLink }) => (
  <div className="text-center py-8 sm:py-12 px-4">
    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400">
      {icon}
    </div>
    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{description}</p>
    <button
      onClick={() => window.location.href = actionLink}
      className="inline-flex items-center px-5 sm:px-6 py-3 bg-blue-600 text-white text-sm sm:text-base rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {actionText}
    </button>
  </div>
);

// BookingCard Component
const BookingCard = ({ booking, onUpdate }) => {
  const { showToast } = useToast();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'confirmed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleCancelBooking = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingService.cancelBooking(booking._id, 'Cancelled by user');
        showToast('Booking cancelled successfully', 'success');
        onUpdate();
      } catch (error) {
        showToast(error.message || 'Failed to cancel booking', 'error');
      }
    }
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4">
          <div className="mb-3 sm:mb-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{booking.tourPackage?.title || 'Tour Package'}</h3>
            <p className="text-xs sm:text-sm text-gray-600">ID: {booking.bookingReference}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-1 border ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span className="capitalize">{booking.status}</span>
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
            <p className="text-xs text-gray-600 mb-1">Travel Date</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{new Date(booking.travelDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</p>
          </div>
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
            <p className="text-xs text-gray-600 mb-1">Travelers</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{booking.numberOfTravelers} people</p>
          </div>
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
            <p className="text-xs text-gray-600 mb-1">Total Amount</p>
            <p className="text-sm sm:text-base font-medium text-green-600">{formatCurrency(booking.totalAmount)}</p>
          </div>
        </div>

        {/* Status-specific information */}
        {booking.status === 'pending' && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-yellow-800 font-medium">Awaiting confirmation - You'll receive an update soon!</p>
            </div>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-green-800 font-medium">Booking confirmed! Get ready for an amazing trip 🎉</p>
            </div>
          </div>
        )}

        {booking.status === 'completed' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-blue-800 font-medium">Trip completed! How was your experience?</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-3 py-1.5 sm:py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
              >
                Rate Trip
              </button>
            </div>
          </div>
        )}

        {booking.status === 'cancelled' && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex items-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-red-800 font-medium mb-2">This booking has been cancelled</p>
                {booking.cancellationReason && (
                  <div className="bg-red-100 border border-red-200 rounded-lg p-2 sm:p-3 mb-2">
                    <p className="text-xs sm:text-sm text-red-800">
                      <span className="font-semibold">Cancellation Reason:</span>
                    </p>
                    <p className="text-xs sm:text-sm text-red-700 mt-1">{booking.cancellationReason}</p>
                  </div>
                )}
                {booking.cancelledAt && (
                  <p className="text-xs text-red-600 mt-1">
                    Cancelled on {new Date(booking.cancelledAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                    {booking.cancelledByType && (
                      <span> by {booking.cancelledByType === 'admin' ? 'admin' : 'you'}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-200 gap-2">
          <p className="text-xs sm:text-sm text-gray-600">Booked on {new Date(booking.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 sm:flex-none px-3 py-2 sm:py-1 text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
            {booking.status === 'pending' && (
              <button 
                onClick={handleCancelBooking}
                className="flex-1 sm:flex-none px-3 py-2 sm:py-1 text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                <p className="text-xs text-gray-600 mb-1">Contact Number</p>
                <p className="text-sm sm:text-base font-medium text-gray-900">{booking.contactNumber}</p>
              </div>
              {booking.emergencyContact && (
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                  <p className="text-xs text-gray-600 mb-1">WhatsApp Number</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900">{booking.emergencyContact}</p>
                </div>
              )}
              {booking.pickupLocation && (
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                  <p className="text-xs text-gray-600 mb-1">Pickup Location</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900">{booking.pickupLocation}</p>
                </div>
              )}
              {booking.dropLocation && (
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                  <p className="text-xs text-gray-600 mb-1">Drop Location</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900">{booking.dropLocation}</p>
                </div>
              )}
            </div>
            {booking.specialRequests && (
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                <p className="text-xs text-gray-600 mb-1">Special Requests</p>
                <p className="text-sm sm:text-base font-medium text-gray-900">{booking.specialRequests}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal 
          booking={booking} 
          onClose={() => setShowFeedbackModal(false)} 
          onSubmit={() => {
            setShowFeedbackModal(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
};

// FeedbackModal Component
const FeedbackModal = ({ booking, onClose, onSubmit }) => {
  const { showToast } = useToast();
  const [feedback, setFeedback] = useState({
    rating: 5,
    title: '',
    comment: '',
    categories: {
      service: 5,
      value: 5,
      cleanliness: 5,
      communication: 5
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.title.trim() || !feedback.comment.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await bookingService.submitFeedback(booking._id, feedback);
      showToast('Feedback submitted successfully!', 'success');
      onSubmit();
    } catch (error) {
      showToast(error.message || 'Failed to submit feedback', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, label }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs sm:text-sm font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">{label}:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`w-6 h-6 sm:w-7 sm:h-7 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Share Your Experience</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-200">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">{booking.tourPackage?.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600">Booking ID: {booking.bookingReference}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Overall Rating */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Overall Rating *</label>
              <StarRating 
                rating={feedback.rating} 
                onRatingChange={(rating) => setFeedback(prev => ({ ...prev, rating }))}
                label="Overall"
              />
            </div>

            {/* Category Ratings */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Rate Different Aspects</label>
              <div className="space-y-2 sm:space-y-3 bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <StarRating 
                  rating={feedback.categories.service} 
                  onRatingChange={(rating) => setFeedback(prev => ({ 
                    ...prev, 
                    categories: { ...prev.categories, service: rating }
                  }))}
                  label="Service"
                />
                <StarRating 
                  rating={feedback.categories.value} 
                  onRatingChange={(rating) => setFeedback(prev => ({ 
                    ...prev, 
                    categories: { ...prev.categories, value: rating }
                  }))}
                  label="Value"
                />
                <StarRating 
                  rating={feedback.categories.cleanliness} 
                  onRatingChange={(rating) => setFeedback(prev => ({ 
                    ...prev, 
                    categories: { ...prev.categories, cleanliness: rating }
                  }))}
                  label="Cleanliness"
                />
                <StarRating 
                  rating={feedback.categories.communication} 
                  onRatingChange={(rating) => setFeedback(prev => ({ 
                    ...prev, 
                    categories: { ...prev.categories, communication: rating }
                  }))}
                  label="Communication"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Review Title *</label>
              <input
                type="text"
                required
                value={feedback.title}
                onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Summarize your experience"
                maxLength="100"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Your Review *</label>
              <textarea
                required
                rows={4}
                value={feedback.comment}
                onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Tell us about your experience..."
                maxLength="1000"
              />
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{feedback.comment.length}/1000 characters</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 sm:px-6 py-3 text-sm sm:text-base text-gray-700 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 sm:px-6 py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;