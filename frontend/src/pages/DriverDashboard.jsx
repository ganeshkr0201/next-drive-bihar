import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../config/axios.js';

/* ─── helpers ─────────────────────────────────────────────────────────── */
const fmt = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtTime = (t) => {
  if (!t) return '';
  if (t.includes('T') || (t.includes('-') && t.length > 5)) {
    const d = new Date(t);
    const h = d.getHours(), m = d.getMinutes();
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  const [hh, mm] = t.split(':');
  const h24 = parseInt(hh, 10);
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12}:${mm} ${h24 >= 12 ? 'PM' : 'AM'}`;
};

const STATUS_STYLES = {
  confirmed:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending:      'bg-amber-100  text-amber-800  border-amber-200',
  'in-progress':'bg-blue-100   text-blue-800   border-blue-200',
  completed:    'bg-gray-100   text-gray-700   border-gray-200',
  cancelled:    'bg-red-100    text-red-800    border-red-200',
};

const Icon = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

/* ─── StatCard ────────────────────────────────────────────────────────── */
const StatCard = ({ title, value, icon, color, pulse }) => {
  const s = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100',    ib: 'bg-blue-100' },
    green:   { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ib: 'bg-emerald-100' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   ib: 'bg-amber-100' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-100',  ib: 'bg-indigo-100' },
    gray:    { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200',    ib: 'bg-gray-100' },
    red:     { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100',     ib: 'bg-red-100' },
  }[color] || {};
  return (
    <div className={`p-4 sm:p-5 rounded-xl border transition-shadow hover:shadow-md cursor-default ${s.bg} ${s.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold mt-1 ${s.text}`}>{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg ${s.ib} ${s.text} flex items-center justify-center flex-shrink-0`}>{icon}</div>
      </div>
      {pulse && value > 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">Active</span>
        </div>
      )}
    </div>
  );
};

