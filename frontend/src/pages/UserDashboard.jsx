import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserQueries from '../components/UserQueries/UserQueries';
import bookingService from '../services/bookingService';

/* ─── helpers ─────────────────────────────────────────────────────────── */
const fmt = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

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
  confirmed:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending:     'bg-amber-100  text-amber-800  border-amber-200',
  'in-progress':'bg-blue-100  text-blue-800   border-blue-200',
  completed:   'bg-gray-100   text-gray-700   border-gray-200',
  cancelled:   'bg-red-100    text-red-800    border-red-200',
};

/* ─── Icon helpers (keep JSX clean) ───────────────────────────────────── */
const Icon = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const WAIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

/* ─── Sub-components ───────────────────────────────────────────────────── */
const StatCard = ({ title, value, icon, color, pulse }) => {
  const s = {
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100',    ib: 'bg-blue-100' },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ib: 'bg-emerald-100' },
    purple: { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-100',  ib: 'bg-violet-100' },
    orange: { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   ib: 'bg-amber-100' },
    red:    { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100',     ib: 'bg-red-100' },
    gray:   { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200',    ib: 'bg-gray-100' },
  }[color] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', ib: 'bg-gray-100' };

  return (
    <div className={`p-4 sm:p-5 rounded-xl border transition-shadow hover:shadow-md cursor-default ${s.bg} ${s.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold mt-1 ${s.text}`}>{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg ${s.ib} ${s.text} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {pulse && value > 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">In progress</span>
        </div>
      )}
    </div>
  );
};

/* ─── BookingCard ──────────────────────────────────────────────────────── */
const BookingCard = ({ booking, onCancel, onRefresh }) => {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const isCar  = booking.type === 'car'  || !!booking.carType;
  const isTour = booking.type === 'tour' || !!booking.tourPackage;

  let extra = {};
  if (isCar && booking.notes?.length) {
    try { extra = JSON.parse(booking.notes[0].content); } catch { /* noop */ }
  }

  const contact  = isCar ? extra.contactNumber  : booking.contactNumber;
  const wa       = isCar ? extra.emergencyContact : booking.emergencyContact;
  const dist     = extra.distance;
  const estTime  = extra.estimatedTime;

  const handleCancel = async () => {
    const reason = prompt('Reason for cancellation (required):');
    if (!reason?.trim()) { showToast('Cancellation reason is required', 'error'); return; }
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingService.cancelBooking(booking._id, reason.trim());
      showToast('Booking cancelled', 'success');
      onRefresh();
    } catch (e) { showToast(e.message || 'Failed to cancel', 'error'); }
  };

  const status = booking.status;
  const statusClass = STATUS_STYLES[status] || STATUS_STYLES.completed;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
        {/* Card header */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Type icon */}
            <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isCar ? 'bg-emerald-50' : 'bg-indigo-50'
            }`}>
              <img src={isCar ? '/car_logo.svg' : '/tour_logo.svg'} alt="" className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            {/* Title + ref */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                    {isCar
                      ? (extra.carName ? `${extra.carName} · ${booking.carType}` : booking.carType)
                      : (booking.tourPackage?.title || 'Tour Package')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      isCar ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {isCar ? '🚗 Car Rental' : '🎯 Tour Package'}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">#{booking.bookingReference}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border flex-shrink-0 ${statusClass}`}>
                  <span className="capitalize">{status.replace('-', ' ')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Key info row */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {isCar ? 'Pickup' : 'Travel'} Date
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {fmtDate(booking.pickupDate || booking.travelDate)}
              </p>
              {isCar && booking.pickupTime && (
                <p className="text-xs text-gray-500 mt-0.5">{fmtTime(booking.pickupTime)}</p>
              )}
            </div>

            {isCar && booking.dropoffDate && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Drop-off</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtDate(booking.dropoffDate)}</p>
                {booking.dropoffTime && (
                  <p className="text-xs text-gray-500 mt-0.5">{fmtTime(booking.dropoffTime)}</p>
                )}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {isTour ? 'Travelers' : 'Passengers'}
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {isTour ? booking.numberOfTravelers : (booking.numberOfPassengers || '—')} people
              </p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-sm font-bold text-emerald-700 mt-0.5">{fmt(booking.totalAmount)}</p>
            </div>
          </div>

          {/* Status banner */}
          {status === 'pending' && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              Awaiting confirmation — we'll update you soon
            </div>
          )}
          {status === 'confirmed' && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 font-medium">
              <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 flex-shrink-0" />
              Booking confirmed — get ready! 🎉
            </div>
          )}
          {status === 'completed' && (
            <div className="mt-3 flex items-center justify-between gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
              <span className="text-sm text-indigo-800 font-medium">Trip done! How was your experience?</span>
              <button
                onClick={() => setShowFeedback(true)}
                className="flex-shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors"
              >
                Rate Trip
              </button>
            </div>
          )}
          {status === 'cancelled' && booking.cancellationReason && (
            <div className="mt-3 px-3 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-0.5">Booking cancelled</p>
              <p className="text-sm text-red-700">{booking.cancellationReason}</p>
              {booking.cancelledAt && (
                <p className="text-xs text-red-400 mt-1">
                  {fmtDateTime(booking.cancelledAt)}
                  {booking.cancelledByType && ` · by ${booking.cancelledByType === 'admin' ? 'Admin' : 'You'}`}
                </p>
              )}
            </div>
          )}

          {/* Footer row */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <span className="text-sm text-gray-400">Booked {fmtDate(booking.createdAt)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(p => !p)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 hover:bg-indigo-50 rounded-md transition-colors"
              >
                {open ? 'Hide Details' : 'View Details'}
              </button>
              {status === 'pending' && (
                <button
                  onClick={handleCancel}
                  className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 hover:bg-red-50 border border-red-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded details */}
        {open && (
          <div className="border-t border-gray-100 bg-gray-50 p-4 sm:p-6 space-y-5">
            {/* Payment */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Paid', val: fmt(booking.paidAmount || 0), c: 'text-emerald-600' },
                  { label: 'Discount', val: fmt(booking.discount || 0), c: 'text-amber-600' },
                  { label: 'Due', val: fmt(Math.max(0, booking.totalAmount - (booking.discount||0) - (booking.paidAmount||0))), c: (booking.totalAmount - (booking.discount||0) - (booking.paidAmount||0)) > 0 ? 'text-red-600' : 'text-gray-400' },
                ].map(({ label, val, c }) => (
                  <div key={label} className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-400 uppercase">{label}</p>
                    <p className={`text-sm sm:text-base font-bold mt-0.5 ${c}`}>{val}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between items-center bg-white rounded-lg px-4 py-2.5 border border-gray-200">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-base font-bold text-gray-900">{fmt(booking.totalAmount)}</span>
              </div>
            </div>

            {/* Contact & Location */}
            {(contact || wa || booking.pickupLocation || booking.dropoffLocation || booking.dropLocation || booking.specialRequests) && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact & Location</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contact && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-400 uppercase mb-0.5">Phone</p>
                      <a href={`tel:${contact}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">{contact}</a>
                    </div>
                  )}
                  {wa && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-400 uppercase mb-0.5 flex items-center gap-1"><WAIcon />WhatsApp</p>
                      <a href={`https://wa.me/${wa.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-800">{wa}</a>
                    </div>
                  )}
                  {booking.pickupLocation && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-400 uppercase mb-0.5">Pickup</p>
                      <p className="text-sm font-medium text-gray-800">{booking.pickupLocation}</p>
                    </div>
                  )}
                  {(booking.dropoffLocation || booking.dropLocation) && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-400 uppercase mb-0.5">Drop-off</p>
                      <p className="text-sm font-medium text-gray-800">{booking.dropoffLocation || booking.dropLocation}</p>
                    </div>
                  )}
                  {booking.specialRequests && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200 sm:col-span-2">
                      <p className="text-xs text-gray-400 uppercase mb-0.5">Special Requests</p>
                      <p className="text-sm text-gray-800">{booking.specialRequests}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Car trip extras */}
            {isCar && (dist || estTime || booking.tripType) && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Trip Info</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {booking.tripType && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-400 uppercase mb-0.5">Trip Type</p>
                      <p className="text-sm font-medium text-gray-800 capitalize">{booking.tripType.replace('-',' ')}</p>
                    </div>
                  )}
                  {dist && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-400 uppercase mb-0.5">Distance</p>
                      <p className="text-sm font-medium text-gray-800">
                        {booking.tripType === 'round-trip' ? `${dist} × 2 km` : `${dist} km`}
                      </p>
                    </div>
                  )}
                  {estTime && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-400 uppercase mb-0.5">Est. Time</p>
                      <p className="text-sm font-medium text-gray-800">{estTime}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Marriage cars */}
            {isCar && booking.tripType === 'marriage' && booking.selectedCars?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Marriage Booking · {booking.numberOfCars} Car{booking.numberOfCars !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {booking.selectedCars.map((car, i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-pink-100">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs font-bold flex items-center justify-center">{i+1}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{car.carName}</p>
                          <p className="text-xs text-gray-500">{car.carType}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-pink-600">₹{car.pricePerDay?.toLocaleString()}/day</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Driver */}
            {isCar && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Driver & Vehicle</p>
                {booking.assignedDriver ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-4 border border-blue-100 flex items-start gap-3">
                      {booking.assignedDriver.driverPhoto ? (
                        <img src={booking.assignedDriver.driverPhoto} alt="Driver"
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                          {booking.assignedDriver.name?.[0] || 'D'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{booking.assignedDriver.name}</p>
                        {booking.assignedDriver.licenceType && (
                          <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{booking.assignedDriver.licenceType}</span>
                        )}
                        {booking.assignedDriver.phone && (
                          <a href={`tel:${booking.assignedDriver.phone}`} className="flex items-center gap-1 text-sm text-indigo-600 mt-1">
                            <Icon d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" className="w-3.5 h-3.5" />
                            {booking.assignedDriver.phone}
                          </a>
                        )}
                        {booking.assignedDriver.drivingExperience != null && (
                          <p className="text-xs text-gray-500 mt-0.5">{booking.assignedDriver.drivingExperience} yrs exp.</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Vehicle</p>
                      {booking.assignedDriver.carModel && <p className="text-sm font-semibold text-gray-900">{booking.assignedDriver.carModel}</p>}
                      {booking.assignedDriver.carNumber && (
                        <p className="text-sm font-mono font-bold text-indigo-700 tracking-widest mt-0.5">{booking.assignedDriver.carNumber}</p>
                      )}
                      {booking.assignedDriver.carType && <p className="text-xs text-gray-500 mt-0.5">{booking.assignedDriver.carType}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Icon d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Driver Not Yet Assigned</p>
                      <p className="text-xs text-amber-700 mt-0.5">Details will appear once assigned by admin.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tour highlights */}
            {isTour && booking.tourPackage?.highlights?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tour Highlights</p>
                <ul className="bg-white rounded-lg border border-gray-200 p-4 space-y-1.5">
                  {(Array.isArray(booking.tourPackage.highlights)
                    ? booking.tourPackage.highlights
                    : booking.tourPackage.highlights.split('\n')
                  ).map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span>{h.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {showFeedback && (
        <FeedbackModal
          booking={booking}
          onClose={() => setShowFeedback(false)}
          onSubmit={() => { setShowFeedback(false); onRefresh(); }}
        />
      )}
    </>
  );
};

/* ─── FeedbackModal ───────────────────────────────────────────────────── */
const FeedbackModal = ({ booking, onClose, onSubmit }) => {
  const { showToast } = useToast();
  const [fb, setFb] = useState({
    rating: 5, title: '', comment: '',
    categories: { service: 5, value: 5, cleanliness: 5, communication: 5 },
  });
  const [busy, setBusy] = useState(false);

  const Stars = ({ rating, onChange, label }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-24 flex-shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button" onClick={() => onChange(s)}
            className={`w-6 h-6 transition-colors ${s <= rating ? 'text-amber-400' : 'text-gray-200'} hover:text-amber-400`}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!fb.title.trim() || !fb.comment.trim()) {
      showToast('Title and review are required', 'error'); return;
    }
    setBusy(true);
    try {
      await bookingService.submitFeedback(booking._id, fb);
      showToast('Review submitted!', 'success');
      onSubmit();
    } catch (err) { showToast(err.message || 'Failed to submit', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Share Your Experience</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Icon d="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
            </button>
          </div>
          <div className="mb-4 p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-xs font-semibold text-gray-900 truncate">{booking.tourPackage?.title || 'Tour Package'}</p>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">#{booking.bookingReference}</p>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Overall Rating</p>
              <Stars rating={fb.rating} onChange={r => setFb(p=>({...p,rating:r}))} label="Overall" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Rate by Category</p>
              <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
                {[['service','Service'],['value','Value'],['cleanliness','Cleanliness'],['communication','Comms']].map(([k,l]) => (
                  <Stars key={k} rating={fb.categories[k]}
                    onChange={r => setFb(p=>({...p,categories:{...p.categories,[k]:r}}))} label={l} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Review Title *</label>
              <input required value={fb.title} onChange={e=>setFb(p=>({...p,title:e.target.value}))}
                maxLength="100" placeholder="Summarize your experience"
                className="w-full mt-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Your Review *</label>
              <textarea required rows={3} value={fb.comment} onChange={e=>setFb(p=>({...p,comment:e.target.value}))}
                maxLength="1000" placeholder="Tell us about your experience..."
                className="w-full mt-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none resize-none" />
              <p className="text-[10px] text-right text-gray-400">{fb.comment.length}/1000</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={busy}
                className="flex-1 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                {busy ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ─── BookingsTab ─────────────────────────────────────────────────────── */
const BookingsTab = ({ allBookings, loading, onRefresh }) => {
  const [filters, setFilters] = useState({ type: 'all', status: 'all', search: '' });
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const setF = useCallback((k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); }, []);
  const clear = useCallback(() => { setFilters({ type:'all', status:'all', search:'' }); setPage(1); }, []);

  const stats = {
    total: allBookings.length,
    tour: allBookings.filter(b => b.type==='tour'||b.tourPackage).length,
    car:  allBookings.filter(b => b.type==='car' ||b.carType).length,
    pending:   allBookings.filter(b => b.status==='pending').length,
    confirmed: allBookings.filter(b => b.status==='confirmed').length,
    completed: allBookings.filter(b => b.status==='completed').length,
    cancelled: allBookings.filter(b => b.status==='cancelled').length,
  };

  const filtered = allBookings
    .filter(b => {
      if (filters.type === 'tour') return b.type==='tour'||b.tourPackage;
      if (filters.type === 'car')  return b.type==='car' ||b.carType;
      return true;
    })
    .filter(b => filters.status === 'all' || b.status === filters.status)
    .filter(b => {
      const q = filters.search.toLowerCase().trim();
      if (!q) return true;
      return (
        b.bookingReference?.toLowerCase().includes(q) ||
        b.tourPackage?.title?.toLowerCase().includes(q) ||
        b.carType?.toLowerCase().includes(q) ||
        b.pickupLocation?.toLowerCase().includes(q) ||
        b.dropoffLocation?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const slice = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const hasFilter = filters.type!=='all' || filters.status!=='all' || filters.search;

  const STAT_ITEMS = [
    { label: 'All',        val: stats.total,     k: 'all',       color: 'blue' },
    { label: 'Tours',      val: stats.tour,       k: 'tour',      color: 'indigo' },
    { label: 'Cars',       val: stats.car,        k: 'car',       color: 'green' },
    { label: 'Pending',    val: stats.pending,    k: 'pending',   color: 'amber' },
    { label: 'Confirmed',  val: stats.confirmed,  k: 'confirmed', color: 'emerald' },
    { label: 'Completed',  val: stats.completed,  k: 'completed', color: 'gray' },
    { label: 'Cancelled',  val: stats.cancelled,  k: 'cancelled', color: 'red' },
  ];

  const chipColors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    gray: 'bg-gray-100 border-gray-200 text-gray-600',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className="space-y-4">
      {/* Quick-filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STAT_ITEMS.map(({ label, val, k, color }) => {
          const isTypeFilter = ['all','tour','car'].includes(k);
          const isStatusFilter = ['pending','confirmed','completed','cancelled'].includes(k);
          const active = isTypeFilter
            ? filters.type === k
            : filters.status === k;
          return (
            <button
              key={k}
              onClick={() => {
                if (isTypeFilter) setF('type', active ? 'all' : k);
                else setF('status', active ? 'all' : k);
              }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-all ${
                active
                  ? `${chipColors[color]} shadow-sm ring-1 ring-inset ring-current/20`
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>{label}</span>
              <span className={`text-xs font-bold px-1.5 rounded-full ${active ? 'bg-white/40' : 'bg-gray-100 text-gray-500'}`}>{val}</span>
            </button>
          );
        })}
      </div>

      {/* Search + status select row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={filters.search} onChange={e => setF('search', e.target.value)}
            placeholder="Search by reference, car type, location…"
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none bg-white"
          />
        </div>
        <select value={filters.status} onChange={e => setF('status', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none bg-white text-gray-700">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {hasFilter && (
          <button onClick={clear}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
          {hasFilter && <span className="text-indigo-600 ml-1">(filtered from {allBookings.length} total)</span>}
        </p>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : slice.length > 0 ? (
        <>
          <div className="space-y-3">
            {slice.map(b => (
              <BookingCard key={b._id} booking={b} onCancel={() => {}} onRefresh={onRefresh} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  Prev
                </button>
                {[...Array(totalPages)].map((_,i) => {
                  const n = i+1;
                  if (n===1||n===totalPages||(n>=page-1&&n<=page+1)) return (
                    <button key={n} onClick={() => setPage(n)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        page===n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:bg-gray-50'
                      }`}>{n}</button>
                  );
                  if (n===page-2||n===page+2) return <span key={n} className="text-gray-400 text-sm">…</span>;
                  return null;
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-14 px-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-800 mb-1">
            {hasFilter ? 'No bookings match your filters' : 'No bookings yet'}
          </p>
          <p className="text-sm text-gray-500 mb-5">
            {hasFilter ? 'Try clearing the filters to see all bookings.' : 'Start by booking a tour or renting a car.'}
          </p>
          {hasFilter ? (
            <button onClick={clear}
              className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium">
              Clear Filters
            </button>
          ) : (
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="/tour-packages" className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium">Browse Tours</a>
              <a href="/car-rental"    className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium">Rent a Car</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main page ───────────────────────────────────────────────────────── */
const UserDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const stats = {
    total:     allBookings.length,
    active:    allBookings.filter(b => ['pending','confirmed','in-progress'].includes(b.status)).length,
    completed: allBookings.filter(b => b.status==='completed').length,
    cancelled: allBookings.filter(b => b.status==='cancelled').length,
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setAllBookings(await bookingService.getUserBookings());
    } catch {
      showToast('Failed to load bookings', 'error');
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const TABS = [
    { id: 'overview',  label: 'Overview',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'bookings',  label: 'My Bookings', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', badge: stats.active },
    { id: 'support',   label: 'Support',     icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Hi, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your trips and account</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="/tour-packages"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
              <Icon d="M12 4v16m8-8H4" className="w-4 h-4" />Book Tour
            </a>
            <a href="/car-rental"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
              <Icon d="M12 4v16m8-8H4" className="w-4 h-4" />Rent Car
            </a>
          </div>
        </div>

        {/* Tab nav */}
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

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">My Overview</h2>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
              <StatCard title="Total Bookings" value={stats.total} color="blue"
                icon={<Icon d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-5 h-5" />} />
              <StatCard title="Active Trips" value={stats.active} color="green" pulse={stats.active > 0}
                icon={<Icon d="M13 10V3L4 14h7v7l9-11h-7z" className="w-5 h-5" />} />
              <StatCard title="Completed" value={stats.completed} color="purple"
                icon={<Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />} />
              <StatCard title="Cancelled" value={stats.cancelled} color="red"
                icon={<Icon d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />} />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
              {[
                { href:'/tour-packages', bg:'bg-indigo-600 hover:bg-indigo-700', img:'/tour_logo.svg', title:'Explore Tour Packages', desc:'Discover Bihar destinations' },
                { href:'/car-rental',    bg:'bg-emerald-600 hover:bg-emerald-700', img:'/car_logo.svg',  title:'Rent a Car',           desc:'Book comfortable vehicles' },
              ].map(({ href, bg, img, title, desc }) => (
                <a key={href} href={href}
                  className={`${bg} text-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-colors shadow-sm`}>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <img src={img} alt="" className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-semibold">{title}</p>
                    <p className="text-xs sm:text-sm text-white/70 mt-0.5 truncate">{desc}</p>
                  </div>
                  <Icon d="M9 5l7 7-7 7" className="w-5 h-5 text-white/50 ml-auto flex-shrink-0" />
                </a>
              ))}
            </div>

            {/* Recent bookings preview */}
            {allBookings.length > 0 && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-700">Recent Bookings</p>
                  <button onClick={() => setActiveTab('bookings')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all →</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {allBookings.slice(0,3).map(b => {
                    const isCar = b.type==='car'||!!b.carType;
                    let name = isCar ? b.carType : (b.tourPackage?.title || 'Tour');
                    try {
                      if (isCar && b.notes?.length) {
                        const d = JSON.parse(b.notes[0].content);
                        if (d.carName) name = `${d.carName} · ${b.carType}`;
                      }
                    } catch {}
                    return (
                      <button key={b._id} onClick={() => setActiveTab('bookings')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isCar?'bg-emerald-50':'bg-indigo-50'}`}>
                          <img src={isCar?'/car_logo.svg':'/tour_logo.svg'} alt="" className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                          <p className="text-xs text-gray-400 font-mono">#{b.bookingReference}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex-shrink-0 capitalize ${STATUS_STYLES[b.status]||STATUS_STYLES.completed}`}>
                          {b.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bookings tab */}
        {activeTab === 'bookings' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">My Bookings</h2>
              <span className="text-sm text-gray-500">{allBookings.length} total</span>
            </div>
            <BookingsTab allBookings={allBookings} loading={loading} onRefresh={loadData} />
          </div>
        )}

        {/* Support tab */}
        {activeTab === 'support' && (
          <div className="p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-800">Support Center</h2>
              <p className="text-sm text-gray-500 mt-0.5">Get help from our support team</p>
            </div>
            <UserQueries />
          </div>
        )}

        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
