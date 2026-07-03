import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getAllDrivers, deleteDriver, toggleDriverStatus } from '../services/driverService';

const AdminDriverList = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getAllDrivers();
      setDrivers(res.data || []);
    } catch (err) {
      showError(err.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Delete driver "${driver.name}"? This cannot be undone.`)) return;
    try {
      await deleteDriver(driver._id);
      showSuccess('Driver deleted');
      setDrivers(prev => prev.filter(d => d._id !== driver._id));
    } catch (err) {
      showError(err.message || 'Failed to delete');
    }
  };

  const handleToggle = async (driver) => {
    try {
      const res = await toggleDriverStatus(driver._id);
      showSuccess('Status updated');
      setDrivers(prev => prev.map(d => d._id === driver._id ? res.data : d));
    } catch (err) {
      showError(err.message || 'Failed to update status');
    }
  };

  const filtered = drivers.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search) || (d.carNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const available = drivers.filter(d => d.status === 'available').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <button onClick={() => navigate('/admin/dashboard')} className="hover:text-indigo-600 transition-colors">Admin</button>
            <span>/</span>
            <span className="text-gray-600 font-medium">Drivers</span>
          </div>
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Driver Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {loading ? 'Loading…' : `${drivers.length} driver${drivers.length !== 1 ? 's' : ''} · ${available} available`}
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/drivers/add')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm self-start sm:self-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Driver
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, plate..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none bg-white" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none bg-white text-gray-700">
            <option value="all">All Status</option>
            <option value="available">Available ({available})</option>
            <option value="unavailable">Unavailable ({drivers.length - available})</option>
          </select>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Drivers', value: drivers.length, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
            { label: 'Available', value: available, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
            { label: 'Unavailable', value: drivers.length - available, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-3 sm:p-4 text-center`}>
              <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Driver grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-14">
            <div className="text-4xl mb-3">🚘</div>
            <p className="text-base font-semibold text-gray-700 mb-1">{search || statusFilter !== 'all' ? 'No drivers match your filters' : 'No drivers yet'}</p>
            <p className="text-sm text-gray-400 mb-4">
              {search || statusFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Add your first driver to get started.'}
            </p>
            <button onClick={() => navigate('/admin/drivers/add')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              Add Driver
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map(driver => (
              <DriverCard key={driver._id} driver={driver} onEdit={() => navigate(`/admin/drivers/add?edit=${driver._id}`)} onDelete={() => handleDelete(driver)} onToggle={() => handleToggle(driver)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DriverCard = ({ driver, onEdit, onDelete, onToggle }) => {
  const initials = (driver.name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card top */}
      <div className="bg-indigo-600 px-3 py-3 flex items-center gap-2.5">
        {driver.driverPhoto ? (
          <img src={driver.driverPhoto} alt={driver.name} className="w-11 h-11 rounded-full object-cover border-2 border-white/40 flex-shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{initials}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm truncate">{driver.name}</p>
          <p className="text-indigo-200 text-xs">{driver.phone}</p>
        </div>
        <button onClick={onToggle} title="Toggle availability"
          className={`flex-shrink-0 px-2 py-1 rounded-full text-[11px] font-semibold transition-colors ${
            driver.status === 'available' ? 'bg-emerald-400/30 text-white hover:bg-emerald-400/50' : 'bg-red-400/30 text-white hover:bg-red-400/50'
          }`}>
          {driver.status === 'available' ? 'Active' : 'Busy'}
        </button>
      </div>
      {/* Card body */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          {[
            { label: 'Licence', value: driver.licenceType },
            { label: 'Exp.', value: `${driver.drivingExperience} yrs` },
            driver.carType   ? { label: 'Car Type', value: driver.carType }   : null,
            driver.carNumber ? { label: 'Plate', value: driver.carNumber, mono: true } : null,
          ].filter(Boolean).map(({ label, value, mono }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-2">
              <p className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</p>
              <p className={`text-xs font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
          ))}
        </div>
        {driver.carModel && <p className="text-xs text-gray-500 mb-2">🚗 {driver.carModel}</p>}
        {driver.languagesKnown?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {driver.languagesKnown.map(l => (
              <span key={l} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{l}</span>
            ))}
          </div>
        )}
        {/* Login credentials */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mb-2.5">
          <p className="text-[9px] text-amber-700 font-semibold uppercase">Login</p>
          <p className="text-[10px] text-amber-600 font-mono truncate">{driver.phone}@driver.nextdrive</p>
          <p className="text-[10px] text-amber-600 font-mono">pw: {driver.phone?.slice(-6)}</p>
        </div>
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button onClick={onEdit}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
            Edit
          </button>
          <button onClick={onDelete}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDriverList;
