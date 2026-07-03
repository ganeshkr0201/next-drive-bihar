import { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import adminService from '../services/adminService';
import carService from '../services/carService';

const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_API_KEY || '';

const TRIP_TYPES = [
  { id: 'one-way',    label: 'One Way',    icon: '→', desc: 'Single direction trip' },
  { id: 'round-trip', label: 'Round Trip', icon: '↔', desc: 'Return journey included' },
  { id: 'outstation', label: 'Outstation', icon: '⛰', desc: 'Out of city travel' },
  { id: 'marriage',   label: 'Marriage',   icon: '♡', desc: 'Wedding fleet booking' },
  { id: 'monthly',    label: 'Monthly',    icon: '♾', desc: 'Monthly subscription' }
];

const CAR_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Tempo Traveller', 'Bus', 'Multiple'];

const defaultForm = {
  customerName: '', customerPhone: '', customerEmail: '', customerWhatsapp: '',
  tripType: 'one-way',
  carType: 'Sedan',
  pickupLocation: '', dropoffLocation: '',
  pickupDate: '', pickupTime: '', dropoffDate: '', dropoffTime: '',
  numberOfPassengers: 1,
  numberOfCars: 1, selectedCars: [],
  totalAmount: '', paidAmount: '', discount: '',
  assignedDriverId: '',
  specialRequests: '', notes: ''
};

// Determines if this trip type needs a drop date
const needsDropDate = (tripType) => tripType !== 'one-way';
const showTollNote   = (tripType) => tripType === 'one-way' || tripType === 'round-trip';

const InputField = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
      {hint && <span className="ml-2 text-gray-400 normal-case font-normal">{hint}</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const sectionCls = "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden";

const AdminOfflineBooking = () => {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [availableCars, setAvailableCars] = useState([]);
  const [availableDriversList, setAvailableDriversList] = useState([]);
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showSourceSug, setShowSourceSug] = useState(false);
  const [showDestSug, setShowDestSug] = useState(false);
  const sourceTimer = useRef(null);
  const destTimer = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    carService.getAvailableCars().then(setAvailableCars).catch(() => {});
    import('../services/driverService.js').then(m => m.getAllDrivers()).then(res => setAvailableDriversList(res.data || [])).catch(() => {});
  }, []);

  // Clear drop date when switching to one-way
  useEffect(() => {
    if (form.tripType === 'one-way') {
      setForm(prev => ({ ...prev, dropoffDate: '', dropoffTime: '' }));
    }
  }, [form.tripType]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const fetchSuggestions = async (query, type) => {
    if (query.length < 3) {
      type === 'source' ? setSourceSuggestions([]) : setDestSuggestions([]);
      return;
    }
    try {
      const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query + ', Bihar')}&location=25.5941,85.1376&radius=300000&language=en&api_key=${OLA_MAPS_API_KEY}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.predictions || [])
          .filter(s => s.description?.toLowerCase().includes('bihar'))
          .slice(0, 6);
        type === 'source' ? setSourceSuggestions(filtered) : setDestSuggestions(filtered);
      }
    } catch { /* silent */ }
  };

  const handleLocationInput = (value, type) => {
    if (type === 'source') { set('pickupLocation', value); setShowSourceSug(true); }
    else { set('dropoffLocation', value); setShowDestSug(true); }
    const timer = type === 'source' ? sourceTimer : destTimer;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchSuggestions(value, type), 350);
  };

  const selectSuggestion = (s, type) => {
    const label = s.description || s.structured_formatting?.main_text || '';
    if (type === 'source') { set('pickupLocation', label); setShowSourceSug(false); setSourceSuggestions([]); }
    else { set('dropoffLocation', label); setShowDestSug(false); setDestSuggestions([]); }
  };

  // Allow typing up to 12 digits. On submit, if 12 digits and starts with 91 → strip to 10.
  // Valid if: 10 digits, OR 12 digits starting with 91
  const normalizePhone = (value) => {
    const digits = value.replace(/\D/g, ''); // digits only
    return digits.slice(0, 12); // allow up to 12 chars while typing
  };

  // Returns clean 10-digit number for saving (strips 91 prefix if 12 digits)
  const resolvePhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2); // strip country code
    }
    return digits;
  };

  const isValidPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
  };

  const handlePhoneChange = (field, value) => {
    set(field, normalizePhone(value));
  };

  const toggleMarriageCar = (car) => {
    setForm(prev => {
      const exists = prev.selectedCars.find(c => c.carId === car._id);
      if (exists) return { ...prev, selectedCars: prev.selectedCars.filter(c => c.carId !== car._id) };
      return { ...prev, selectedCars: [...prev.selectedCars, { carId: car._id, carName: car.name, carType: car.carType, quantity: 1, pricePerDay: car.pricing?.marriage?.perDay || 0 }] };
    });
  };

  const updateCarQuantity = (carId, delta) => {
    setForm(prev => {
      const updated = prev.selectedCars.map(c => {
        if (c.carId !== carId) return c;
        const newQty = Math.max(1, (c.quantity || 1) + delta);
        return { ...c, quantity: newQty };
      });
      // Recalculate total numberOfCars
      const totalCars = updated.reduce((sum, c) => sum + (c.quantity || 1), 0);
      return { ...prev, selectedCars: updated, numberOfCars: totalCars };
    });
  };

  const total = Number(form.totalAmount) || 0;
  const paid  = Number(form.paidAmount) || 0;
  const disc  = Number(form.discount) || 0;
  const due   = Math.max(0, total - paid - disc);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim()) return showError('Customer name and phone are required');
    if (!isValidPhone(form.customerPhone)) return showError('Phone number must be 10 digits or 12 digits starting with 91');
    if (form.customerWhatsapp && !isValidPhone(form.customerWhatsapp)) return showError('WhatsApp number must be 10 digits or 12 digits starting with 91');
    if (!form.pickupLocation.trim() || !form.dropoffLocation.trim()) return showError('Pickup and drop locations are required');
    if (!form.pickupDate) return showError('Pickup date is required');
    if (needsDropDate(form.tripType) && !form.dropoffDate) return showError('Drop date is required for this trip type');
    if (!form.totalAmount) return showError('Total amount is required');
    if (paid + disc > total) return showError('Paid amount + discount cannot exceed total amount');

    setSubmitting(true);
    try {
      const totalCars = form.selectedCars.length > 0
        ? form.selectedCars.reduce((sum, c) => sum + (c.quantity || 1), 0)
        : Number(form.numberOfCars) || 1;

      const payload = {
        ...form,
        customerPhone: resolvePhone(form.customerPhone),
        customerWhatsapp: form.customerWhatsapp ? resolvePhone(form.customerWhatsapp) : '',
        numberOfPassengers: Number(form.numberOfPassengers) || 1,
        numberOfCars: totalCars,
        totalAmount: total,
        paidAmount: paid,
        discount: disc,
        selectedCars: form.selectedCars.map(c => ({ ...c, quantity: c.quantity || 1 }))
      };
      const result = await adminService.createOfflineCarBooking(payload);
      setCreatedBooking(result);
      showSuccess('Booking created successfully!');
      setForm(defaultForm);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showError(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Offline Booking</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create walk-in or WhatsApp bookings for customers</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
            Admin Only
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Success Banner */}
        {createdBooking && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-900 text-lg">Booking Created Successfully</h3>
                <p className="text-emerald-700 text-sm mt-0.5">Reference: <span className="font-mono font-bold">{createdBooking.booking?.bookingReference}</span></p>
                <div className="flex flex-wrap gap-3 mt-4">
                  {createdBooking.whatsappLink && (
                    <a href={createdBooking.whatsappLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.101 1.514 5.835L.036 23.5l5.823-1.527A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.5-5.063-1.371l-.363-.215-3.754.984.998-3.648-.237-.375A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      Send WhatsApp Confirmation
                    </a>
                  )}
                  <button onClick={() => setCreatedBooking(null)}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                    Create Another Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1. Customer Details */}
          <div className={sectionCls}>
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Customer Details</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Full Name" required>
                <input type="text" required value={form.customerName} onChange={e => set('customerName', e.target.value)} className={inputCls} placeholder="e.g. Ramesh Kumar" />
              </InputField>
              <InputField label="Phone Number" required hint="(used for WhatsApp)">
                <input type="tel" required value={form.customerPhone}
                  onChange={e => handlePhoneChange('customerPhone', e.target.value)}
                  className={inputCls} placeholder="e.g. 9876543210 or 919876543210"
                  maxLength={12} />
                {form.customerPhone.length > 0 && !isValidPhone(form.customerPhone) && (
                  <p className="text-xs text-amber-600 mt-1">
                    Enter 10 digits, or 12 digits with country code (91XXXXXXXXXX)
                  </p>
                )}
                {form.customerPhone.length > 0 && isValidPhone(form.customerPhone) && (
                  <p className="text-xs text-green-600 mt-1">
                    {form.customerPhone.length === 12
                      ? `Will save as: ${resolvePhone(form.customerPhone)}`
                      : 'Valid'}
                  </p>
                )}
              </InputField>
              <InputField label="WhatsApp Number" hint="(if different from phone)">
                <input type="tel" value={form.customerWhatsapp}
                  onChange={e => handlePhoneChange('customerWhatsapp', e.target.value)}
                  className={inputCls} placeholder="Leave blank to use phone number"
                  maxLength={12} />
                {form.customerWhatsapp.length > 0 && !isValidPhone(form.customerWhatsapp) && (
                  <p className="text-xs text-amber-600 mt-1">
                    Enter 10 digits, or 12 digits with country code (91XXXXXXXXXX)
                  </p>
                )}
                {form.customerWhatsapp.length > 0 && isValidPhone(form.customerWhatsapp) && (
                  <p className="text-xs text-green-600 mt-1">
                    {form.customerWhatsapp.length === 12
                      ? `Will save as: ${resolvePhone(form.customerWhatsapp)}`
                      : 'Valid'}
                  </p>
                )}
              </InputField>
              <InputField label="Email Address" hint="(optional)">
                <input type="email" value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)} className={inputCls} placeholder="customer@email.com" />
              </InputField>
            </div>
          </div>

          {/* 2. Trip Type */}
          <div className={sectionCls}>
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Trip Type</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {TRIP_TYPES.map(t => (
                  <button key={t.id} type="button" onClick={() => set('tripType', t.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-4 rounded-lg border-2 transition-all text-center ${
                      form.tripType === t.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-sm font-bold">{t.label}</span>
                    <span className="text-xs text-gray-400 leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
              {showTollNote(form.tripType) && (
                <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-amber-800 font-medium">Toll, parking & other charges are to be paid by the customer and are not included in the fare.</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Locations */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Locations</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-visible">
              {/* Pickup */}
              <InputField label="Pickup Location" required hint="Type a city/area or enter any custom address">
                <div className="relative">
                  <input type="text" required value={form.pickupLocation}
                    onChange={e => handleLocationInput(e.target.value, 'source')}
                    onBlur={() => setTimeout(() => setShowSourceSug(false), 200)}
                    onFocus={() => form.pickupLocation.length >= 3 && setShowSourceSug(true)}
                    className={inputCls} placeholder="City, area or full address..." />
                  {showSourceSug && sourceSuggestions.length > 0 && (
                    <ul className="absolute z-[100] top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                      {sourceSuggestions.map((s, i) => (
                        <li key={i} onClick={() => selectSuggestion(s, 'source')}
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0">
                          <span className="font-medium text-gray-800">{s.structured_formatting?.main_text || s.description}</span>
                          {s.structured_formatting?.secondary_text && <span className="text-gray-400 ml-1.5 text-xs">{s.structured_formatting.secondary_text}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Free-type indicator — shown when typed but no suggestions returned */}
                  {form.pickupLocation.trim().length >= 3 && !showSourceSug && sourceSuggestions.length === 0 && (
                    <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      </svg>
                      Custom location — will be saved as entered (distance = N/A)
                    </p>
                  )}
                </div>
              </InputField>

              {/* Drop */}
              <InputField label="Drop Location" required hint="Type a city/area or enter any custom address">
                <div className="relative">
                  <input type="text" required value={form.dropoffLocation}
                    onChange={e => handleLocationInput(e.target.value, 'dest')}
                    onBlur={() => setTimeout(() => setShowDestSug(false), 200)}
                    onFocus={() => form.dropoffLocation.length >= 3 && setShowDestSug(true)}
                    className={inputCls} placeholder="City, area or full address..." />
                  {showDestSug && destSuggestions.length > 0 && (
                    <ul className="absolute z-[100] top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                      {destSuggestions.map((s, i) => (
                        <li key={i} onClick={() => selectSuggestion(s, 'dest')}
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0">
                          <span className="font-medium text-gray-800">{s.structured_formatting?.main_text || s.description}</span>
                          {s.structured_formatting?.secondary_text && <span className="text-gray-400 ml-1.5 text-xs">{s.structured_formatting.secondary_text}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {form.dropoffLocation.trim().length >= 3 && !showDestSug && destSuggestions.length === 0 && (
                    <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      </svg>
                      Custom location — will be saved as entered (distance = N/A)
                    </p>
                  )}
                </div>
              </InputField>
            </div>
          </div>

          {/* 4. Dates & Times — conditional based on trip type */}
          <div className={sectionCls}>
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                {needsDropDate(form.tripType) ? 'Pickup & Drop Dates' : 'Pickup Date & Time'}
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Pickup Date" required>
                <input type="date" required min={today} value={form.pickupDate} onChange={e => set('pickupDate', e.target.value)} className={inputCls} />
              </InputField>
              <InputField label="Pickup Time">
                <input type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} className={inputCls} />
              </InputField>
              {needsDropDate(form.tripType) && (
                <>
                  <InputField label="Drop Date" required>
                    <input type="date" required min={form.pickupDate || today} value={form.dropoffDate} onChange={e => set('dropoffDate', e.target.value)} className={inputCls} />
                  </InputField>
                  <InputField label="Drop Time">
                    <input type="time" value={form.dropoffTime} onChange={e => set('dropoffTime', e.target.value)} className={inputCls} />
                  </InputField>
                </>
              )}
            </div>
          </div>

          {/* 5. Vehicle & Passengers */}
          <div className={sectionCls}>
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Vehicle & Passengers</h2>
            </div>
            <div className="p-5">
              {form.tripType !== 'marriage' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Car Type" required>
                    <select value={form.carType} onChange={e => set('carType', e.target.value)} className={inputCls}>
                      {CAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </InputField>
                  <InputField label="Number of Passengers" required>
                    <input type="text" inputMode="numeric" value={form.numberOfPassengers}
                      onChange={e => set('numberOfPassengers', e.target.value.replace(/[^\d]/g, ''))}
                      onBlur={e => set('numberOfPassengers', Math.max(1, parseInt(e.target.value) || 1))}
                      className={inputCls} />
                  </InputField>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Passengers field */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Number of Passengers">
                      <input type="text" inputMode="numeric" value={form.numberOfPassengers}
                        onChange={e => set('numberOfPassengers', e.target.value.replace(/[^\d]/g, ''))}
                        onBlur={e => set('numberOfPassengers', Math.max(1, parseInt(e.target.value) || 1))}
                        className={inputCls} placeholder="Total passengers" />
                    </InputField>
                    {/* Total cars badge — auto-computed from selected */}
                    <div className="flex flex-col justify-end">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Total Cars Selected</p>
                      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        <span className="text-sm font-bold text-blue-700">
                          {form.selectedCars.reduce((sum, c) => sum + (c.quantity || 1), 0)} car(s)
                        </span>
                        {form.selectedCars.length === 0 && (
                          <span className="text-xs text-gray-400 ml-1">— select cars below</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Car selection with quantity */}
                  {availableCars.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Select Vehicles & Quantity
                        <span className="font-normal text-gray-400 normal-case ml-1">(click to add, use +/- for quantity)</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {availableCars.map(car => {
                          const selected = form.selectedCars.find(c => c.carId === car._id);
                          return (
                            <div key={car._id}
                              className={`rounded-xl border-2 transition-all overflow-hidden ${
                                selected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                              }`}>
                              {/* Car info row — click to toggle */}
                              <div
                                onClick={() => toggleMarriageCar(car)}
                                className={`flex items-center gap-3 p-3.5 cursor-pointer ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                  {selected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900 truncate">{car.name}</p>
                                  <p className="text-xs text-gray-500">{car.carType} &middot; {car.numberOfSeats} seats</p>
                                  <p className="text-xs font-semibold text-blue-600 mt-0.5">
                                    Rs. {(car.pricing?.marriage?.perDay || 0).toLocaleString('en-IN')}/day
                                  </p>
                                </div>
                              </div>

                              {/* Quantity controls — only shown when selected */}
                              {selected && (
                                <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-t border-blue-100">
                                  <span className="text-xs text-gray-500 font-medium">Quantity</span>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => updateCarQuantity(car._id, -1)}
                                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors"
                                    >−</button>
                                    <span className="text-sm font-bold text-gray-900 w-5 text-center">
                                      {selected.quantity || 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateCarQuantity(car._id, 1)}
                                      className="w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white font-bold transition-colors"
                                    >+</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Selected cars summary */}
                      {form.selectedCars.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Selected Fleet Summary</p>
                          <div className="space-y-2">
                            {form.selectedCars.map(c => (
                              <div key={c.carId} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold">
                                    {c.quantity || 1}
                                  </span>
                                  <span className="font-medium text-gray-800">{c.carName}</span>
                                  <span className="text-xs text-gray-500">({c.carType})</span>
                                </div>
                                <span className="text-blue-600 font-semibold">
                                  Rs. {((c.pricePerDay || 0) * (c.quantity || 1)).toLocaleString('en-IN')}/day
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between text-sm font-bold">
                            <span className="text-gray-700">Total: {form.selectedCars.reduce((s, c) => s + (c.quantity || 1), 0)} car(s)</span>
                            <span className="text-blue-700">
                              Rs. {form.selectedCars.reduce((s, c) => s + ((c.pricePerDay || 0) * (c.quantity || 1)), 0).toLocaleString('en-IN')}/day
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-sm text-gray-500">
                      No cars available in the system. You can still specify the total manually.
                      <div className="mt-3">
                        <InputField label="Number of Cars">
                          <input type="text" inputMode="numeric" value={form.numberOfCars}
                            onChange={e => set('numberOfCars', e.target.value.replace(/[^\d]/g, ''))}
                            onBlur={e => set('numberOfCars', Math.max(1, parseInt(e.target.value) || 1))}
                            className={inputCls} />
                        </InputField>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 6. Pricing */}
          <div className={sectionCls}>
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Pricing</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField label="Total Amount (Rs.)" required>
                  <input type="number" required min="0" value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)} className={inputCls} placeholder="0" />
                </InputField>
                <InputField label="Paid Amount (Rs.)">
                  <input type="number" min="0" value={form.paidAmount} onChange={e => set('paidAmount', e.target.value)} className={inputCls} placeholder="0" />
                </InputField>
                <InputField label="Discount (Rs.)">
                  <input type="number" min="0" value={form.discount} onChange={e => set('discount', e.target.value)} className={inputCls} placeholder="0" />
                </InputField>
              </div>
              {total > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total', value: total, color: 'text-gray-900' },
                    { label: 'Discount', value: disc, color: 'text-orange-600' },
                    { label: 'Paid', value: paid, color: 'text-emerald-600' },
                    { label: 'Balance Due', value: due, color: due > 0 ? 'text-red-600 font-extrabold' : 'text-emerald-600' },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <p className={`text-base font-bold ${item.color}`}>Rs. {item.value.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              )}
              {paid + disc > total && total > 0 && (
                <p className="mt-2 text-xs text-red-600 font-semibold">Paid amount + discount cannot exceed total amount</p>
              )}
            </div>
          </div>

          {/* 7. Driver Assignment (optional) */}
          <div className={sectionCls}>
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Assign Driver <span className="text-gray-400 font-normal normal-case text-xs ml-1">(optional — can assign later too)</span></h2>
            </div>
            <div className="p-5">
              <InputField label="Select Driver">
                <select value={form.assignedDriverId || ''} onChange={e => set('assignedDriverId', e.target.value)} className={inputCls}>
                  <option value="">-- No driver assigned (assign later) --</option>
                  {availableCars.length === 0 && <option disabled>Loading drivers...</option>}
                  {availableDriversList.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name} &bull; {d.phone} &bull; {d.carType} &bull; {d.carNumber || 'No plate'}
                    </option>
                  ))}
                </select>
              </InputField>
              {form.assignedDriverId && availableDriversList.find(d => d._id === form.assignedDriverId) && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
                  {(() => {
                    const d = availableDriversList.find(dr => dr._id === form.assignedDriverId);
                    return <span>Selected: <strong>{d.name}</strong> &bull; {d.carModel} &bull; {d.carNumber} &bull; Exp: {d.drivingExperience} yrs</span>;
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* 8. Notes */}
          <div className={sectionCls}>
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Notes</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Customer Requests">
                <textarea rows="3" value={form.specialRequests} onChange={e => set('specialRequests', e.target.value)} className={`${inputCls} resize-none`} placeholder="Special requirements from customer..." />
              </InputField>
              <InputField label="Admin Notes">
                <textarea rows="3" value={form.notes} onChange={e => set('notes', e.target.value)} className={`${inputCls} resize-none`} placeholder="Internal notes for team..." />
              </InputField>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={submitting || (paid + disc > total && total > 0)}
              className="flex-1 sm:flex-none sm:px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:cursor-not-allowed">
              {submitting ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Creating...</>
              ) : 'Create Booking & Get WhatsApp Message'}
            </button>
            <button type="button" onClick={() => setForm(defaultForm)}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors">
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminOfflineBooking;
