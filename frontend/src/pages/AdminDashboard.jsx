import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import { useDataSync } from '../hooks/useDataSync';
import adminService from '../services/adminService';
import notificationService from '../services/notificationService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { updateItem, removeItem } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Data fetching hooks
  const fetchQueries = useCallback(() => adminService.getQueries(), []);
  const fetchTourBookings = useCallback(() => adminService.getTourBookings(), []);
  const fetchCarBookings = useCallback(() => adminService.getCarBookings(), []);
  const fetchTourPackages = useCallback(() => adminService.getTourPackages(), []);
  const fetchUsers = useCallback(() => adminService.getUsers(), []);
  const fetchStats = useCallback(() => adminService.getStats(), []);

  const { data: queries = [], refetch: refetchQueries } = useDataSync('queries', fetchQueries, []);
  const { data: tourBookings = [], refetch: refetchTourBookings } = useDataSync('tourBookings', fetchTourBookings, []);
  const { data: carBookings = [], refetch: refetchCarBookings } = useDataSync('carBookings', fetchCarBookings, []);
  const { data: tourPackages = [], refetch: refetchTourPackages } = useDataSync('tourPackages', fetchTourPackages, []);
  const { data: users = [], refetch: refetchUsers } = useDataSync('users', fetchUsers, []);
  const { data: stats = {}, refetch: refetchStats } = useDataSync('stats', fetchStats, []);
  
  // Local state for responses and forms
  const [queryResponses, setQueryResponses] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState(''); // New verification filter

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

  // Filter data based on search and status
  const getFilteredData = (data, type) => {
    if (!data || !Array.isArray(data)) return [];
    
    let filtered = [...data];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        switch (type) {
          case 'queries':
            return item.subject?.toLowerCase().includes(search) ||
                   item.message?.toLowerCase().includes(search) ||
                   item.name?.toLowerCase().includes(search) ||
                   item.email?.toLowerCase().includes(search);
          case 'bookings':
            return item.bookingReference?.toLowerCase().includes(search) ||
                   item.user?.name?.toLowerCase().includes(search) ||
                   item.user?.email?.toLowerCase().includes(search) ||
                   item.tourPackage?.title?.toLowerCase().includes(search);
          case 'users':
            return item.name?.toLowerCase().includes(search) ||
                   item.email?.toLowerCase().includes(search);
          case 'packages':
            return item.title?.toLowerCase().includes(search) ||
                   item.name?.toLowerCase().includes(search);
          default:
            return true;
        }
      });
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply verification filter for users
    if (type === 'users' && verificationFilter) {
      filtered = filtered.filter(item => {
        if (verificationFilter === 'verified') return item.isVerified === true;
        if (verificationFilter === 'unverified') return item.isVerified === false;
        return true;
      });
    }
    
    return filtered;
  };

  // Get pending counts for badges
  const getPendingCount = (data) => {
    if (!data || !Array.isArray(data)) return 0;
    return data.filter(item => item.status === 'pending').length;
  };

  // Handle query response
  const handleRespondToQuery = async (queryId, response) => {
    if (!response.trim()) {
      showError('Please enter a response');
      return;
    }

    setIsLoading(true);
    try {
      const query = queries.find(q => q._id === queryId);
      if (!query) {
        showError('Query not found');
        return;
      }

      await adminService.respondToQuery(queryId, {
        response: response.trim(),
        status: 'resolved'
      });

      // Send notification
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
        console.warn('Failed to send notification:', notificationError);
      }

      showSuccess('Response sent successfully!');
      
      // Clear response and update data
      setQueryResponses(prev => {
        const updated = { ...prev };
        delete updated[queryId];
        return updated;
      });
      
      updateItem('queries', queryId, {
        response: response.trim(),
        status: 'resolved',
        respondedAt: new Date(),
        respondedBy: user
      });
      
      refetchStats();
    } catch (error) {
      showError(error.message || 'Failed to send response');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking status update
  const handleBookingStatusUpdate = async (bookingId, newStatus, reason = '', bookingType = 'tour') => {
    setIsLoading(true);
    try {
      if (bookingType === 'car') {
        if (newStatus === 'confirmed') {
          await adminService.confirmCarBooking(bookingId);
        } else if (newStatus === 'cancelled') {
          await adminService.cancelCarBooking(bookingId, reason);
        } else if (newStatus === 'completed') {
          await adminService.completeCarBooking(bookingId);
        }
        showSuccess(`Car booking ${newStatus} successfully!`);
        refetchCarBookings();
      } else {
        if (newStatus === 'confirmed') {
          await adminService.confirmBooking(bookingId);
        } else if (newStatus === 'cancelled') {
          await adminService.cancelBooking(bookingId, reason);
        } else if (newStatus === 'completed') {
          await adminService.completeBooking(bookingId);
        }
        showSuccess(`Booking ${newStatus} successfully!`);
        refetchTourBookings();
      }
      refetchStats();
    } catch (error) {
      showError(error.message || `Failed to ${newStatus} booking`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await adminService.deleteUser(userId);
      showSuccess('User deleted successfully');
      removeItem('users', userId);
      refetchStats();
    } catch (error) {
      showError(error.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tour package deletion
  const handleDeleteTourPackage = async (packageId, packageName) => {
    if (!window.confirm(`Are you sure you want to delete tour package "${packageName}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await adminService.deleteTourPackage(packageId);
      showSuccess('Tour package deleted successfully');
      removeItem('tourPackages', packageId);
      refetchStats();
    } catch (error) {
      showError(error.message || 'Failed to delete tour package');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tour package form submission
  const handleTourPackageSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      
      Object.keys(tourPackageForm).forEach(key => {
        if (key === 'images') {
          tourPackageForm.images.forEach(image => {
            formData.append('images', image);
          });
        } else if (key === 'highlights') {
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

  // Tab configuration with badges
  const tabs = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: '📊',
      badge: null
    },
    { 
      id: 'queries', 
      name: 'Queries', 
      icon: '💬',
      badge: getPendingCount(queries)
    },
    { 
      id: 'tour-bookings', 
      name: 'Tour Bookings', 
      icon: '🎯',
      badge: getPendingCount(tourBookings)
    },
    { 
      id: 'car-bookings', 
      name: 'Car Bookings', 
      icon: '🚗',
      badge: getPendingCount(carBookings)
    },
    { 
      id: 'users', 
      name: 'Users', 
      icon: '👥',
      badge: null
    },
    { 
      id: 'tour-packages', 
      name: 'Tour Packages', 
      icon: '📦',
      badge: null
    },
    { 
      id: 'add-package', 
      name: 'Add Package', 
      icon: '➕',
      badge: null
    },
    { 
      id: 'gallery', 
      name: 'Gallery', 
      icon: '🖼️',
      badge: null
    },
    { 
      id: 'offline-booking', 
      name: 'Offline Booking', 
      icon: '📋',
      badge: null
    },
    { 
      id: 'drivers', 
      name: 'Drivers', 
      icon: '🚘',
      badge: null
    }
  ];

  // Reset pagination when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Top header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-900">Admin Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 hidden md:block">{user?.name}</span>
              <a href="/admin/cars"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h8M15 7h3l2 6v3h-2m-4 0H9" />
                </svg>
                Manage Cars
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── Layout: sidebar + main ── */}
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">

        {/* Sidebar — lg+ only */}
        <aside className="hidden lg:flex flex-col w-52 xl:w-60 bg-white border-r border-gray-200 shrink-0 sticky top-14 max-h-[calc(100vh-56px)] overflow-y-auto">
          <nav className="flex flex-col gap-0.5 p-3 pb-6">

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">Main</p>
            {tabs.filter(t => ['overview','queries'].includes(t.id)).map(tab => (
              <SidebarBtn key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => handleTabChange(tab.id)} />
            ))}

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-4 pb-1">Bookings</p>
            {tabs.filter(t => ['tour-bookings','car-bookings','offline-booking'].includes(t.id)).map(tab => (
              <SidebarBtn key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => handleTabChange(tab.id)} />
            ))}

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-4 pb-1">Manage</p>
            {tabs.filter(t => ['users','tour-packages','add-package'].includes(t.id)).map(tab => (
              <SidebarBtn key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => handleTabChange(tab.id)} />
            ))}

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-4 pb-1">Pages</p>
            {[
              { href: '/admin/drivers',         label: 'Drivers',         icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
              { href: '/admin/gallery',          label: 'Gallery',         icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { href: '/admin/offline-booking',  label: 'Create Booking',  icon: 'M12 4v16m8-8H4' },
            ].map(({ href, label, icon }) => (
              <a key={href} href={href}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                {label}
                <svg className="w-3 h-3 ml-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-3 sm:px-4 lg:px-6 py-4 lg:py-5">

          {/* Mobile tab bar */}
          <div className="lg:hidden bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.filter(t => !['gallery','offline-booking','drivers'].includes(t.id)).map(tab => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1 px-3 py-3 text-xs font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                  <span>{tab.icon}</span>
                  <span>{tab.name.split(' ')[0]}</span>
                  {tab.badge > 0 && <span className="min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{tab.badge}</span>}
                </button>
              ))}
              {/* Mobile quick links */}
              {[
                { href: '/admin/drivers', label: '🚘 Drivers' },
                { href: '/admin/gallery', label: '🖼️ Gallery' },
                { href: '/admin/offline-booking', label: '📋 New Booking' },
              ].map(({ href, label }) => (
                <a key={href} href={href}
                  className="flex items-center gap-1 px-3 py-3 text-xs font-medium whitespace-nowrap flex-shrink-0 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Content card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Platform Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard title="Total Users"    value={users.length}         icon="👥" color="blue"   onClick={() => setActiveTab('users')} />
                <StatCard title="Queries"        value={queries.length}       badge={getPendingCount(queries)}      icon="💬" color="green"  onClick={() => setActiveTab('queries')} />
                <StatCard title="Tour Bookings"  value={tourBookings.length}  badge={getPendingCount(tourBookings)} icon="🎯" color="purple" onClick={() => setActiveTab('tour-bookings')} />
                <StatCard title="Car Bookings"   value={carBookings.length}   badge={getPendingCount(carBookings)}  icon="🚗" color="orange" onClick={() => setActiveTab('car-bookings')} />
              </div>
              <div className="mt-3 sm:mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard title="Offline / Walk-in"   value={carBookings.filter(b => b.isOfflineBooking).length}  badge={carBookings.filter(b => b.isOfflineBooking && b.status === 'pending').length || null}  icon="📋" color="green"  onClick={() => setActiveTab('offline-booking')} />
                <StatCard title="Online Car Bookings" value={carBookings.filter(b => !b.isOfflineBooking).length} badge={carBookings.filter(b => !b.isOfflineBooking && b.status === 'pending').length || null} icon="💻" color="blue"   onClick={() => setActiveTab('car-bookings')} />
                <StatCard title="Tour Packages"       value={Array.isArray(tourPackages) ? tourPackages.length : 0} icon="📦" color="purple" onClick={() => setActiveTab('tour-packages')} />
              </div>
            </div>
          )}
          {/* Queries Tab */}
          {activeTab === 'queries' && (
            <QueriesSection queries={getFilteredData(queries, 'queries')} searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} queryResponses={queryResponses} setQueryResponses={setQueryResponses} onRespond={handleRespondToQuery} isLoading={isLoading} currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage} />
          )}
          {/* Tour Bookings Tab */}
          {activeTab === 'tour-bookings' && (
            <BookingsSection bookings={getFilteredData(tourBookings, 'bookings')} searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onStatusUpdate={handleBookingStatusUpdate} isLoading={isLoading} type="tour" currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage} />
          )}
          {/* Car Bookings Tab */}
          {activeTab === 'car-bookings' && (
            <CarBookingsSplitSection onlineBookings={getFilteredData(carBookings.filter(b => !b.isOfflineBooking), 'bookings')} offlineBookings={getFilteredData(carBookings.filter(b => b.isOfflineBooking), 'bookings')} searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onStatusUpdate={handleBookingStatusUpdate} onRefetch={refetchCarBookings} isLoading={isLoading} currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage} />
          )}
          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersSection users={getFilteredData(users, 'users')} searchTerm={searchTerm} setSearchTerm={setSearchTerm} verificationFilter={verificationFilter} setVerificationFilter={setVerificationFilter} onDeleteUser={handleDeleteUser} isLoading={isLoading} currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={10} />
          )}
          {/* Tour Packages Tab */}
          {activeTab === 'tour-packages' && (
            <TourPackagesSection packages={getFilteredData(tourPackages, 'packages')} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onDeletePackage={handleDeleteTourPackage} onAddPackage={() => setActiveTab('add-package')} isLoading={isLoading} currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={12} />
          )}
          {/* Add Package Tab */}
          {activeTab === 'add-package' && (
            <AddPackageSection form={tourPackageForm} setForm={setTourPackageForm} onSubmit={handleTourPackageSubmit} onImageChange={handleImageChange} isLoading={isLoading} />
          )}
          {/* Offline Booking placeholder */}
          {activeTab === 'offline-booking' && (
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">Offline / Walk-in Bookings</h3>
              <p className="text-sm text-gray-500 mb-4">Create bookings for WhatsApp or walk-in customers.</p>
              <a href="/admin/offline-booking" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
                Open Booking Tool
              </a>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
};

// ── SidebarBtn helper ────────────────────────────────────────────────────────
const SidebarBtn = ({ tab, active, onClick }) => (
  <button onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
    <span className="text-base w-5 text-center flex-shrink-0">{tab.icon}</span>
    <span className="flex-1 truncate">{tab.name}</span>
    {tab.badge > 0 && <span className="ml-auto min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{tab.badge}</span>}
  </button>
);


// Simplified StatCard Component
const StatCard = ({ title, value, badge, icon, color, onClick }) => {
  const styles = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100',   icon: 'bg-blue-100' },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'bg-emerald-100' },
    purple: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', icon: 'bg-violet-100' },
    orange: { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100',  icon: 'bg-amber-100' },
  };
  const s = styles[color] || styles.blue;

  return (
    <div
      className={`group relative p-4 sm:p-5 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md ${s.bg} ${s.border}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate mb-1">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${s.text}`}>{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg ${s.icon} flex items-center justify-center text-lg flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {badge > 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-amber-700">{badge} pending</span>
        </div>
      )}
    </div>
  );
};

// Simplified Queries Section
const QueriesSection = ({ queries, searchTerm, setSearchTerm, statusFilter, setStatusFilter, queryResponses, setQueryResponses, onRespond, isLoading, currentPage, setCurrentPage, itemsPerPage }) => {
  // Pagination calculations
  const totalPages = Math.ceil(queries.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQueries = queries.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Customer Queries</h2>
          <span className="text-xs text-gray-500 font-medium">{queries.length} total</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white text-gray-700"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      {queries.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, queries.length)} of {queries.length} queries
        </div>
      )}

      {queries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No queries found</h3>
          <p className="text-sm sm:text-base text-gray-500">No customer queries match your current filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {currentQueries.map((query) => (
              <QueryCard
                key={query._id}
                query={query}
                response={queryResponses[query._id] || ''}
                setResponse={(response) => setQueryResponses(prev => ({ ...prev, [query._id]: response }))}
                onRespond={onRespond}
                isLoading={isLoading}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
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
      )}
    </div>
  );
};

// Simplified Query Card - Redesigned to match Booking Card theme with Mobile Optimization
const QueryCard = ({ query, response, setResponse, onRespond, isLoading }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'resolved':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'closed':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
      default:
        return null;
    }
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

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header Section - Mobile Optimized */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex flex-col gap-3">
          {/* Top Row: Icon + Title + Status */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">{query.subject}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold border-2 ${getStatusColor(query.status)}`}>
                {getStatusIcon(query.status)}
                <span className="capitalize">{query.status}</span>
              </span>
            </div>
          </div>

          {/* User Info Row - Stacked on Mobile */}
          <div className="flex flex-col gap-2 text-xs sm:text-sm text-gray-600 pl-11 sm:pl-0">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium truncate">{query.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{query.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">{formatDate(query.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Mobile Optimized */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Query Message */}
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Customer Message</h4>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border-l-4 border-purple-400">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed break-words">{query.message}</p>
          </div>
        </div>

        {/* Admin Response */}
        {query.response && (
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Admin Response</h4>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 sm:p-4 border-l-4 border-green-400">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed break-words">{query.response}</p>
              {query.respondedAt && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Responded on {formatDate(query.respondedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Response Form for Pending Queries - Mobile Optimized */}
        {query.status === 'pending' && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border-2 border-blue-200">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Write Your Response</h4>
            </div>
            <div className="space-y-3">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response to the customer..."
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all resize-none"
                rows={4}
              />
              <button
                onClick={() => onRespond(query._id, response)}
                disabled={isLoading || !response.trim()}
                className="w-full px-4 py-3 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send Response</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// Simplified Bookings Section
// Split car bookings into Online (by users) and Walk-in/Offline sections
const CarBookingsSplitSection = ({
  onlineBookings, offlineBookings,
  searchTerm, setSearchTerm, statusFilter, setStatusFilter,
  onStatusUpdate, onRefetch, isLoading, currentPage, setCurrentPage, itemsPerPage,
}) => {
  const [activeSource, setActiveSource] = useState('online'); // 'online' | 'offline'

  const bookings = activeSource === 'online' ? onlineBookings : offlineBookings;
  const pendingOnline  = onlineBookings.filter(b => b.status === 'pending').length;
  const pendingOffline = offlineBookings.filter(b => b.status === 'pending').length;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Car Bookings</h2>
          <span className="text-xs text-gray-500 font-medium">
            {onlineBookings.length + offlineBookings.length} total
          </span>
        </div>

        {/* Source toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => { setActiveSource('online'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeSource === 'online'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Online Bookings
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              activeSource === 'online' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
            }`}>{onlineBookings.length}</span>
            {pendingOnline > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingOnline}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveSource('offline'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeSource === 'offline'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Walk-in / Offline
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              activeSource === 'offline' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'
            }`}>{offlineBookings.length}</span>
            {pendingOffline > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingOffline}
              </span>
            )}
          </button>
        </div>

        {/* Search + Status filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Search ${activeSource === 'online' ? 'online' : 'walk-in'} bookings...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white text-gray-700"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Booking list — reuse existing BookingCard rendering logic */}
      <BookingsListBody
        bookings={bookings}
        onStatusUpdate={onStatusUpdate}
        onRefetch={onRefetch}
        isLoading={isLoading}
        type="car"
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

// Extracted list + pagination body so both BookingsSection and CarBookingsSplitSection can use it
const BookingsListBody = ({ bookings, onStatusUpdate, onRefetch, isLoading, type, currentPage, setCurrentPage, itemsPerPage }) => {
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = bookings.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => { window.scrollTo(0, 0); }, [currentPage]);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">{type === 'tour' ? '🎯' : '🚗'}</div>
        <h3 className="text-base font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-sm text-gray-500">No {type} bookings match your current filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 text-sm text-gray-600">
        Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, bookings.length)} of {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
      </div>
      <div className="space-y-6">
        {currentBookings.map((booking) => (
          <BookingCard
            key={booking._id}
            booking={booking}
            onStatusUpdate={onStatusUpdate}
            onRefetch={onRefetch}
            isLoading={isLoading}
            type={type}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const n = index + 1;
                  if (n === 1 || n === totalPages || (n >= currentPage - 1 && n <= currentPage + 1)) {
                    return (
                      <button key={n} onClick={() => setCurrentPage(n)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === n ? 'bg-indigo-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}>{n}</button>
                    );
                  }
                  if (n === currentPage - 2 || n === currentPage + 2) return <span key={n} className="px-2 text-gray-500">...</span>;
                  return null;
                })}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
            <div className="sm:hidden text-sm text-gray-600">{currentPage} / {totalPages}</div>
          </div>
        </div>
      )}
    </>
  );
};

const BookingsSection = ({ bookings, searchTerm, setSearchTerm, statusFilter, setStatusFilter, onStatusUpdate, onRefetch, isLoading, type, currentPage, setCurrentPage, itemsPerPage }) => {
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = bookings.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">{type === 'tour' ? 'Tour' : 'Car'} Bookings</h2>
          <span className="text-xs text-gray-500 font-medium">{bookings.length} total</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white text-gray-700"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      {bookings.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, bookings.length)} of {bookings.length} bookings
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">{type === 'tour' ? '🎯' : '🚗'}</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-sm sm:text-base text-gray-500">No {type} bookings match your current filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {currentBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onStatusUpdate={onStatusUpdate}
                onRefetch={onRefetch}
                isLoading={isLoading}
                type={type}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
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
      )}
    </div>
  );
};

// Payment Details Section Component
const PaymentDetailsSection = ({ booking, onUpdate, isLoading }) => {
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [paidAmount, setPaidAmount] = useState(booking.paidAmount || 0);
  const [discount, setDiscount] = useState(booking.discount || 0);
  const [isSaving, setIsSaving] = useState(false);

  const totalAmount = booking.totalAmount || 0;
  const dueAmount = Math.max(0, totalAmount - discount - paidAmount);

  const handleSave = async () => {
    // Keep discount as entered, but cap paid amount if needed
    let finalDiscount = parseFloat(discount) || 0;
    let finalPaidAmount = parseFloat(paidAmount) || 0;
    
    // Calculate maximum allowed paid amount
    const maxAllowedPaid = totalAmount - finalDiscount;
    
    // Cap paid amount if it exceeds the allowed amount
    if (finalPaidAmount > maxAllowedPaid) {
      finalPaidAmount = Math.max(0, maxAllowedPaid);
    }

    // Confirmation dialog
    if (!window.confirm('Are you sure you want to update the payment details?')) {
      return;
    }

    setIsSaving(true);
    try {
      await adminService.updateBookingPayment(booking._id, {
        paidAmount: finalPaidAmount,
        discount: finalDiscount
      });
      
      // Update local booking object
      booking.paidAmount = finalPaidAmount;
      booking.discount = finalDiscount;
      
      // Update local state to reflect the capped paid amount
      setPaidAmount(finalPaidAmount);
      
      // Calculate due amount (will be 0 if paid amount was capped)
      const calculatedDue = Math.max(0, totalAmount - finalDiscount - finalPaidAmount);
      
      // Send notification to user
      try {
        await notificationService.createNotification({
          recipientEmail: booking.user?.email,
          type: 'payment_update',
          title: 'Payment Details Updated',
          message: `Your payment details have been updated. Paid: ₹${finalPaidAmount.toLocaleString()}, Discount: ₹${finalDiscount.toLocaleString()}, Due: ₹${calculatedDue.toLocaleString()}`,
          relatedBooking: booking._id,
          priority: 'high'
        });
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
      }
      
      showSuccess('Payment details updated successfully!');
      setIsEditing(false);
      
      // Don't call onUpdate as it triggers status update confirmation
      // The payment update is complete and doesn't need status change
    } catch (error) {
      showError(error.message || 'Failed to update payment details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPaidAmount(booking.paidAmount || 0);
    setDiscount(booking.discount || 0);
    setIsEditing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Payment Details
        </h4>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Edit Payment
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Paid Amount */}
        <div>
          <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Paid Amount
          </label>
          {isEditing ? (
            <input
              type="text"
              inputMode="decimal"
              value={paidAmount}
              onChange={(e) => {
                let value = e.target.value;
                // Allow only numbers and decimal point
                value = value.replace(/[^\d.]/g, '');
                // Remove leading zeros before digits (but keep single 0 or 0.)
                value = value.replace(/^0+(?=\d)/, '');
                // Allow only one decimal point
                const parts = value.split('.');
                if (parts.length > 2) {
                  value = parts[0] + '.' + parts.slice(1).join('');
                }
                // Update state with cleaned value
                if (value === '' || value === '.') {
                  setPaidAmount(0);
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setPaidAmount(value);
                  }
                }
              }}
              onBlur={(e) => {
                // On blur, convert to proper number
                const numValue = parseFloat(e.target.value) || 0;
                setPaidAmount(numValue);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          ) : (
            <p className="text-lg font-bold text-green-600">{formatCurrency(paidAmount)}</p>
          )}
        </div>

        {/* Discount */}
        <div>
          <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Discount
          </label>
          {isEditing ? (
            <input
              type="text"
              inputMode="decimal"
              value={discount}
              onChange={(e) => {
                let value = e.target.value;
                // Allow only numbers and decimal point
                value = value.replace(/[^\d.]/g, '');
                // Remove leading zeros before digits (but keep single 0 or 0.)
                value = value.replace(/^0+(?=\d)/, '');
                // Allow only one decimal point
                const parts = value.split('.');
                if (parts.length > 2) {
                  value = parts[0] + '.' + parts.slice(1).join('');
                }
                // Update state with cleaned value
                if (value === '' || value === '.') {
                  setDiscount(0);
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setDiscount(value);
                  }
                }
              }}
              onBlur={(e) => {
                // On blur, convert to proper number
                const numValue = parseFloat(e.target.value) || 0;
                setDiscount(numValue);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          ) : (
            <p className="text-lg font-bold text-orange-600">{formatCurrency(discount)}</p>
          )}
        </div>

        {/* Due Amount (Auto-calculated) */}
        <div>
          <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Due Amount
          </label>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(dueAmount)}
          </p>
        </div>
      </div>

      {/* Total Amount Display */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Amount:</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Edit Actions */}
      {isEditing && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// Enhanced Booking Card with Better Visual Hierarchy
const BookingCard = ({ booking, onStatusUpdate, onRefetch, isLoading, type }) => {
  const isCarBooking = type === 'car';
  const isTourBooking = type === 'tour';

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
  const carName = isCarBooking ? carBookingData.carName : null;
  const distance = isCarBooking ? carBookingData.distance : null;
  const estimatedTime = isCarBooking ? carBookingData.estimatedTime : null;

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

  const [whatsappLoading, setWhatsappLoading] = useState(false);

  const handleWhatsAppConfirm = async () => {
    setWhatsappLoading(true);
    try {
      const result = await adminService.getCarBookingWhatsAppLink(booking._id);
      if (result.whatsappLink) {
        window.open(result.whatsappLink, '_blank');
      }
    } catch (err) {
      alert(err.message || 'Failed to generate WhatsApp link. Booking may not have a WhatsApp number.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleStatusUpdate = (newStatus) => {
    let reason = '';
    if (newStatus === 'cancelled') {
      reason = prompt('Please provide a reason for cancellation:');
      if (!reason) {
        return;
      }
    }
    
    // Create proper confirmation message
    const actionText = newStatus === 'confirmed' ? 'confirm' : 
                       newStatus === 'cancelled' ? 'cancel' : 
                       newStatus === 'completed' ? 'mark as completed' : newStatus;
    
    if (window.confirm(`Are you sure you want to ${actionText} this booking?`)) {
      onStatusUpdate(booking._id, newStatus, reason, type);
    }
  };

  // Driver assignment state
  const [showDriverPanel, setShowDriverPanel] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(booking.assignedDriver?._id || '');
  const [driverAssigning, setDriverAssigning] = useState(false);

  // Offline booking edit state
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName:     booking.offlineCustomer?.name         || '',
    customerPhone:    booking.offlineCustomer?.phone        || '',
    customerEmail:    booking.offlineCustomer?.email        || '',
    customerWhatsapp: booking.offlineCustomer?.whatsappNumber || '',
    tripType:         booking.tripType      || 'one-way',
    carType:          booking.carType       || 'Sedan',
    pickupLocation:   booking.pickupLocation  || '',
    dropoffLocation:  booking.dropoffLocation || '',
    pickupDate:       booking.pickupDate ? new Date(booking.pickupDate).toISOString().slice(0,10) : '',
    pickupTime:       booking.pickupTime    || '',
    dropoffDate:      booking.dropoffDate ? new Date(booking.dropoffDate).toISOString().slice(0,10) : '',
    dropoffTime:      booking.dropoffTime   || '',
    numberOfPassengers: booking.numberOfPassengers ?? 1,
    totalAmount:      booking.totalAmount   || 0,
    paidAmount:       booking.paidAmount    || 0,
    discount:         booking.discount      || 0,
    specialRequests:  booking.specialRequests || '',
  });

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      await adminService.updateOfflineCarBooking(booking._id, editForm);
      setShowEditPanel(false);
      onRefetch();
    } catch (err) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setEditSaving(false);
    }
  };

  const ef = (field) => (e) => setEditForm(prev => ({ ...prev, [field]: e.target.value }));

  const loadDrivers = async () => {
    if (availableDrivers.length > 0) return;
    try {
      const { getAllDrivers } = await import('../services/driverService.js');
      const res = await getAllDrivers();
      setAvailableDrivers(res.data || []);
    } catch { /* silent */ }
  };

  const handleAssignDriver = async () => {
    setDriverAssigning(true);
    try {
      await adminService.assignDriverToCarBooking(booking._id, selectedDriverId || null);
      setShowDriverPanel(false);
      // Use onRefetch if available, otherwise fall back to onStatusUpdate
      if (onRefetch) {
        onRefetch();
      } else {
        onStatusUpdate(booking._id, booking.status, '', type);
      }
    } catch (err) {
      alert(err.message || 'Failed to assign driver');
    } finally {
      setDriverAssigning(false);
    }
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
    if (!timeString) return 'N/A';
    
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
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-200">
      {/* Header Section */}
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        {/* Icon */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
          isCarBooking ? 'bg-gradient-to-br from-green-100 to-green-50' : 'bg-gradient-to-br from-blue-100 to-blue-50'
        }`}>
          {isCarBooking ? (
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          ) : (
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Status Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight mb-1">
                {isTourBooking 
                  ? (booking.tourPackage?.title || booking.tourPackage?.name) 
                  : (carName ? `${carName} (${booking.carType})` : booking.carType)
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
              <span className="capitalize">{booking.status}</span>
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
          {/* Pickup/Travel Date */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">{isCarBooking ? 'Pickup Date' : 'Travel Date'}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {formatTravelDate(isCarBooking ? booking.pickupDate : booking.travelDate)}
                {isCarBooking && (
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
                  <span className="block text-xs text-gray-600 mt-0.5">{formatTime(booking.dropoffTime)}</span>
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
          {isCarBooking ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Trip Type</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {booking.tripType?.replace('-', ' ') || 'One-way'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-semibold text-gray-900">
                  {booking.tourPackage?.duration || 'N/A'}
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
              <p className="text-sm font-semibold text-gray-900">
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
                  {booking.tripType === 'round-trip'
                    ? `${distance} × 2 = ${(parseFloat(distance) * 2).toFixed(2)} km`
                    : `${distance} km`
                  }
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
                ₹{booking.totalAmount?.toLocaleString()}
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
                      <span className="font-medium"> by {booking.cancelledByType === 'admin' ? 'Admin' : 'Customer'}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Section */}
      <PaymentDetailsSection 
        booking={booking}
        onUpdate={handleStatusUpdate}
        isLoading={isLoading}
      />

      {/* Additional Contact & Location Details */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Contact & Location Details
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Customer Name */}
          {booking.user?.name && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Name
              </p>
              <p className="text-sm font-medium text-gray-900">{booking.user.name}</p>
            </div>
          )}

          {/* Offline Customer Details */}
          {booking.isOfflineBooking && booking.offlineCustomer?.name && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Name
              </p>
              <p className="text-sm font-medium text-gray-900">{booking.offlineCustomer.name}</p>
            </div>
          )}
          {booking.isOfflineBooking && booking.offlineCustomer?.email && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address
              </p>
              <a href={`mailto:${booking.offlineCustomer.email}`} className="text-sm font-medium text-purple-600 hover:text-purple-800 break-all">
                {booking.offlineCustomer.email}
              </a>
            </div>
          )}
          {booking.isOfflineBooking && (booking.offlineCustomer?.phone || booking.offlineCustomer?.whatsappNumber) && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Number
              </p>
              <a href={`tel:${booking.offlineCustomer.phone}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                {booking.offlineCustomer.phone}
              </a>
            </div>
          )}
          {booking.isOfflineBooking && booking.offlineCustomer?.whatsappNumber && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp Number
              </p>
              <a 
                href={`https://wa.me/91${booking.offlineCustomer.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-green-600 hover:text-green-800 inline-flex items-center gap-1"
              >
                {booking.offlineCustomer.whatsappNumber}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
          {booking.isOfflineBooking && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Booking Type</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full border border-orange-200">
                  Offline / Walk-in
                </span>
              </div>
              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <button
                  onClick={() => setShowEditPanel(p => !p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {showEditPanel ? 'Cancel Edit' : 'Edit Booking'}
                </button>
              )}
            </div>
          )}

          {/* Email */}
          {booking.user?.email && (
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address
              </p>
              <a href={`mailto:${booking.user.email}`} className="text-sm font-medium text-purple-600 hover:text-purple-800 break-all">
                {booking.user.email}
              </a>
            </div>
          )}

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
                <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Offline Booking Edit Panel */}
      {booking.isOfflineBooking && showEditPanel && (
        <div className="mt-4 rounded-xl border border-indigo-200 overflow-hidden">
          <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-indigo-900">Edit Booking Details</p>
            <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Walk-in / Offline</span>
          </div>
          <div className="p-4 bg-white space-y-4">
            {/* Customer Details */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Customer Name *</label>
                  <input value={editForm.customerName} onChange={ef('customerName')} placeholder="Full name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phone *</label>
                  <input value={editForm.customerPhone} onChange={ef('customerPhone')} placeholder="10-digit phone"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">WhatsApp Number</label>
                  <input value={editForm.customerWhatsapp} onChange={ef('customerWhatsapp')} placeholder="WhatsApp number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input value={editForm.customerEmail} onChange={ef('customerEmail')} placeholder="Email address" type="email"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Trip Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Trip Type</label>
                  <select value={editForm.tripType} onChange={ef('tripType')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none bg-white">
                    {['one-way','round-trip','outstation','marriage','monthly'].map(t => (
                      <option key={t} value={t}>{t.replace('-',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Car Type</label>
                  <select value={editForm.carType} onChange={ef('carType')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none bg-white">
                    {['Sedan','SUV','Hatchback','Luxury','Tempo Traveller','Bus'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pickup Location *</label>
                  <input value={editForm.pickupLocation} onChange={ef('pickupLocation')} placeholder="Pickup address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Drop-off Location *</label>
                  <input value={editForm.dropoffLocation} onChange={ef('dropoffLocation')} placeholder="Drop address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pickup Date</label>
                  <input type="date" value={editForm.pickupDate} onChange={ef('pickupDate')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pickup Time</label>
                  <input type="time" value={editForm.pickupTime} onChange={ef('pickupTime')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Drop-off Date</label>
                  <input type="date" value={editForm.dropoffDate} onChange={ef('dropoffDate')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Drop-off Time</label>
                  <input type="time" value={editForm.dropoffTime} onChange={ef('dropoffTime')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Passengers</label>
                  <input type="number" min="1" value={editForm.numberOfPassengers} onChange={ef('numberOfPassengers')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pricing</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Total Amount (₹) *</label>
                  <input type="number" min="0" value={editForm.totalAmount} onChange={ef('totalAmount')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Paid Amount (₹)</label>
                  <input type="number" min="0" value={editForm.paidAmount} onChange={ef('paidAmount')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Discount (₹)</label>
                  <input type="number" min="0" value={editForm.discount} onChange={ef('discount')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Special Requests</label>
              <textarea rows={2} value={editForm.specialRequests} onChange={ef('specialRequests')}
                placeholder="Any special instructions..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none resize-none" />
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-2 pt-1 border-t border-gray-100">
              <button onClick={handleEditSave} disabled={editSaving}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setShowEditPanel(false)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 text-sm font-medium rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Assignment Panel — shown for car bookings that are not cancelled/completed */}
      {isCarBooking && booking.status !== 'cancelled' && booking.status !== 'completed' && (
        <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
          {/* Assigned Driver Status — stacks on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 gap-2">
            {/* Driver info row */}
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${booking.assignedDriver ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
              {booking.assignedDriver ? (
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-gray-900">{booking.assignedDriver.name}</span>
                  <span className="text-gray-400 mx-1">·</span>
                  <span className="text-sm text-gray-600">{booking.assignedDriver.phone}</span>
                  {booking.assignedDriver.carNumber && (
                    <><span className="text-gray-400 mx-1">·</span><span className="font-mono text-xs text-indigo-700">{booking.assignedDriver.carNumber}</span></>
                  )}
                </div>
              ) : (
                <span className="text-sm text-amber-700 font-medium">No driver assigned yet</span>
              )}
            </div>
            {/* Action buttons — wrap on mobile */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Notify Customer */}
              {booking.assignedDriver && (() => {
                const customerPhone = (() => {
                  if (!booking.isOfflineBooking && booking.notes?.length) {
                    try { const d = JSON.parse(booking.notes[0].content); return (d.contactNumber || '').replace(/\D/g, ''); } catch { return ''; }
                  }
                  return (booking.offlineCustomer?.whatsappNumber || booking.offlineCustomer?.phone || '').replace(/\D/g, '');
                })();
                const helpline    = import.meta.env.VITE_HELPLINE_NUMBER || '9999999999';
                const driverName  = booking.assignedDriver.name;
                const driverPhone = booking.assignedDriver.phone;
                const carNumber   = booking.assignedDriver.carNumber || '';
                const carModel    = booking.assignedDriver.carModel  || '';
                const lines = [
                  `*Driver Assigned - NextDrive Bihar*`, ` `,
                  `Hello! Your driver has been assigned for your booking *#${booking.bookingReference}*.`, ` `,
                  `*Driver:* ${driverName}`, `*Phone:* ${driverPhone}`,
                  carModel  ? `*Vehicle:* ${carModel}`  : null,
                  carNumber ? `*Plate No:* ${carNumber}` : null, ` `,
                  `For any assistance, please contact our helpline:`,
                  `*Helpline:* +91 ${helpline}`, ` `,
                  `Thank you for choosing NextDrive Bihar!`,
                ].filter(l => l !== null);
                const message = lines.join('\n');
                const waLink = customerPhone
                  ? `https://wa.me/91${customerPhone}?text=${encodeURIComponent(message)}`
                  : `https://wa.me/?text=${encodeURIComponent(message)}`;
                return (
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#25D366] hover:bg-[#1ebe5d] rounded-lg transition-colors"
                    title="Send driver assigned WhatsApp message to customer">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.101 1.514 5.835L.036 23.5l5.823-1.527A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.5-5.063-1.371l-.363-.215-3.754.984.998-3.648-.237-.375A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    <span>Notify Customer</span>
                  </a>
                );
              })()}

              {/* Notify Driver */}
              {booking.assignedDriver && (() => {
                const d = booking.assignedDriver;
                const driverWaNumber = (d.phone || '').replace(/\D/g, '');
                const pickup  = booking.pickupLocation  || '';
                const dropoff = booking.dropoffLocation || '';
                const pickupDateStr = booking.pickupDate
                  ? new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                const pickupTimeStr = booking.pickupTime || '';
                const customerName  = booking.isOfflineBooking
                  ? (booking.offlineCustomer?.name || 'Customer') : (booking.user?.name || 'Customer');
                const customerPhone = booking.isOfflineBooking
                  ? (booking.offlineCustomer?.whatsappNumber || booking.offlineCustomer?.phone || '')
                  : (() => { try { const n = booking.notes?.length ? JSON.parse(booking.notes[0].content) : {}; return n.contactNumber || ''; } catch { return ''; } })();
                const driverLines = [
                  `*New Booking - NextDrive Bihar*`, ` `,
                  `Hello ${d.name}, you have been assigned a new booking.`, ` `,
                  `*Booking ID:* #${booking.bookingReference}`,
                  `*Car Type:* ${booking.carType}`,
                  booking.tripType ? `*Trip Type:* ${booking.tripType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}` : null, ` `,
                  `*Customer:* ${customerName}`,
                  customerPhone ? `*Customer Phone:* ${customerPhone}` : null, ` `,
                  `*Pickup:* ${pickup}`, `*Drop-off:* ${dropoff}`,
                  pickupDateStr ? `*Date:* ${pickupDateStr}` : null,
                  pickupTimeStr ? `*Time:* ${pickupTimeStr}` : null, ` `,
                  `Please be ready on time.`,
                  `For any queries contact NextDrive Bihar helpline: +91 ${import.meta.env.VITE_HELPLINE_NUMBER || '9999999999'}`,
                ].filter(l => l !== null);
                const driverMsg = driverLines.join('\n');
                const driverWaLink = driverWaNumber
                  ? `https://wa.me/91${driverWaNumber}?text=${encodeURIComponent(driverMsg)}`
                  : `https://wa.me/?text=${encodeURIComponent(driverMsg)}`;
                return (
                  <a href={driverWaLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    title="Send booking details to driver via WhatsApp">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.101 1.514 5.835L.036 23.5l5.823-1.527A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.5-5.063-1.371l-.363-.215-3.754.984.998-3.648-.237-.375A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    <span>Notify Driver</span>
                  </a>
                );
              })()}

              {/* Change / Assign Driver */}
              <button type="button" onClick={() => { setShowDriverPanel(p => !p); loadDrivers(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                {booking.assignedDriver ? 'Change' : 'Assign'}
              </button>
            </div>
          </div>

          {showDriverPanel && (
            <div className="px-4 py-4 bg-white space-y-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Driver</label>
              <select
                value={selectedDriverId}
                onChange={e => setSelectedDriverId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white"
              >
                <option value="">— Remove / No Driver —</option>
                {availableDrivers.filter(d => d.status === 'available' || d._id === booking.assignedDriver?._id).map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name} · {d.phone} · {d.carType}{d.carNumber ? ` · ${d.carNumber}` : ''}
                    {d._id === booking.assignedDriver?._id ? ' (current)' : ''}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAssignDriver}
                  disabled={driverAssigning}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {driverAssigning ? 'Saving…' : (selectedDriverId ? 'Assign Driver' : 'Remove Driver')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDriverPanel(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Actions */}
      {booking.status === 'pending' && (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-4 mt-2 border-t border-gray-100">
          <button
            onClick={() => handleStatusUpdate('confirmed')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Confirm
          </button>
          <button
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
          {isCarBooking && (
            <button
              onClick={handleWhatsAppConfirm}
              disabled={whatsappLoading}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.101 1.514 5.835L.036 23.5l5.823-1.527A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.5-5.063-1.371l-.363-.215-3.754.984.998-3.648-.237-.375A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              {whatsappLoading ? 'Loading...' : 'WhatsApp'}
            </button>
          )}
        </div>
      )}

      {booking.status === 'confirmed' && (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-4 mt-2 border-t border-gray-100">
          <button
            onClick={() => handleStatusUpdate('completed')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark Completed
          </button>
          <button
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
          {isCarBooking && (
            <button
              onClick={handleWhatsAppConfirm}
              disabled={whatsappLoading}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.101 1.514 5.835L.036 23.5l5.823-1.527A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.5-5.063-1.371l-.363-.215-3.754.984.998-3.648-.237-.375A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              {whatsappLoading ? 'Loading...' : 'WhatsApp'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Users Section with Admin/User Separation and Verification Filters
const UsersSection = ({ users, searchTerm, setSearchTerm, verificationFilter, setVerificationFilter, onDeleteUser, isLoading, currentPage, setCurrentPage, itemsPerPage }) => {
  // Separate into three groups
  const adminUsers   = users.filter(user => user.role === 'admin');
  const driverUsers  = users.filter(user => user.role === 'driver');
  const regularUsers = users.filter(user => user.role !== 'admin' && user.role !== 'driver');

  // Pagination for regular users only (admins & drivers always shown in full)
  const totalPages = Math.ceil(regularUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRegularUsers = regularUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Get verification counts for filter badges
  const verifiedCount   = users.filter(user => user.isVerified).length;
  const unverifiedCount = users.filter(user => !user.isVerified).length;

  const noResults = adminUsers.length === 0 && driverUsers.length === 0 && regularUsers.length === 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Users Management</h2>
          <p className="text-xs text-gray-500 font-medium">
            {adminUsers.length} admin{adminUsers.length !== 1 ? 's' : ''} · {driverUsers.length} driver{driverUsers.length !== 1 ? 's' : ''} · {regularUsers.length} user{regularUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white"
            />
          </div>
          
          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white text-gray-700"
          >
            <option value="">All Users</option>
            <option value="verified">Verified Only ({verifiedCount})</option>
            <option value="unverified">Unverified Only ({unverifiedCount})</option>
          </select>
        </div>
      </div>

      {/* Filter Tags */}
      {(searchTerm || verificationFilter) && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-xs sm:text-sm font-medium text-blue-800">Active Filters:</span>
          
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
              Search: "{searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"
              <button onClick={() => setSearchTerm('')} className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          )}
          
          {verificationFilter && (
            <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
              Status: {verificationFilter === 'verified' ? 'Verified' : 'Unverified'}
              <button onClick={() => setVerificationFilter('')} className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          )}
          
          <button onClick={() => { setSearchTerm(''); setVerificationFilter(''); }}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium">
            Clear All
          </button>
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-sm sm:text-base text-gray-500">
            {searchTerm || verificationFilter ? 'No users match your current search and filter criteria.' : 'No users available in the system.'}
          </p>
          {(searchTerm || verificationFilter) && (
            <button onClick={() => { setSearchTerm(''); setVerificationFilter(''); }}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Administrators ── */}
          {adminUsers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">Administrators</h3>
                <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-0.5 rounded-full">{adminUsers.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {adminUsers.map((user) => (
                  <UserCard key={user._id} user={user} onDelete={onDeleteUser} isLoading={isLoading} role="admin" />
                ))}
              </div>
            </div>
          )}

          {/* ── Drivers ── */}
          {driverUsers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h8" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7h3l2 6v3h-2m-4 0H9" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">Drivers</h3>
                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">{driverUsers.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {driverUsers.map((user) => (
                  <UserCard key={user._id} user={user} onDelete={onDeleteUser} isLoading={isLoading} role="driver" />
                ))}
              </div>
            </div>
          )}

          {/* ── Regular Users ── */}
          {regularUsers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">Regular Users</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">{regularUsers.length}</span>
              </div>

              {regularUsers.length > itemsPerPage && (
                <p className="mb-3 text-sm text-gray-500">
                  Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, regularUsers.length)} of {regularUsers.length}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {currentRegularUsers.map((user) => (
                  <UserCard key={user._id} user={user} onDelete={onDeleteUser} isLoading={isLoading} role="user" />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Previous
                      </button>
                      <div className="hidden sm:flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                            return (
                              <button key={pageNumber} onClick={() => handlePageChange(pageNumber)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === pageNumber ? 'bg-indigo-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}>{pageNumber}</button>
                            );
                          } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                            return <span key={pageNumber} className="px-2 text-gray-500">...</span>;
                          }
                          return null;
                        })}
                      </div>
                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Next
                      </button>
                    </div>
                    <div className="sm:hidden text-sm text-gray-600">{currentPage} / {totalPages}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No match when filters active */}
          {(searchTerm || verificationFilter) && noResults && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-3">No users match your search and filter criteria</p>
              <button onClick={() => { setSearchTerm(''); setVerificationFilter(''); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const UserCard = ({ user, onDelete, isLoading, isAdmin, role: roleProp }) => {
  const role = roleProp || (isAdmin ? 'admin' : 'user');
  const isAdminRole  = role === 'admin';
  const isDriverRole = role === 'driver';

  const styles = {
    admin:  { card: 'border-purple-200 bg-gradient-to-br from-purple-50 to-white', avatar: 'bg-purple-100', initial: 'text-purple-600', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
    driver: { card: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',   avatar: 'bg-amber-100',  initial: 'text-amber-600',  badge: 'bg-amber-100 text-amber-800 border-amber-200'   },
    user:   { card: 'border-gray-200 hover:border-gray-300',                        avatar: 'bg-blue-100',   initial: 'text-blue-600',   badge: 'bg-gray-100 text-gray-700 border-gray-200'      },
  };
  const s = styles[role] || styles.user;

  return (
    <div className={`bg-white border rounded-xl p-5 hover:shadow-md transition-all duration-200 ${s.card}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.avatar}`}>
            {user.avatar ? (
              <img
                src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL}/${user.avatar}`}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className={`font-semibold text-lg ${s.initial}`}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
              {isAdminRole && (
                <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              {isDriverRole && (
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h8" />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${s.badge}`}>
          {isAdminRole ? 'Admin' : isDriverRole ? 'Driver' : 'User'}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        {/* Driver login hint */}
        {isDriverRole && user.phone && (
          <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
            <p className="text-xs text-amber-700 font-medium mb-0.5">Login credentials</p>
            <p className="text-xs text-amber-600 font-mono">{user.phone}@driver.nextdrive</p>
            <p className="text-xs text-amber-600 font-mono">pw: {user.phone.slice(-6)}</p>
          </div>
        )}

        {/* Verification */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.isVerified ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center space-x-1">
              {user.isVerified ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              <span>{user.isVerified ? 'Verified' : 'Unverified'}</span>
            </div>
          </span>
        </div>

        {/* Joined */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Joined</span>
          <span className="text-sm font-medium text-gray-900">
            {new Date(user.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
        </div>

        {/* ID */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">User ID</span>
          <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">{user._id.slice(-8)}</span>
        </div>
      </div>

      {/* Actions */}
      {role === 'user' && (
        <div className="pt-3 border-t border-gray-100">
          <button
            onClick={() => onDelete(user._id, user.name)}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete User
          </button>
        </div>
      )}

      {isAdminRole && (
        <div className="pt-3 border-t border-purple-100">
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-purple-50 text-purple-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Admin accounts are protected
          </div>
        </div>
      )}

      {isDriverRole && (
        <div className="pt-3 border-t border-amber-100">
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-amber-50 text-amber-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Managed via Driver Management
          </div>
        </div>
      )}
    </div>
  );
};
// Simplified Tour Packages Section - Mobile Optimized
const TourPackagesSection = ({ packages, searchTerm, setSearchTerm, onDeletePackage, onAddPackage, isLoading, currentPage, setCurrentPage, itemsPerPage }) => {
  // Pagination calculations
  const totalPages = Math.ceil(packages.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPackages = packages.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className="p-3 sm:p-6">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">Tour Packages</h2>
          <button
            onClick={onAddPackage}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base flex items-center gap-1.5"
          >
            <span className="text-base sm:text-lg">➕</span>
            <span className="hidden sm:inline">Add Package</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
        <input
          type="text"
          placeholder="Search packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
        />
      </div>

      {/* Results Summary */}
      {packages.length > 0 && (
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, packages.length)} of {packages.length} packages
        </div>
      )}

      {packages.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📦</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No tour packages found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">Create your first tour package to get started.</p>
          <button
            onClick={onAddPackage}
            className="px-4 py-2.5 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            Create Tour Package
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {currentPackages.map((pkg) => (
              <PackageCard
                key={pkg._id}
                package={pkg}
                onDelete={onDeletePackage}
                isLoading={isLoading}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                {/* Page Info */}
                <div className="text-xs sm:text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
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
      )}
    </div>
  );
};

// Simplified Package Card - Mobile Optimized
const PackageCard = ({ package: pkg, onDelete, isLoading }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Image Section */}
      <div className="h-40 sm:h-48 bg-gray-200 relative">
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
        {/* Duration Badge */}
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-md">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700">
              {pkg.duration?.days} Days
            </span>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-3 sm:p-4">
        {/* Title */}
        <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base line-clamp-2 leading-tight">
          {pkg.title}
        </h3>
        
        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
          {pkg.shortDescription || pkg.description}
        </p>
        
        {/* Price Section */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Starting from</p>
            <span className="text-lg sm:text-xl font-bold text-green-600">
              ₹{pkg.pricing?.basePrice?.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">Bookings</p>
            <span className="text-base sm:text-lg font-bold text-blue-600">
              {pkg.bookingStats?.totalBookings || 0}
            </span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="truncate">
              {new Date(pkg.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(pkg._id, pkg.title)}
          disabled={isLoading}
          className="w-full px-3 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-sm sm:text-base font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete Package</span>
        </button>
      </div>
    </div>
  );
};

// Simplified Add Package Section
const AddPackageSection = ({ form, setForm, onSubmit, onImageChange, isLoading }) => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Add New Tour Package</h2>
      <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Package Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Buddhist Circuit Tour"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
            <input
              type="text"
              required
              value={form.duration}
              onChange={(e) => setForm(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 5 Days / 4 Nights"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={form.price}
              onChange={(e) => {
                let value = e.target.value;
                // Allow only numbers and decimal point
                value = value.replace(/[^\d.]/g, '');
                // Remove leading zeros
                value = value.replace(/^0+(?=\d)/, '');
                // Allow only one decimal point
                const parts = value.split('.');
                if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                setForm(prev => ({ ...prev, price: value === '' ? '' : value }));
              }}
              onBlur={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                setForm(prev => ({ ...prev, price: numValue }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 15999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount (₹)</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.discount}
              onChange={(e) => {
                let value = e.target.value;
                // Allow only numbers and decimal point
                value = value.replace(/[^\d.]/g, '');
                // Remove leading zeros
                value = value.replace(/^0+(?=\d)/, '');
                // Allow only one decimal point
                const parts = value.split('.');
                if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                setForm(prev => ({ ...prev, discount: value === '' ? '' : value }));
              }}
              onBlur={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                setForm(prev => ({ ...prev, discount: numValue }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 4000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Summary *</label>
          <textarea
            required
            rows={3}
            value={form.summary}
            onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief description of the tour package..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Highlights (one per line) *</label>
          <textarea
            required
            rows={4}
            value={form.highlights}
            onChange={(e) => setForm(prev => ({ ...prev, highlights: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Bodh Gaya&#10;Nalanda&#10;Rajgir&#10;Vaishali"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Inclusions</label>
            <textarea
              rows={3}
              value={form.inclusions}
              onChange={(e) => setForm(prev => ({ ...prev, inclusions: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Transportation&#10;Accommodation&#10;Meals"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exclusions</label>
            <textarea
              rows={3}
              value={form.exclusions}
              onChange={(e) => setForm(prev => ({ ...prev, exclusions: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Personal expenses&#10;Travel insurance&#10;Tips"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Package Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onImageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {isLoading ? 'Creating...' : '➕ Create Tour Package'}
        </button>
      </form>
    </div>
  );
};

export default AdminDashboard;