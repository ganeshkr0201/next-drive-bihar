import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import bookingService from '../services/bookingService';

const MyBookings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filters, setFilters] = useState({
    type: 'all', // all, tour, car
    status: 'all', // all, pending, confirmed, completed, cancelled
    search: ''
  });

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [bookings, filters]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const allBookings = await bookingService.getUserBookings();
      setBookings(allBookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(booking => {
        if (filters.type === 'tour') {
          return booking.type === 'tour' || booking.tourPackage;
        } else if (filters.type === 'car') {
          return booking.type === 'car' || booking.carType;
        }
        return true;
      });
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Filter by search
    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.bookingReference?.toLowerCase().includes(search) ||
        booking.tourPackage?.title?.toLowerCase().includes(search) ||
        booking.carType?.toLowerCase().includes(search) ||
        booking.pickupLocation?.toLowerCase().includes(search) ||
        booking.dropoffLocation?.toLowerCase().includes(search)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredBookings(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleCancelBooking = async (bookingId, bookingType) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason || !reason.trim()) {
      showToast('Cancellation reason is required', 'error');
      return;
    }

    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        setLoading(true);
        const response = await bookingService.cancelBooking(bookingId, reason.trim());
        
        // Update the booking in local state immediately
        if (response.booking) {
          setBookings(prevBookings => 
            prevBookings.map(b => 
              b._id === bookingId ? response.booking : b
            )
          );
        }
        
        showToast('Booking cancelled successfully', 'success');
        
        // Reload bookings to ensure consistency
        await loadBookings();
      } catch (error) {
        showToast(error.message || 'Failed to cancel booking', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const getBookingStats = () => {
    const stats = {
      total: bookings.length,
      tour: bookings.filter(b => b.type === 'tour' || b.tourPackage).length,
      car: bookings.filter(b => b.type === 'car' || b.carType).length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    };
    return stats;
  };

  const stats = getBookingStats();

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage all your tour and car bookings in one place
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => window.location.href = '/tour-packages'}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm sm:text-base rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Book Tour
              </button>
              <button
                onClick={() => window.location.href = '/car-rental'}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white text-sm sm:text-base rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Rent Car
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard title="Total" value={stats.total} color="blue" />
          <StatsCard title="Tours" value={stats.tour} color="purple" />
          <StatsCard title="Cars" value={stats.car} color="green" />
          <StatsCard title="Pending" value={stats.pending} color="yellow" />
          <StatsCard title="Confirmed" value={stats.confirmed} color="emerald" />
          <StatsCard title="Completed" value={stats.completed} color="gray" />
          <StatsCard title="Cancelled" value={stats.cancelled} color="red" />
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search */}
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Type and Status Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Type Filter */}
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="tour">Tour Bookings ({stats.tour})</option>
                  <option value="car">Car Bookings ({stats.car})</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending ({stats.pending})</option>
                  <option value="confirmed">Confirmed ({stats.confirmed})</option>
                  <option value="completed">Completed ({stats.completed})</option>
                  <option value="cancelled">Cancelled ({stats.cancelled})</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(filters.type !== 'all' || filters.status !== 'all' || filters.search) && (
              <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {(filters.type !== 'all' || filters.status !== 'all' || filters.search) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-xs sm:text-sm font-medium text-gray-600">Active Filters:</span>
              
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                  Search: "{filters.search.length > 20 ? filters.search.substring(0, 20) + '...' : filters.search}"
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {filters.type !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm">
                  Type: {filters.type === 'tour' ? 'Tours' : 'Cars'}
                  <button
                    onClick={() => handleFilterChange('type', 'all')}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {filters.status !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm">
                  Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                  <button
                    onClick={() => handleFilterChange('status', 'all')}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length} bookings
            {(filters.type !== 'all' || filters.status !== 'all' || filters.search) && (
              <span className="text-blue-600 ml-1">(filtered from {bookings.length} total)</span>
            )}
          </p>
        </div>

        {/* Bookings List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredBookings.length > 0 ? (
            <>
              <div className="space-y-6 p-4 sm:p-6">
                {currentBookings.map((booking) => (
                  <BookingCard 
                    key={booking._id} 
                    booking={booking} 
                    onCancel={handleCancelBooking}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Page Info */}
                    <div className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="hidden sm:flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          // Show first page, last page, current page, and pages around current
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => handlePageChange(pageNumber)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === pageNumber
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          } else if (
                            pageNumber === currentPage - 2 ||
                            pageNumber === currentPage + 2
                          ) {
                            return (
                              <span key={pageNumber} className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>

                    {/* Mobile Page Numbers */}
                    <div className="sm:hidden text-sm text-gray-600">
                      {currentPage} / {totalPages}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState 
              hasFilters={filters.type !== 'all' || filters.status !== 'all' || filters.search}
              onClearFilters={clearFilters}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
    red: 'bg-red-100 text-red-600 border-red-200'
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border p-3 sm:p-4 text-center ${colorClasses[color]}`}>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
      <p className="text-[10px] sm:text-xs font-medium mt-0.5">{title}</p>
    </div>
  );
};

// Booking Card Component
const BookingCard = ({ booking, onCancel }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const isCarBooking = booking.type === 'car' || booking.carType;
  const isTourBooking = booking.type === 'tour' || booking.tourPackage;

  // Extract additional data from notes for car bookings
  let carBookingData = {};
  if (isCarBooking && booking.notes && booking.notes.length > 0) {
    try {
      carBookingData = JSON.parse(booking.notes[0].content);
    } catch (error) {
      console.error('Failed to parse car booking notes:', error);
    }
  }

  // Get contact number and other details - from notes for car bookings, direct field for tour bookings
  const contactNumber = isCarBooking ? carBookingData.contactNumber : booking.contactNumber;
  const emergencyContact = isCarBooking ? carBookingData.emergencyContact : booking.emergencyContact;
  const distance = isCarBooking ? carBookingData.distance : null;
  const estimatedTime = isCarBooking ? carBookingData.estimatedTime : null;

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
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'confirmed':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'completed':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
      case 'cancelled':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTravelDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // If it's a Date object or ISO string (from createdAt), extract time
    if (timeString.includes('T') || timeString.includes('-')) {
      const date = new Date(timeString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedMinute = minutes.toString().padStart(2, '0');
      return `${hour12}:${formattedMinute} ${ampm}`;
    }
    
    // Parse the time string (assuming format like "14:30" or "09:00")
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    // Convert to 12-hour format
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    
    // Format with leading zero for minutes if needed
    const formattedMinute = minute.toString().padStart(2, '0');
    
    return `${hour12}:${formattedMinute} ${ampm}`;
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      {/* Header Section */}
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        {/* Icon */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
          isCarBooking ? 'bg-gradient-to-br from-green-100 to-green-50' : 'bg-gradient-to-br from-blue-100 to-blue-50'
        }`}>
          {isCarBooking ? (
            <img src="/car_logo.svg" alt="Car" className="w-6 h-6 sm:w-7 sm:h-7" />
          ) : (
            <img src="/tour_logo.svg" alt="Tour" className="w-6 h-6 sm:w-7 sm:h-7" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Type Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight mb-1">
                {isCarBooking 
                  ? (carBookingData.carName ? `${carBookingData.carName} (${booking.carType})` : booking.carType)
                  : (booking.tourPackage?.title || 'Tour Package')
                }
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                  isCarBooking ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {isCarBooking ? '🚗 Car Rental' : '🎯 Tour Package'}
                </span>
                <span className="text-xs text-gray-500">
                  ID: <span className="font-mono font-medium">{booking.bookingReference}</span>
                </span>
              </div>
            </div>
            
            {/* Status Badge */}
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 flex items-center gap-1.5 flex-shrink-0 ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span className="capitalize">{booking.status.replace('-', ' ')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Basic Information - Reorganized */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Basic Information
        </h4>

        {/* Row 1: Dates and Trip Type */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {/* Pickup Date */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">{isCarBooking ? 'Pickup Date' : 'Travel Date'}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {formatTravelDate(booking.pickupDate || booking.travelDate)}
                {isCarBooking && booking.pickupTime && (
                  <span className="block text-xs text-gray-600 mt-0.5">{formatTime(booking.pickupTime)}</span>
                )}
              </p>
            </div>
          </div>

          {/* Drop-off Date */}
          {isCarBooking && booking.dropoffDate && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Drop-off Date</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {formatTravelDate(booking.dropoffDate)}
                </p>
              </div>
            </div>
          )}

          {/* Booked On */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Booked On</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {formatTravelDate(booking.createdAt)}
                <span className="block text-xs text-gray-600 mt-0.5">{formatTime(booking.createdAt)}</span>
              </p>
            </div>
          </div>

          {/* Trip Type */}
          {isCarBooking && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Trip Type</p>
                <p className="text-sm font-semibold text-gray-900 capitalize truncate">
                  {booking.tripType?.replace('-', ' ') || 'One-way'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Passengers, Distance, Time, Price */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {/* Passengers/Travelers */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">{isTourBooking ? 'Travelers' : 'Passengers'}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {isTourBooking 
                  ? `${booking.numberOfTravelers} ${booking.numberOfTravelers === 1 ? 'person' : 'people'}`
                  : `${booking.numberOfPassengers || 'N/A'} ${booking.numberOfPassengers === 1 ? 'person' : 'people'}`
                }
              </p>
            </div>
          </div>

          {/* Distance */}
          {isCarBooking && distance && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Est. Distance</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {distance} km
                </p>
              </div>
            </div>
          )}

          {/* Estimated Time */}
          {isCarBooking && estimatedTime && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Est. Time</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {estimatedTime}
                </p>
              </div>
            </div>
          )}

          {/* Total Amount */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Est. Price</p>
              <p className="text-sm font-bold text-green-600 truncate">
                {formatCurrency(booking.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Row 3: Marriage Booking - Number of Cars and Selected Cars */}
        {isCarBooking && booking.tripType === 'marriage' && booking.numberOfCars && (
          <div className="pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 gap-3">
              {/* Number of Cars */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Number of Cars for Marriage</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {booking.numberOfCars} {booking.numberOfCars === 1 ? 'Car' : 'Cars'}
                  </p>
                </div>
              </div>

              {/* Selected Cars List */}
              {booking.selectedCars && booking.selectedCars.length > 0 && (
                <div className="ml-10">
                  <p className="text-xs text-gray-500 mb-2">Selected Cars:</p>
                  <div className="space-y-2">
                    {booking.selectedCars.map((car, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-pink-50 rounded border border-pink-100">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-pink-200 text-pink-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{car.carName}</p>
                            <p className="text-xs text-gray-600">{car.carType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-pink-600">₹{car.pricePerDay?.toLocaleString()}/day</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Details */}
      {booking.status === 'cancelled' && booking.cancellationReason && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-900 mb-1">Booking Cancelled</p>
              <p className="text-sm text-red-800 mb-2 leading-relaxed">{booking.cancellationReason}</p>
              {booking.cancelledAt && (
                <div className="flex items-center gap-2 text-xs text-red-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Cancelled on {formatDate(booking.cancelledAt)}
                    {booking.cancelledByType && (
                      <span className="font-medium"> by {booking.cancelledByType === 'admin' ? 'Admin' : 'You'}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Details - Read Only for Users */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Payment Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Paid Amount */}
          <div>
            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Paid Amount
            </p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(booking.paidAmount || 0)}</p>
          </div>

          {/* Discount */}
          <div>
            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Discount
            </p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(booking.discount || 0)}</p>
          </div>

          {/* Due Amount */}
          <div>
            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Due Amount
            </p>
            <p className={`text-lg font-bold ${
              (booking.totalAmount - (booking.discount || 0) - (booking.paidAmount || 0)) > 0 
                ? 'text-red-600' 
                : 'text-gray-400'
            }`}>
              {formatCurrency(Math.max(0, booking.totalAmount - (booking.discount || 0) - (booking.paidAmount || 0)))}
            </p>
          </div>
        </div>

        {/* Total Amount Display */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Amount:</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Additional Details - Always Visible */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Contact & Location Details
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Contact Number */}
          {contactNumber && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Number
              </p>
              <a href={`tel:${contactNumber}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                {contactNumber}
              </a>
            </div>
          )}

          {/* WhatsApp Number */}
          {emergencyContact && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp Number
              </p>
              <a 
                href={`https://wa.me/${emergencyContact.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-green-600 hover:text-green-800 inline-flex items-center gap-1"
              >
                {emergencyContact}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Pickup Location */}
          {booking.pickupLocation && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pickup Location
              </p>
              <p className="text-sm font-medium text-gray-900">{booking.pickupLocation}</p>
            </div>
          )}

          {/* Drop Location */}
          {(booking.dropoffLocation || booking.dropLocation) && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Drop Location
              </p>
              <p className="text-sm font-medium text-gray-900">{booking.dropoffLocation || booking.dropLocation}</p>
            </div>
          )}

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Special Requests
              </p>
              <p className="text-sm font-medium text-gray-900 bg-white p-3 rounded border border-gray-200">
                {booking.specialRequests}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Booked on {formatDate(booking.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3">

          {booking.status === 'pending' && (
            <button 
              onClick={() => onCancel(booking._id, booking.type)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Booking Details</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Booking Information */}
              <div className="space-y-3">
                <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Booking Info</h5>
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">Booking Reference</p>
                  <p className="text-sm font-medium text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                    {booking.bookingReference}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">Booking Type</p>
                  <p className="text-sm font-medium text-gray-900">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isCarBooking ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isCarBooking ? '🚗 Car Rental' : '🎯 Tour Package'}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(booking.totalAmount)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                  <p className="text-sm font-medium text-gray-900">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      booking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.paymentStatus || 'Pending'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Travel/Service Details */}
              <div className="space-y-3">
                <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {isCarBooking ? 'Trip Details' : 'Tour Details'}
                </h5>

                {isCarBooking ? (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Car Type</p>
                      <p className="text-sm font-medium text-gray-900">{booking.carType}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Trip Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {booking.tripType?.replace('-', ' ') || 'One-way'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pickup Date & Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatTravelDate(booking.pickupDate)}
                        {booking.pickupTime && (
                          <span className="block text-xs text-gray-600">at {formatTime(booking.pickupTime)}</span>
                        )}
                      </p>
                    </div>

                    {booking.dropoffDate && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Drop-off Date & Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatTravelDate(booking.dropoffDate)}
                          {carBookingData?.dropTime && (
                            <span className="block text-xs text-gray-600">at {formatTime(carBookingData.dropTime)}</span>
                          )}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Number of Passengers</p>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.numberOfPassengers || booking.numberOfTravelers || 'Not specified'} people
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tour Package</p>
                      <p className="text-sm font-medium text-gray-900">{booking.tourPackage?.title || 'Tour Package'}</p>
                    </div>

                    {booking.tourPackage?.duration && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="text-sm font-medium text-gray-900">{booking.tourPackage.duration}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Travel Date</p>
                      <p className="text-sm font-medium text-gray-900">{formatTravelDate(booking.travelDate)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Number of Travelers</p>
                      <p className="text-sm font-medium text-gray-900">{booking.numberOfTravelers} people</p>
                    </div>

                    {booking.tourPackage?.pricing && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Base Price</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(booking.tourPackage.pricing.basePrice || booking.tourPackage.pricing)}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Additional Contact & Location Details */}
              <div className="space-y-3">
                <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Additional Details</h5>

                <div className="space-y-3">
                  {/* Contact Number */}
                  {contactNumber && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Contact Number
                      </p>
                      <a href={`tel:${contactNumber}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {contactNumber}
                      </a>
                    </div>
                  )}

                  {/* WhatsApp Number */}
                  {emergencyContact && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                        WhatsApp Number
                      </p>
                      <a 
                        href={`https://wa.me/${emergencyContact.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-green-600 hover:text-green-800 inline-flex items-center gap-1"
                      >
                        {emergencyContact}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {/* Pickup Location */}
                  {booking.pickupLocation && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Pickup Location
                      </p>
                      <p className="text-sm font-medium text-gray-900">{booking.pickupLocation}</p>
                    </div>
                  )}

                  {/* Drop Location */}
                  {(booking.dropoffLocation || booking.dropLocation) && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Drop Location
                      </p>
                      <p className="text-sm font-medium text-gray-900">{booking.dropoffLocation || booking.dropLocation}</p>
                    </div>
                  )}

                  {/* Special Requests */}
                  {booking.specialRequests && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Special Requests
                      </p>
                      <p className="text-sm font-medium text-gray-900 bg-white p-3 rounded border border-gray-200">
                        {booking.specialRequests}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Booking Created</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(booking.createdAt)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(booking.updatedAt || booking.createdAt)}</p>
                </div>

                {booking.assignedTo && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                    <p className="text-sm font-medium text-gray-900">{booking.assignedTo.name || booking.assignedTo}</p>
                  </div>
                )}

                {booking.notes && booking.notes.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-2">Admin Notes</p>
                    <div className="space-y-2">
                      {booking.notes.map((note, index) => (
                        <div key={index} className="bg-white p-2 rounded border text-xs sm:text-sm">
                          <p className="text-gray-900">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {note.addedAt && formatDate(note.addedAt)} 
                            {note.addedBy && ` by ${note.addedBy.name || 'Admin'}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tour Package Highlights (for tour bookings) */}
            {!isCarBooking && booking.tourPackage?.highlights && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Tour Highlights</p>
                <div className="bg-white p-3 rounded border">
                  <ul className="text-sm text-gray-900 space-y-1">
                    {(Array.isArray(booking.tourPackage.highlights) 
                      ? booking.tourPackage.highlights 
                      : booking.tourPackage.highlights.split('\n')
                    ).map((highlight, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>{highlight.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Driver/Vehicle Details (for car bookings) */}
            {isCarBooking && (booking.driverDetails || booking.vehicleDetails) && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {booking.driverDetails && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Driver Details</p>
                      <div className="bg-white p-3 rounded border space-y-2">
                        {booking.driverDetails.name && (
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="text-sm font-medium text-gray-900">{booking.driverDetails.name}</p>
                          </div>
                        )}
                        {booking.driverDetails.phone && (
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm font-medium text-gray-900">
                              <a href={`tel:${booking.driverDetails.phone}`} className="text-blue-600 hover:text-blue-800">
                                {booking.driverDetails.phone}
                              </a>
                            </p>
                          </div>
                        )}
                        {booking.driverDetails.licenseNumber && (
                          <div>
                            <p className="text-xs text-gray-500">License Number</p>
                            <p className="text-sm font-medium text-gray-900 font-mono">{booking.driverDetails.licenseNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {booking.vehicleDetails && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Vehicle Details</p>
                      <div className="bg-white p-3 rounded border space-y-2">
                        {booking.vehicleDetails.make && (
                          <div>
                            <p className="text-xs text-gray-500">Make & Model</p>
                            <p className="text-sm font-medium text-gray-900">
                              {booking.vehicleDetails.make} {booking.vehicleDetails.model}
                              {booking.vehicleDetails.year && ` (${booking.vehicleDetails.year})`}
                            </p>
                          </div>
                        )}
                        {booking.vehicleDetails.plateNumber && (
                          <div>
                            <p className="text-xs text-gray-500">Plate Number</p>
                            <p className="text-sm font-medium text-gray-900 font-mono">{booking.vehicleDetails.plateNumber}</p>
                          </div>
                        )}
                        {booking.vehicleDetails.color && (
                          <div>
                            <p className="text-xs text-gray-500">Color</p>
                            <p className="text-sm font-medium text-gray-900">{booking.vehicleDetails.color}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Empty State Component
const EmptyState = ({ hasFilters, onClearFilters }) => (
  <div className="text-center py-12 sm:py-16 px-4">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
      {hasFilters ? 'No bookings match your filters' : 'No bookings yet'}
    </h3>
    <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-sm mx-auto">
      {hasFilters 
        ? 'Try adjusting your search criteria or clear the filters to see all bookings.'
        : 'Start your adventure by booking a tour package or renting a car.'
      }
    </p>
    {hasFilters ? (
      <button
        onClick={onClearFilters}
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm sm:text-base rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        Clear Filters
      </button>
    ) : (
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => window.location.href = '/tour-packages'}
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white text-sm sm:text-base rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse Tours
        </button>
        <button
          onClick={() => window.location.href = '/car-rental'}
          className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white text-sm sm:text-base rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Rent Car
        </button>
      </div>
    )}
  </div>
);

export default MyBookings;