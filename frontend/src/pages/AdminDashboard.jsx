import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import { useDataSync } from '../hooks/useDataSync';
import adminService from '../services/adminService';
import notificationService from '../services/notificationService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { updateItem, removeItem, addItem, invalidateData } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use synchronized data hooks with stable function references
  const fetchQueries = useCallback(() => adminService.getQueries(), []);
  const fetchTourBookings = useCallback(() => adminService.getTourBookings(), []);
  const fetchCarBookings = useCallback(() => adminService.getCarBookings(), []);
  const fetchTourPackages = useCallback(() => adminService.getTourPackages(), []);
  const fetchUsers = useCallback(() => adminService.getUsers(), []);
  const fetchStats = useCallback(() => adminService.getStats(), []);

  const { data: queries, refetch: refetchQueries } = useDataSync('queries', fetchQueries);
  const { data: tourBookings, refetch: refetchTourBookings } = useDataSync('tourBookings', fetchTourBookings);
  const { data: carBookings, refetch: refetchCarBookings } = useDataSync('carBookings', fetchCarBookings);
  const { data: tourPackages, refetch: refetchTourPackages } = useDataSync('tourPackages', fetchTourPackages);
  const { data: users, refetch: refetchUsers } = useDataSync('users', fetchUsers);
  const { data: stats, refetch: refetchStats } = useDataSync('stats', fetchStats);
  
  // Local state for filters and forms
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [queryFilters, setQueryFilters] = useState({
    status: '',
    category: '',
    filter: ''
  });
  const [filteredTourBookings, setFilteredTourBookings] = useState([]);
  const [bookingFilters, setBookingFilters] = useState({
    status: '',
    type: '',
    category: '',
    filter: '',
    search: ''
  });
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    active: 0
  });
  const [querySearch, setQuerySearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [userFilters, setUserFilters] = useState({
    verification: '', // 'verified', 'unverified', or ''
    sortBy: 'newest' // 'newest', 'oldest', 'most-bookings', 'least-bookings'
  });

  // Local state for query responses to prevent text vanishing
  const [queryResponses, setQueryResponses] = useState({});
  // Pagination state
  const [queryPagination, setQueryPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10
  });
  const [bookingPagination, setBookingPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10
  });

  // Tour package form state
  const [tourPackageForm, setTourPackageForm] = useState({
    name: '',
    duration: '',
    summary: '',
    highlights: '',
    price: '',
    discount: '',
    inclusions: '',
    exclusions: '',
    pickupLocations: '',
    dropLocations: '',
    images: []
  });

  // Filter queries based on current filters
  useEffect(() => {
    if (!queries || !Array.isArray(queries)) {
      setFilteredQueries([]);
      return;
    }

    let filtered = [...queries];

    if (queryFilters.status) {
      filtered = filtered.filter(query => query.status === queryFilters.status);
    }

    if (queryFilters.category) {
      filtered = filtered.filter(query => query.category === queryFilters.category);
    }

    if (queryFilters.filter === 'active') {
      filtered = filtered.filter(query => ['pending', 'resolved'].includes(query.status));
    } else if (queryFilters.filter === 'closed') {
      filtered = filtered.filter(query => query.status === 'closed');
    }

    // Search functionality
    if (querySearch.trim()) {
      const searchTerm = querySearch.toLowerCase().trim();
      filtered = filtered.filter(query => 
        query._id.toLowerCase().includes(searchTerm) ||
        query.subject?.toLowerCase().includes(searchTerm) ||
        query.message?.toLowerCase().includes(searchTerm) ||
        query.user?.name?.toLowerCase().includes(searchTerm) ||
        query.user?.email?.toLowerCase().includes(searchTerm) ||
        query.name?.toLowerCase().includes(searchTerm) ||
        query.email?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredQueries(filtered);
    resetQueryPagination(); // Reset pagination when filters change
  }, [queries, queryFilters, querySearch]);

  // Filter bookings based on current filters
  useEffect(() => {
    if (!tourBookings || !Array.isArray(tourBookings)) {
      setFilteredTourBookings([]);
      setBookingStats({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        active: 0
      });
      return;
    }

    let filtered = [...tourBookings];

    // Calculate statistics
    const stats = {
      total: tourBookings.length,
      pending: tourBookings.filter(b => b.status === 'pending').length,
      confirmed: tourBookings.filter(b => b.status === 'confirmed').length,
      completed: tourBookings.filter(b => b.status === 'completed').length,
      cancelled: tourBookings.filter(b => b.status === 'cancelled').length,
      active: tourBookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length
    };
    setBookingStats(stats);

    // Apply filters
    if (bookingFilters.status) {
      filtered = filtered.filter(booking => booking.status === bookingFilters.status);
    }

    if (bookingFilters.filter === 'active') {
      filtered = filtered.filter(booking => ['pending', 'confirmed'].includes(booking.status));
    } else if (bookingFilters.filter === 'completed') {
      filtered = filtered.filter(booking => booking.status === 'completed');
    } else if (bookingFilters.filter === 'cancelled') {
      filtered = filtered.filter(booking => booking.status === 'cancelled');
    }

    // Search functionality
    if (bookingFilters.search.trim()) {
      const searchTerm = bookingFilters.search.toLowerCase().trim();
      filtered = filtered.filter(booking => 
        booking._id.toLowerCase().includes(searchTerm) ||
        booking.bookingReference?.toLowerCase().includes(searchTerm) ||
        booking.tourPackage?.title?.toLowerCase().includes(searchTerm) ||
        booking.tourPackage?.name?.toLowerCase().includes(searchTerm) ||
        booking.user?.name?.toLowerCase().includes(searchTerm) ||
        booking.user?.email?.toLowerCase().includes(searchTerm) ||
        booking.contactNumber?.includes(searchTerm)
      );
    }

    setFilteredTourBookings(filtered);
    resetBookingPagination(); // Reset pagination when filters change
  }, [tourBookings, bookingFilters]);

  // Update filtered users when users data changes
  useEffect(() => {
    if (users && users.length > 0) {
      let filtered = [...users];

      // Apply verification filter
      if (userFilters.verification === 'verified') {
        filtered = filtered.filter(user => user.isVerified);
      } else if (userFilters.verification === 'unverified') {
        filtered = filtered.filter(user => !user.isVerified);
      }

      // Apply search filter
      if (searchEmail.trim()) {
        const searchTerm = searchEmail.toLowerCase();
        filtered = filtered.filter(user => 
          user.email.toLowerCase().includes(searchTerm) ||
          user.name.toLowerCase().includes(searchTerm)
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (userFilters.sortBy) {
          case 'most-bookings':
            return (b.bookingStats?.totalBookings || 0) - (a.bookingStats?.totalBookings || 0);
          case 'least-bookings':
            return (a.bookingStats?.totalBookings || 0) - (b.bookingStats?.totalBookings || 0);
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'newest':
          default:
            // First sort by role (admins first), then by creation date
            if (a.role === b.role) {
              return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return a.role === 'admin' ? -1 : 1;
        }
      });
      
      setFilteredUsers(filtered);
    }
  }, [users, userFilters, searchEmail]);

  const clearBookingFilters = () => {
    setBookingFilters({
      status: '',
      type: '',
      category: '',
      filter: '',
      search: ''
    });
    setBookingPagination({ currentPage: 1, itemsPerPage: 10 });
  };

  // Pagination helper functions
  const getPaginatedData = (data, pagination) => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems, itemsPerPage) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const handlePageChange = (type, newPage) => {
    if (type === 'queries') {
      setQueryPagination(prev => ({ ...prev, currentPage: newPage }));
    } else if (type === 'bookings') {
      setBookingPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleItemsPerPageChange = (type, newItemsPerPage) => {
    if (type === 'queries') {
      setQueryPagination({ currentPage: 1, itemsPerPage: newItemsPerPage });
    } else if (type === 'bookings') {
      setBookingPagination({ currentPage: 1, itemsPerPage: newItemsPerPage });
    }
  };

  // Reset pagination when filters change
  const resetQueryPagination = () => {
    setQueryPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const resetBookingPagination = () => {
    setBookingPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleTourPackageSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      
      // Add form fields
      Object.keys(tourPackageForm).forEach(key => {
        if (key === 'images') {
          // Handle multiple images
          tourPackageForm.images.forEach(image => {
            formData.append('images', image);
          });
        } else if (key === 'highlights') {
          // Convert highlights string to array
          const highlightsArray = tourPackageForm.highlights.split('\n').filter(h => h.trim());
          formData.append('highlights', JSON.stringify(highlightsArray));
        } else {
          formData.append(key, tourPackageForm[key]);
        }
      });

      await adminService.createTourPackage(formData);
      showSuccess('Tour package created successfully!');
      
      // Reset form
      setTourPackageForm({
        name: '',
        duration: '',
        summary: '',
        highlights: '',
        price: '',
        discount: '',
        inclusions: '',
        exclusions: '',
        pickupLocations: '',
        dropLocations: '',
        images: []
      });
      
      // Refresh tour packages data
      refetchTourPackages();
      refetchStats();
    } catch (error) {
      showError(error.message || 'Failed to create tour package');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setTourPackageForm(prev => ({
      ...prev,
      images: files
    }));
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await adminService.deleteUser(userId);
      showSuccess('User deleted successfully');
      
      // Remove user from synchronized data
      removeItem('users', userId);
      
      // Update filtered users
      setFilteredUsers(prev => prev.filter(user => user._id !== userId));
      
      // Refresh stats
      refetchStats();
    } catch (error) {
      showError(error.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  // Search functionality
  const handleSearchEmail = (searchTerm) => {
    setSearchEmail(searchTerm);
  };

  const clearSearch = () => {
    setSearchEmail('');
    setUserFilters({
      verification: '',
      sortBy: 'newest'
    });
  };

  const handleDeleteTourPackage = async (packageId, packageName) => {
    if (!window.confirm(`Are you sure you want to delete tour package "${packageName}"? This action cannot be undone and will affect all related bookings.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await adminService.deleteTourPackage(packageId);
      showSuccess('Tour package deleted successfully');
      
      // Remove package from synchronized data
      removeItem('tourPackages', packageId);
      
      // Refresh stats
      refetchStats();
    } catch (error) {
      showError(error.message || 'Failed to delete tour package');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToQuery = async (queryId, response) => {
    if (!response.trim()) {
      showError('Please enter a response');
      return;
    }

    setIsLoading(true);
    try {
      // Find the query to get user email
      const query = queries?.find(q => q._id === queryId);
      if (!query) {
        showError('Query not found');
        return;
      }

      console.log('🔄 Responding to query:', queryId, 'with response:', response.trim());

      // Update query with response and set status to resolved
      const result = await adminService.respondToQuery(queryId, {
        response: response.trim(),
        status: 'resolved' // Always set to resolved when responding
      });

      console.log('✅ Query response result:', result);

      // Send notification to user (optional - handled by backend)
      try {
        await notificationService.createNotification({
          recipientEmail: query.email || query.user?.email,
          type: 'query_response',
          title: 'Response to Your Query',
          message: `We have responded to your query: "${query.subject}". Response: ${response.trim().substring(0, 100)}${response.trim().length > 100 ? '...' : ''}`,
          relatedQuery: queryId,
          priority: 'high'
        });
      } catch (notificationError) {
        console.warn('Failed to send notification (non-critical):', notificationError);
      }

      showSuccess('Response sent successfully! Query marked as resolved and user has been notified.');
      
      // Clear the local response state for this query
      setQueryResponses(prev => {
        const updated = { ...prev };
        delete updated[queryId];
        return updated;
      });
      
      // Update query in synchronized data
      updateItem('queries', queryId, {
        response: response.trim(),
        status: 'resolved',
        respondedAt: new Date(),
        respondedBy: user
      });
      
      // Refresh stats
      refetchStats();
    } catch (error) {
      console.error('❌ Failed to respond to query:', error);
      showError(error.message || 'Failed to send response');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'users', 
      name: 'Users', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      id: 'queries', 
      name: 'Queries', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
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
      id: 'tour-packages', 
      name: 'Tour Packages', 
      icon: (
        <img src="/tour_package.png" alt="Tour Package" className="w-5 h-5" />
      )
    },
    { 
      id: 'add-package', 
      name: 'Add Package', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}! Manage your NextDrive Bihar platform.</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div 
                  className="bg-blue-50 p-4 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                  onClick={() => setActiveTab('users')}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-blue-600">{users?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition-colors duration-200"
                  onClick={() => setActiveTab('queries')}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Queries</p>
                      <p className="text-2xl font-bold text-green-600">{queries?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-purple-50 p-4 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors duration-200"
                  onClick={() => setActiveTab('tour-bookings')}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <img src="/tour_logo.svg" alt="Tour" className="w-8 h-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tour Bookings</p>
                      <p className="text-2xl font-bold text-purple-600">{tourBookings?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-orange-50 p-4 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors duration-200"
                  onClick={() => setActiveTab('car-bookings')}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <img src="/car_logo.svg" alt="Car" className="w-8 h-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Car Bookings</p>
                      <p className="text-2xl font-bold text-orange-600">{carBookings?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-indigo-50 p-4 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors duration-200"
                  onClick={() => setActiveTab('tour-packages')}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <img src="/tour_package.png" alt="Tour Package" className="w-8 h-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tour Packages</p>
                      <p className="text-2xl font-bold text-indigo-600">{tourPackages?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">All Users</h2>
                <div className="flex items-center space-x-4">
                  {/* Search Box */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by email or name..."
                      value={searchEmail}
                      onChange={(e) => handleSearchEmail(e.target.value)}
                      className="block w-80 pl-10 pr-10 py-2 border-2 border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchEmail && (
                      <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Results Count */}
                  <div className="text-sm text-gray-500">
                    {searchEmail || userFilters.verification || userFilters.sortBy !== 'newest' ? (
                      <>Showing {filteredUsers.length} of {users.length} users</>
                    ) : (
                      <>Total: {users.length} users</>
                    )}
                  </div>
                </div>
              </div>

              {/* User Filters */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Verification Status:</label>
                    <select
                      value={userFilters.verification}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, verification: e.target.value }))}
                      className="px-3 py-1 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Users</option>
                      <option value="verified">Verified Only</option>
                      <option value="unverified">Unverified Only</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Sort By:</label>
                    <select
                      value={userFilters.sortBy}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                      className="px-3 py-1 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="most-bookings">Most Bookings</option>
                      <option value="least-bookings">Least Bookings</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <button
                      onClick={clearSearch}
                      className="w-full px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  {searchEmail || userFilters.verification || userFilters.sortBy !== 'newest' ? (
                    <div>
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No users match your current filters
                      </p>
                      <button
                        onClick={clearSearch}
                        className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">No users found.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Admin Users Section */}
                  {filteredUsers.filter(user => user.role === 'admin').length > 0 && (
                    <div>
                      <div className="flex items-center mb-4">
                        <h3 className="text-lg font-semibold text-purple-700">Administrators</h3>
                        <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          {filteredUsers.filter(user => user.role === 'admin').length}
                        </span>
                        {searchEmail && (
                          <span className="ml-2 text-sm text-gray-500">
                            of {users.filter(user => user.role === 'admin').length} total
                          </span>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-purple-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth Provider</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.filter(user => user.role === 'admin').map((user) => (
                              <tr key={user._id} className="hover:bg-purple-25">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      {user.avatar ? (
                                        <img
                                          className="h-10 w-10 rounded-full object-cover"
                                          src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL}/${user.avatar}`}
                                          alt={user.name}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                      ) : null}
                                      <div className={`h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center ${user.avatar ? 'hidden' : 'flex'}`}>
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 flex items-center">
                                        {searchEmail && (user.name.toLowerCase().includes(searchEmail.toLowerCase()) || user.email.toLowerCase().includes(searchEmail.toLowerCase())) ? (
                                          <span dangerouslySetInnerHTML={{
                                            __html: user.name.replace(
                                              new RegExp(`(${searchEmail})`, 'gi'),
                                              '<mark class="bg-yellow-200">$1</mark>'
                                            )
                                          }} />
                                        ) : (
                                          user.name
                                        )}
                                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                          Admin
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {searchEmail && user.email.toLowerCase().includes(searchEmail.toLowerCase()) ? (
                                    <span dangerouslySetInnerHTML={{
                                      __html: user.email.replace(
                                        new RegExp(`(${searchEmail})`, 'gi'),
                                        '<mark class="bg-yellow-200">$1</mark>'
                                      )
                                    }} />
                                  ) : (
                                    user.email
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {user.isVerified ? 'Verified' : 'Not Verified'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                  {user.authProvider || 'local'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <span className="text-gray-400 text-xs">Admin Protected</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Regular Users Section */}
                  {filteredUsers.filter(user => user.role !== 'admin').length > 0 && (
                    <div>
                      <div className="flex items-center mb-4">
                        <h3 className="text-lg font-semibold text-blue-700">Regular Users</h3>
                        <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {filteredUsers.filter(user => user.role !== 'admin').length}
                        </span>
                        {searchEmail && (
                          <span className="ml-2 text-sm text-gray-500">
                            of {users.filter(user => user.role !== 'admin').length} total
                          </span>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth Provider</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.filter(user => user.role !== 'admin').map((user) => (
                              <tr key={user._id} className="hover:bg-blue-25">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      {user.avatar ? (
                                        <img
                                          className="h-10 w-10 rounded-full object-cover"
                                          src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL}/${user.avatar}`}
                                          alt={user.name}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                      ) : null}
                                      <div className={`h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ${user.avatar ? 'hidden' : 'flex'}`}>
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 flex items-center">
                                        {searchEmail && (user.name.toLowerCase().includes(searchEmail.toLowerCase()) || user.email.toLowerCase().includes(searchEmail.toLowerCase())) ? (
                                          <span dangerouslySetInnerHTML={{
                                            __html: user.name.replace(
                                              new RegExp(`(${searchEmail})`, 'gi'),
                                              '<mark class="bg-yellow-200">$1</mark>'
                                            )
                                          }} />
                                        ) : (
                                          user.name
                                        )}
                                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                          User
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {searchEmail && user.email.toLowerCase().includes(searchEmail.toLowerCase()) ? (
                                    <span dangerouslySetInnerHTML={{
                                      __html: user.email.replace(
                                        new RegExp(`(${searchEmail})`, 'gi'),
                                        '<mark class="bg-yellow-200">$1</mark>'
                                      )
                                    }} />
                                  ) : (
                                    user.email
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex space-x-2">
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-blue-600">
                                        {user.bookingStats?.tourBookings || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">Tours</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-orange-600">
                                        {user.bookingStats?.carBookings || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">Cars</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-gray-900">
                                        {user.bookingStats?.totalBookings || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">Total</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {user.isVerified ? 'Verified' : 'Not Verified'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                  {user.authProvider || 'local'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => handleDeleteUser(user._id, user.name)}
                                    disabled={isLoading}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Delete</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Queries Tab */}
          {activeTab === 'queries' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Customer Queries Management</h2>
                <div className="flex items-center space-x-4">
                  {/* Search Box */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by ID, subject, message, user name, or email..."
                      value={querySearch}
                      onChange={(e) => setQuerySearch(e.target.value)}
                      className="block w-80 pl-10 pr-10 py-2 border-2 border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {querySearch && (
                      <button
                        onClick={() => setQuerySearch('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Results Count */}
                  <div className="text-sm text-gray-500">
                    {querySearch.trim() || Object.values(queryFilters).some(filter => filter) ? (
                      <>Showing {filteredQueries.length} of {queries?.length || 0} queries</>
                    ) : (
                      <>Total: {queries?.length || 0} queries</>
                    )}
                  </div>
                </div>
              </div>

              {/* Query Statistics */}
              {queries && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{queries.length}</div>
                    <div className="text-sm text-blue-700">Total Queries</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{queries.filter(q => q.status === 'pending').length}</div>
                    <div className="text-sm text-yellow-700">Pending</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{queries.filter(q => q.status === 'resolved').length}</div>
                    <div className="text-sm text-green-700">Resolved</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{queries.filter(q => q.status === 'closed').length}</div>
                    <div className="text-sm text-gray-700">Closed</div>
                  </div>
                </div>
              )}

              {/* Query Filters */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                    <select
                      value={queryFilters.status}
                      onChange={(e) => setQueryFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="px-3 py-1 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
                    <select
                      value={queryFilters.category}
                      onChange={(e) => setQueryFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="px-3 py-1 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      <option value="car-booking">Car Booking</option>
                      <option value="tour-package">Tour Package</option>
                      <option value="others">Others</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        setQueryFilters({ status: '', category: '', filter: '' });
                        setQuerySearch('');
                      }}
                      className="w-full px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Queries List */}
              {filteredQueries.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No queries found</h3>
                  <p className="text-gray-500">
                    {Object.values(queryFilters).some(filter => filter) || querySearch.trim()
                      ? 'Try adjusting your filters or search terms to see more queries.' 
                      : 'No customer queries have been submitted yet.'}
                  </p>
                  {(Object.values(queryFilters).some(filter => filter) || querySearch.trim()) && (
                    <button
                      onClick={() => {
                        setQueryFilters({ status: '', category: '', filter: '' });
                        setQuerySearch('');
                      }}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="grid gap-6">
                    {getPaginatedData(filteredQueries, queryPagination).map((query) => (
                      <div key={query._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">{query.subject}</h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  query.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                  query.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  query.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {query.statusDisplay || query.status}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                  {query.displayCategory || query.category}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="font-medium">{query.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span>{query.email}</span>
                                </div>
                                {query.phone && (
                                  <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>{query.phone}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Submitted: {new Date(query.createdAt).toLocaleDateString()}</span>
                                {query.respondedAt && (
                                  <span>• Responded: {new Date(query.respondedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Message:</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm text-gray-700 leading-relaxed">{query.message}</p>
                            </div>
                          </div>

                          {query.response && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Response:</h4>
                              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                                <p className="text-sm text-gray-700 leading-relaxed">{query.response}</p>
                                {query.respondedBy && (
                                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Responded by {query.respondedBy.name} on {new Date(query.respondedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Rating Display */}
                          {query.rating && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">User Feedback:</h4>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    query.rating === 'satisfied' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {query.rating === 'satisfied' ? '😊 Satisfied' : '😞 Unsatisfied'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Rated on {new Date(query.ratedAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {query.feedback && (
                                  <p className="text-sm text-gray-700">
                                    <strong>Additional Feedback:</strong> {query.feedback}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Response Form - Only show for pending queries */}
                          {query.status === 'pending' && (
                            <div className="border-t border-gray-100 pt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Respond to Query:</h4>
                              <div className="space-y-3">
                                <textarea
                                  placeholder="Type your response here..."
                                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  rows="4"
                                  value={queryResponses[query._id] || ''}
                                  onChange={(e) => {
                                    setQueryResponses(prev => ({
                                      ...prev,
                                      [query._id]: e.target.value
                                    }));
                                  }}
                                />
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => handleRespondToQuery(query._id, queryResponses[query._id] || '')}
                                    disabled={isLoading || !queryResponses[query._id]?.trim()}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Send Response & Mark Resolved
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Status indicators for resolved/closed queries */}
                          {query.status === 'resolved' && (
                            <div className="border-t border-gray-100 pt-4">
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-sm text-green-700 font-medium">
                                    This query has been resolved and is waiting for user feedback.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {query.status === 'closed' && (
                            <div className="border-t border-gray-100 pt-4">
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <p className="text-sm text-gray-700 font-medium">
                                    This query has been closed after receiving user feedback.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {filteredQueries.length > 0 && (
                    <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Show:</label>
                          <select
                            value={queryPagination.itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange('queries', parseInt(e.target.value))}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                          <span className="text-sm text-gray-500">per page</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Showing {((queryPagination.currentPage - 1) * queryPagination.itemsPerPage) + 1} to {Math.min(queryPagination.currentPage * queryPagination.itemsPerPage, filteredQueries.length)} of {filteredQueries.length} queries
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange('queries', queryPagination.currentPage - 1)}
                          disabled={queryPagination.currentPage === 1}
                          className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: getTotalPages(filteredQueries.length, queryPagination.itemsPerPage) }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange('queries', page)}
                            className={`px-3 py-1 text-sm font-medium rounded-md ${
                              page === queryPagination.currentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => handlePageChange('queries', queryPagination.currentPage + 1)}
                          disabled={queryPagination.currentPage === getTotalPages(filteredQueries.length, queryPagination.itemsPerPage)}
                          className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tour Bookings Tab */}
          {activeTab === 'tour-bookings' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Tour Package Bookings</h2>
                <div className="flex items-center space-x-4">
                  {/* Search Box */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by ID, reference, tour package, user name, or email..."
                      value={bookingFilters.search}
                      onChange={(e) => setBookingFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="block w-96 pl-10 pr-10 py-2 border-2 border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {bookingFilters.search && (
                      <button
                        onClick={() => setBookingFilters(prev => ({ ...prev, search: '' }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Results Count */}
                  <div className="text-sm text-gray-500">
                    {bookingFilters.search.trim() || bookingFilters.status || bookingFilters.filter ? (
                      <>Showing {filteredTourBookings.length} of {bookingStats.total} bookings</>
                    ) : (
                      <>Total: {bookingStats.total} bookings</>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{bookingStats.total}</div>
                  <div className="text-sm text-blue-700">Total Bookings</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{bookingStats.pending}</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{bookingStats.confirmed}</div>
                  <div className="text-sm text-green-700">Confirmed</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{bookingStats.completed}</div>
                  <div className="text-sm text-purple-700">Completed</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{bookingStats.cancelled}</div>
                  <div className="text-sm text-red-700">Cancelled</div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Status:
                    </label>
                    <select
                      value={bookingFilters.status}
                      onChange={(e) => setBookingFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={() => setBookingFilters({
                        status: '',
                        type: '',
                        category: '',
                        filter: '',
                        search: ''
                      })}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
              
              {filteredTourBookings.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                  <p className="text-gray-600 mb-4">
                    {bookingFilters.status || bookingFilters.filter || bookingFilters.search.trim()
                      ? 'Try adjusting your filters or search terms to see more results.' 
                      : 'No tour bookings have been made yet.'}
                  </p>
                  {(bookingFilters.status || bookingFilters.filter || bookingFilters.search.trim()) && (
                    <button
                      onClick={() => setBookingFilters({
                        status: '',
                        type: '',
                        category: '',
                        filter: '',
                        search: ''
                      })}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="space-y-4">
                    {getPaginatedData(filteredTourBookings, bookingPagination).map((booking) => (
                      <AdminBookingCard 
                        key={booking._id} 
                        booking={booking} 
                        onUpdate={() => {
                          refetchTourBookings();
                          refetchStats();
                        }}
                        type="tour"
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {filteredTourBookings.length > 0 && (
                    <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Show:</label>
                          <select
                            value={bookingPagination.itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange('bookings', parseInt(e.target.value))}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                          <span className="text-sm text-gray-500">per page</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Showing {((bookingPagination.currentPage - 1) * bookingPagination.itemsPerPage) + 1} to {Math.min(bookingPagination.currentPage * bookingPagination.itemsPerPage, filteredTourBookings.length)} of {filteredTourBookings.length} bookings
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange('bookings', bookingPagination.currentPage - 1)}
                          disabled={bookingPagination.currentPage === 1}
                          className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: getTotalPages(filteredTourBookings.length, bookingPagination.itemsPerPage) }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange('bookings', page)}
                            className={`px-3 py-1 text-sm font-medium rounded-md ${
                              page === bookingPagination.currentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => handlePageChange('bookings', bookingPagination.currentPage + 1)}
                          disabled={bookingPagination.currentPage === getTotalPages(filteredTourBookings.length, bookingPagination.itemsPerPage)}
                          className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Car Bookings Tab */}
          {activeTab === 'car-bookings' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Car Rental Bookings</h2>
              {carBookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No car bookings found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drop-off</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {carBookings.map((booking) => (
                        <tr key={booking._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.user?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.carType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.pickupDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.dropoffDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{booking.totalAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tour Packages Tab */}
          {activeTab === 'tour-packages' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Tour Packages Management</h2>
                <div className="text-sm text-gray-500">
                  Total: {tourPackages.length} packages
                </div>
              </div>
              
              {tourPackages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <img src="/tour_package.png" alt="Tour Package" className="w-16 h-16 mx-auto opacity-40" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tour Packages Found</h3>
                  <p className="text-gray-500 mb-4">Create your first tour package to get started.</p>
                  <button
                    onClick={() => setActiveTab('add-package')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Tour Package
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tourPackages.map((pkg) => (
                    <div key={pkg._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      {/* Package Image */}
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={pkg.images?.featured ? 
                            (pkg.images.featured.startsWith('http') ? 
                              pkg.images.featured : 
                              `${import.meta.env.VITE_API_URL}/${pkg.images.featured}`) :
                            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                          }
                          alt={pkg.title}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            pkg.status === 'Published' ? 'bg-green-100 text-green-800' :
                            pkg.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {pkg.status}
                          </span>
                        </div>

                        {/* Featured Badge */}
                        {pkg.featured && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              Featured
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Package Content */}
                      <div className="p-4">
                        {/* Title and Duration */}
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{pkg.title}</h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {pkg.duration.days} Days / {pkg.duration.nights} Nights
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {pkg.shortDescription || pkg.description}
                        </p>

                        {/* Highlights */}
                        {pkg.highlights && pkg.highlights.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {pkg.highlights.slice(0, 3).map((highlight, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium"
                                >
                                  {highlight}
                                </span>
                              ))}
                              {pkg.highlights.length > 3 && (
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                                  +{pkg.highlights.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Statistics */}
                        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              {pkg.bookingStats?.totalBookings || 0}
                            </div>
                            <div className="text-xs text-gray-500">Total Bookings</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              {pkg.bookingStats?.totalTravelers || 0}
                            </div>
                            <div className="text-xs text-gray-500">Total Travelers</div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold text-gray-900">₹{pkg.pricing.basePrice.toLocaleString()}</span>
                              {pkg.pricing.originalPrice > pkg.pricing.basePrice && (
                                <span className="text-sm text-gray-500 line-through ml-2">₹{pkg.pricing.originalPrice.toLocaleString()}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">per person</div>
                          </div>
                        </div>

                        {/* Created Info */}
                        <div className="text-xs text-gray-500 mb-4">
                          Created: {new Date(pkg.createdAt).toLocaleDateString()}
                          {pkg.createdBy?.name && (
                            <span> by {pkg.createdBy.name}</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteTourPackage(pkg._id, pkg.title)}
                            disabled={isLoading}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                          
                          <button
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center space-x-1"
                            onClick={() => {
                              // You can add edit functionality here later
                              showSuccess('Edit functionality coming soon!');
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Package Tab */}
          {activeTab === 'add-package' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Add New Tour Package</h2>
              <form onSubmit={handleTourPackageSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Package Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Buddhist Circuit Tour"
                      value={tourPackageForm.name}
                      onChange={(e) => setTourPackageForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 5 Days / 4 Nights"
                      value={tourPackageForm.duration}
                      onChange={(e) => setTourPackageForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g., 15999"
                      value={tourPackageForm.price}
                      onChange={(e) => setTourPackageForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g., 4000"
                      value={tourPackageForm.discount}
                      onChange={(e) => setTourPackageForm(prev => ({ ...prev, discount: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Original price will be calculated as Price + Discount</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Summary *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Brief description of the tour package..."
                    value={tourPackageForm.summary}
                    onChange={(e) => setTourPackageForm(prev => ({ ...prev, summary: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Highlights (one per line) *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Bodh Gaya&#10;Nalanda&#10;Rajgir&#10;Vaishali"
                    value={tourPackageForm.highlights}
                    onChange={(e) => setTourPackageForm(prev => ({ ...prev, highlights: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter each highlight on a new line</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inclusions (one per line)</label>
                    <textarea
                      rows={4}
                      placeholder="Transportation&#10;Accommodation&#10;Meals as per itinerary&#10;Professional guide"
                      value={tourPackageForm.inclusions}
                      onChange={(e) => setTourPackageForm(prev => ({ ...prev, inclusions: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">What's included in the package</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exclusions (one per line)</label>
                    <textarea
                      rows={4}
                      placeholder="Personal expenses&#10;Travel insurance&#10;Tips and gratuities&#10;Extra activities"
                      value={tourPackageForm.exclusions}
                      onChange={(e) => setTourPackageForm(prev => ({ ...prev, exclusions: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">What's not included in the package</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Locations (one per line)</label>
                    <textarea
                      rows={3}
                      placeholder="Patna Railway Station&#10;Patna Airport&#10;Gaya Railway Station&#10;Hotel pickup available"
                      value={tourPackageForm.pickupLocations}
                      onChange={(e) => setTourPackageForm(prev => ({ ...prev, pickupLocations: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Available pickup points</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Drop Locations (one per line)</label>
                    <textarea
                      rows={3}
                      placeholder="Patna Railway Station&#10;Patna Airport&#10;Gaya Railway Station&#10;Hotel drop available"
                      value={tourPackageForm.dropLocations}
                      onChange={(e) => setTourPackageForm(prev => ({ ...prev, dropLocations: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Available drop-off points</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Package Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Select multiple images for the tour package</p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Create Tour Package</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// AdminBookingCard Component
const AdminBookingCard = ({ booking, onUpdate, type }) => {
  const { showSuccess, showError } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const handleStatusUpdate = async (newStatus) => {
    if (window.confirm(`Are you sure you want to ${newStatus} this booking?`)) {
      setIsUpdating(true);
      try {
        if (newStatus === 'confirmed') {
          await adminService.confirmBooking(booking._id);
        } else if (newStatus === 'cancelled') {
          const reason = prompt('Please provide a reason for cancellation:');
          if (reason) {
            await adminService.cancelBooking(booking._id, reason);
          } else {
            setIsUpdating(false);
            return;
          }
        } else if (newStatus === 'completed') {
          await adminService.completeBooking(booking._id);
        }
        
        showSuccess(`Booking ${newStatus} successfully!`);
        onUpdate();
      } catch (error) {
        showError(error.message || `Failed to ${newStatus} booking`);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {booking.tourPackage?.title || booking.tourPackage?.name || 'Tour Package'}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span className="ml-1">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="font-medium">ID: {booking.bookingReference}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{booking.user?.name || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Key Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 12a2 2 0 002 2h6a2 2 0 002-2L15 7" />
              </svg>
              <span className="text-xs font-medium text-gray-500 uppercase">Travel Date</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{formatDate(booking.travelDate)}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-medium text-gray-500 uppercase">Travelers</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{booking.numberOfTravelers} people</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-xs font-medium text-gray-500 uppercase">Amount</span>
            </div>
            <p className="text-sm font-semibold text-green-600">{formatCurrency(booking.totalAmount)}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 12a2 2 0 002 2h6a2 2 0 002-2L15 7" />
              </svg>
              <span className="text-xs font-medium text-gray-500 uppercase">Booked On</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{formatDate(booking.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      <div className="px-6 py-4">
        {booking.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-yellow-800 font-medium">Awaiting confirmation</p>
            </div>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800 font-medium">Booking confirmed - Ready for travel!</p>
            </div>
          </div>
        )}

        {booking.status === 'completed' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <p className="text-sm text-blue-800 font-medium">Trip completed successfully!</p>
            </div>
          </div>
        )}

        {booking.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-red-800 font-medium">
                    Cancelled by {booking.cancelledByType === 'user' ? 'customer' : 'admin'}
                    {booking.cancelledBy && ` (${booking.cancelledBy.name})`}
                  </p>
                  {booking.cancellationReason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {booking.cancellationReason}</p>
                  )}
                </div>
              </div>
              {booking.cancelledAt && (
                <span className="text-xs text-red-500 font-medium">
                  {formatDate(booking.cancelledAt)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-gray-50 bg-gray-50 rounded-b-xl">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors gap-1"
          >
            <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
          
          <div className="flex gap-2">
            {booking.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isUpdating ? 'Updating...' : 'Confirm'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </>
            )}
            
            {booking.status === 'confirmed' && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={isUpdating}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isUpdating ? 'Updating...' : 'Mark Complete'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Contact Number</label>
                <p className="text-sm font-medium text-gray-900">{booking.contactNumber}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                <p className="text-sm font-medium text-gray-900">{booking.user?.email || 'N/A'}</p>
              </div>
              {booking.emergencyContact && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">WhatsApp Number</label>
                  <p className="text-sm font-medium text-gray-900">{booking.emergencyContact}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {booking.pickupLocation && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Pickup Location</label>
                  <p className="text-sm font-medium text-gray-900">{booking.pickupLocation}</p>
                </div>
              )}
              {booking.dropLocation && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Drop Location</label>
                  <p className="text-sm font-medium text-gray-900">{booking.dropLocation}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Payment Status</label>
                <p className="text-sm font-medium text-gray-900">{booking.paymentStatus || 'pending'}</p>
              </div>
            </div>
          </div>
          
          {booking.specialRequests && (
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 uppercase">Special Requests</label>
              <p className="text-sm font-medium text-gray-900 mt-1">{booking.specialRequests}</p>
            </div>
          )}
          
          {booking.cancellationReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Cancellation Details</h4>
              <div className="space-y-1">
                <p className="text-sm text-red-700">
                  <span className="font-medium">Cancelled by:</span> {booking.cancelledByType === 'user' ? 'Customer' : 'Admin'}
                  {booking.cancelledBy && ` (${booking.cancelledBy.name})`}
                </p>
                <p className="text-sm text-red-700">
                  <span className="font-medium">Reason:</span> {booking.cancellationReason}
                </p>
                {booking.cancelledAt && (
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Date:</span> {formatDate(booking.cancelledAt)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;