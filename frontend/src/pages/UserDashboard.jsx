import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserQueries from '../components/UserQueries/UserQueries';
import bookingService from '../services/bookingService';

const UserDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('tour-bookings');
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
      id: 'tour-bookings', 
      name: 'Tour Bookings', 
      icon: (
        <img src="/tour_logo.svg" alt="Tour" className="w-5 h-5" />
      )
    },
    { 
      id: 'car-bookings', 
      name: 'Car Bookings', 
      icon: (
        <img src="/car_logo.svg" alt="Car" className="w-5 h-5" />
      )
    },
    { 
      id: 'queries', 
      name: 'My Queries', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      // Load tour bookings
      const tourBookings = await bookingService.getUserBookings();
      setBookings(tourBookings);

      // Calculate stats
      const activeBookings = tourBookings.filter(b => ['pending', 'confirmed', 'in-progress'].includes(b.status)).length;
      const completedBookings = tourBookings.filter(b => b.status === 'completed').length;

      setStats({
        totalBookings: tourBookings.length,
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'User'}! Here's your activity overview.</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Queries</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalQueries}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="-mb-px flex space-x-8 overflow-x-auto px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-b-lg shadow-sm border border-gray-200">
          {/* Tour Bookings Tab */}
          {activeTab === 'tour-bookings' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Tour Bookings</h2>
                <a
                  href="/tour-packages"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Book New Tour
                </a>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <BookingCard key={booking._id} booking={booking} onUpdate={loadDashboardData} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <img src="/tour_logo.svg" alt="Tour" className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tour bookings yet</h3>
                  <p className="text-gray-600 mb-4">Start exploring our amazing tour packages</p>
                  <a
                    href="/tour-packages"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Tour Packages
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Car Bookings Tab */}
          {activeTab === 'car-bookings' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Car Bookings</h2>
                <a
                  href="/car-rental"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Book New Car
                </a>
              </div>

              <div className="text-center py-12">
                <img src="/car_logo.svg" alt="Car" className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No car bookings yet</h3>
                <p className="text-gray-600 mb-4">Book a car for your next trip</p>
                <a
                  href="/car-rental"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Book a Car
                </a>
              </div>
            </div>
          )}

          {/* Queries Tab */}
          {activeTab === 'queries' && (
            <div className="p-6">
              <UserQueries />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// BookingCard Component
const BookingCard = ({ booking, onUpdate }) => {
  const { showToast } = useToast();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{booking.tourPackage?.title || 'Tour Package'}</h3>
            <p className="text-gray-600">Booking ID: {booking.bookingReference}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span className="capitalize">{booking.status}</span>
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Travel Date</p>
            <p className="font-medium">{formatDate(booking.travelDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Travelers</p>
            <p className="font-medium">{booking.numberOfTravelers} people</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="font-medium text-green-600">{formatCurrency(booking.totalAmount)}</p>
          </div>
        </div>

        {/* Status-specific information */}
        {booking.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-yellow-800">Your booking is pending admin confirmation. You'll receive an update soon.</p>
            </div>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800">Your booking is confirmed! Get ready for an amazing trip.</p>
            </div>
          </div>
        )}

        {booking.status === 'completed' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <p className="text-sm text-blue-800">Trip completed! How was your experience?</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Leave Feedback
              </button>
            </div>
          </div>
        )}

        {booking.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">This booking has been cancelled.</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Booked on {formatDate(booking.createdAt)}</p>
          <div className="space-x-2">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
            {booking.status === 'pending' && (
              <button 
                onClick={handleCancelBooking}
                className="px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Contact Number</p>
                <p className="font-medium">{booking.contactNumber}</p>
              </div>
              {booking.emergencyContact && (
                <div>
                  <p className="text-sm text-gray-600">WhatsApp Number</p>
                  <p className="font-medium">{booking.emergencyContact}</p>
                </div>
              )}
              {booking.pickupLocation && (
                <div>
                  <p className="text-sm text-gray-600">Pickup Location</p>
                  <p className="font-medium">{booking.pickupLocation}</p>
                </div>
              )}
              {booking.dropLocation && (
                <div>
                  <p className="text-sm text-gray-600">Drop Location</p>
                  <p className="font-medium">{booking.dropLocation}</p>
                </div>
              )}
            </div>
            {booking.specialRequests && (
              <div>
                <p className="text-sm text-gray-600">Special Requests</p>
                <p className="font-medium">{booking.specialRequests}</p>
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
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 w-24">{label}:</span>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Leave Feedback</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900">{booking.tourPackage?.title}</h3>
            <p className="text-sm text-gray-600">Booking ID: {booking.bookingReference}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating *</label>
              <StarRating 
                rating={feedback.rating} 
                onRatingChange={(rating) => setFeedback(prev => ({ ...prev, rating }))}
                label="Overall"
              />
            </div>

            {/* Category Ratings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Rate Different Aspects</label>
              <div className="space-y-3">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Review Title *</label>
              <input
                type="text"
                required
                value={feedback.title}
                onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Summarize your experience"
                maxLength="100"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review *</label>
              <textarea
                required
                rows={4}
                value={feedback.comment}
                onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell us about your experience..."
                maxLength="1000"
              />
              <p className="text-sm text-gray-500 mt-1">{feedback.comment.length}/1000 characters</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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