/* ─── RideCard ────────────────────────────────────────────────────────── */
const RideCard = ({ booking, onComplete, loading }) => {
  const [open, setOpen] = useState(false);
  const status = booking.status;
  const statusClass = STATUS_STYLES[status] || STATUS_STYLES.completed;
  const canComplete = status === 'confirmed' || status === 'in-progress';

  let extra = {};
  if (booking.notes?.length) {
    try { extra = JSON.parse(booking.notes[0].content); } catch { /* noop */ }
  }

  const dueAmount = Math.max(0, (booking.totalAmount || 0) - (booking.discount || 0) - (booking.paidAmount || 0));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusClass}`}>
                {status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              {booking.isOfflineBooking && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">Walk-in</span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {extra.carName ? `${extra.carName} · ${booking.carType}` : booking.carType}
            </p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">#{booking.bookingReference}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Pending Amount</p>
            <p className={`text-sm font-bold mt-0.5 ${dueAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {dueAmount > 0 ? fmt(dueAmount) : 'Paid ✓'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{booking.tripType?.replace('-', ' ')}</p>
          </div>
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Pickup Date</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtDate(booking.pickupDate)}</p>
            {booking.pickupTime && <p className="text-xs text-gray-500">{fmtTime(booking.pickupTime)}</p>}
          </div>
          {booking.dropoffDate && (
            <div className="bg-gray-50 rounded-lg p-2.5">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Drop-off</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtDate(booking.dropoffDate)}</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Pickup</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{booking.pickupLocation}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Drop-off</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{booking.dropoffLocation}</p>
          </div>
        </div>

        {/* Customer info */}
        {(booking.user || booking.offlineCustomer || extra.contactNumber) && (
          <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {booking.isOfflineBooking
                  ? (booking.offlineCustomer?.name || 'Walk-in Customer')
                  : (booking.user?.name || 'Customer')}
              </p>
              {(extra.contactNumber || booking.offlineCustomer?.phone || booking.user?.phone) && (
                <a
                  href={`tel:${extra.contactNumber || booking.offlineCustomer?.phone || booking.user?.phone}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {extra.contactNumber || booking.offlineCustomer?.phone || booking.user?.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => setOpen(p => !p)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 hover:bg-indigo-50 rounded-md transition-colors"
          >
            {open ? 'Hide Details' : 'View Details'}
          </button>
          {canComplete && (
            <button
              onClick={() => onComplete(booking._id)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sm"
            >
              <Icon d="M5 13l4 4L19 7" className="w-4 h-4" />
              Mark Complete
            </button>
          )}
        </div>

        {/* Expanded details */}
        {open && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            {/* Passengers & amount */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {booking.numberOfPassengers > 0 && (
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-400 uppercase">Passengers</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{booking.numberOfPassengers}</p>
                </div>
              )}
              {extra.distance && (
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-400 uppercase">Distance</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {booking.tripType === 'round-trip' ? `${extra.distance} × 2 km` : `${extra.distance} km`}
                  </p>
                </div>
              )}
              {extra.estimatedTime && (
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-400 uppercase">Est. Time</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{extra.estimatedTime}</p>
                </div>
              )}
            </div>
            {/* Special requests */}
            {booking.specialRequests && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase mb-1">Special Requests</p>
                <p className="text-sm text-gray-800">{booking.specialRequests}</p>
              </div>
            )}
            {/* Payment */}
            <div className="flex justify-between items-center bg-white rounded-lg px-4 py-2.5 border border-gray-200">
              <span className="text-sm text-gray-500">Pending Amount</span>
              <span className={`text-base font-bold ${dueAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {dueAmount > 0 ? fmt(dueAmount) : 'Fully Paid ✓'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main DriverDashboard ────────────────────────────────────────────── */
const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [rides, setRides]     = useState([]);
  const [todayRides, setTodayRides] = useState([]);
  const [stats, setStats]     = useState({});
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Filter state for All Rides tab
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, ridesRes] = await Promise.all([
        api.get('/api/drivers/dashboard/me'),
        api.get('/api/drivers/dashboard/rides'),
      ]);
      setProfile(profileRes.data.data);
      setRides(ridesRes.data.data.rides);
      setTodayRides(ridesRes.data.data.todayRides);
      setStats(ridesRes.data.data.stats);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleComplete = async (bookingId) => {
    if (!window.confirm('Mark this ride as completed?')) return;
    setCompleting(true);
    try {
      await api.patch(`/api/drivers/dashboard/rides/${bookingId}/complete`);
      showToast('Ride marked as completed', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete ride', 'error');
    } finally {
      setCompleting(false);
    }
  };

  const filteredRides = statusFilter === 'all'
    ? rides
    : rides.filter(r => r.status === statusFilter);

  const TABS = [
    { id: 'overview',  label: 'Overview',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'today',     label: "Today's Rides", icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', badge: todayRides.filter(r => ['confirmed','in-progress'].includes(r.status)).length },
    { id: 'all-rides', label: 'All Rides',  icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'profile',   label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="text-2xl">🚘</span>
              {profile ? profile.name : 'Driver Dashboard'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile ? `${profile.carType || ''} · ${profile.carNumber || ''}`.replace(/^·\s|·\s$/, '') : 'Loading…'}
            </p>
          </div>
          <button
            onClick={async () => { await logout(); window.location.href = '/login'; }}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-lg transition-colors"
          >
            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <Icon d={tab.icon} className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">My Overview</h2>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                </div>
              ) : (
                <>
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <StatCard title="Total Rides"  value={stats.total || 0}      color="indigo" icon={<Icon d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-5 h-5" />} />
                    <StatCard title="Today"        value={stats.today || 0}      color="amber"  pulse={stats.today > 0} icon={<Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-5 h-5" />} />
                    <StatCard title="Pending"      value={stats.pending || 0}    color="amber"  icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />} />
                    <StatCard title="Confirmed"    value={stats.confirmed || 0}  color="green"  pulse={(stats.confirmed || 0) > 0} icon={<Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />} />
                    <StatCard title="Completed"    value={stats.completed || 0}  color="blue"   icon={<Icon d="M5 13l4 4L19 7" className="w-5 h-5" />} />
                    <StatCard title="Cancelled"    value={stats.cancelled || 0}  color="red"    icon={<Icon d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />} />
                  </div>

                  {/* Today's snapshot */}
                  {todayRides.length > 0 ? (
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
                        <p className="text-sm font-semibold text-amber-900">Today's Rides ({todayRides.length})</p>
                        <button onClick={() => setActiveTab('today')}
                          className="text-sm text-amber-700 hover:text-amber-900 font-medium">
                          View all →
                        </button>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {todayRides.slice(0, 3).map(r => (
                          <div key={r._id} className="flex items-center gap-3 px-4 py-3">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              r.status === 'confirmed' ? 'bg-emerald-500' :
                              r.status === 'in-progress' ? 'bg-blue-500' :
                              r.status === 'completed' ? 'bg-gray-400' : 'bg-amber-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{r.pickupLocation} → {r.dropoffLocation}</p>
                              <p className="text-xs text-gray-400">{fmtDate(r.pickupDate)} {r.pickupTime ? `at ${fmtTime(r.pickupTime)}` : ''}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border flex-shrink-0 capitalize ${STATUS_STYLES[r.status] || ''}`}>
                              {r.status.replace('-', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                      <p className="text-sm text-gray-500">No rides scheduled for today</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Today's Rides ── */}
          {activeTab === 'today' && (
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-800">Today's Rides</h2>
                <span className="text-sm text-gray-500">{todayRides.length} ride{todayRides.length !== 1 ? 's' : ''}</span>
              </div>
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                </div>
              ) : todayRides.length > 0 ? (
                <div className="space-y-4">
                  {todayRides.map(r => (
                    <RideCard key={r._id} booking={r} onComplete={handleComplete} loading={completing} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 border border-dashed border-gray-200 rounded-xl">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-base font-medium text-gray-700">No rides today</p>
                  <p className="text-sm text-gray-400 mt-1">Enjoy your day off!</p>
                </div>
              )}
            </div>
          )}

          {/* ── All Rides ── */}
          {activeTab === 'all-rides' && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h2 className="text-base font-semibold text-gray-800">All Rides</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''}</span>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none bg-white text-gray-700"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                </div>
              ) : filteredRides.length > 0 ? (
                <div className="space-y-4">
                  {filteredRides.map(r => (
                    <RideCard key={r._id} booking={r} onComplete={handleComplete} loading={completing} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 border border-dashed border-gray-200 rounded-xl">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-base font-medium text-gray-700">No rides found</p>
                </div>
              )}
            </div>
          )}

          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <div className="p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-5">My Profile</h2>
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                </div>
              ) : profile ? (
                <div className="space-y-5">
                  {/* Photo + name */}
                  <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    {profile.driverPhoto ? (
                      <img src={profile.driverPhoto} alt={profile.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl flex-shrink-0">
                        {profile.name?.[0] || 'D'}
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold text-gray-900">{profile.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        profile.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {profile.status === 'available' ? '● Available' : '● Unavailable'}
                      </span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Phone',        value: profile.phone },
                      { label: 'Licence Type', value: profile.licenceType },
                      { label: 'Experience',   value: profile.drivingExperience != null ? `${profile.drivingExperience} years` : null },
                      { label: 'Car Type',     value: profile.carType },
                      { label: 'Car Model',    value: profile.carModel },
                      { label: 'Car Number',   value: profile.carNumber, mono: true },
                      { label: 'Languages',    value: profile.languagesKnown?.join(', ') },
                    ].filter(f => f.value).map(({ label, value, mono }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                        <p className={`text-sm font-semibold text-gray-900 mt-0.5 ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Login credentials info */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-semibold text-amber-900 mb-1">Login Credentials</p>
                    <p className="text-xs text-amber-700">
                      Email: <span className="font-mono">{profile.phone}@driver.nextdrive</span>
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Password: last 6 digits of your phone number
                    </p>
                  </div>

                  {/* Car image */}
                  {profile.carFrontImage && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Vehicle Photo</p>
                      <img src={profile.carFrontImage} alt="Car"
                        className="w-full max-w-sm rounded-xl border border-gray-200 object-cover" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-10">Profile not found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
