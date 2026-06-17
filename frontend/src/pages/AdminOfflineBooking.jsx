import { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import adminService from '../services/adminService';
import carService from '../services/carService';

const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_API_KEY || '';

const TRIP_TYPES = [
  { id: 'one-way', label: 'One Way', icon: '→' },
  { id: 'round-trip', label: 'Round Trip', icon: '↔' },
  { id: 'outstation', label: 'Outstation', icon: '🏔️' },
  { id: 'marriage', label: 'Marriage', icon: '💒' },
  { id: 'monthly', label: 'Monthly', icon: '📅' }
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
  driverName: '', driverPhone: '',
  vehicleMake: '', vehicleModel: '', vehiclePlate: '', vehicleColor: '',
  specialRequests: '', notes: ''
};

const AdminOfflineBooking = () => {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [availableCars, setAvailableCars] = useState([]);
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showSourceSug, setShowSourceSug] = useState(false);
  const [showDestSug, setShowDestSug] = useState(false);
  const sourceTimer = useRef(null);
  const destTimer = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    carService.getAvailableCars().then(setAvailableCars).catch(() => {});
  }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const fetchSuggestions = async (query, type) => {
    if (query.length < 3) {
      type === 'source' ? setSourceSuggestions([]) : setDestSuggestions([]);
      return;
    }
    try {
      const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query + ', Bihar')}&location=25.5941,85.1376&radius=300000&language=en&api_key=${OLA_MAPS_API_KEY}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.predictions || []).filter(s => {
          const desc = s.description?.toLowerCase() || '';
          return desc.includes('bihar');
        }).slice(0, 6);
        type === 'source' ? setSourceSuggestions(filtered) : setDestSuggestions(filtered);
      }
    } catch { /* silently fail */ }
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

  const toggleMarriageCar = (car) => {
    setForm(prev => {
      const exists = prev.selectedCars.find(c => c.carId === car._id);
      if (exists) {
        return { ...prev, selectedCars: prev.selectedCars.filter(c => c.carId !== car._id) };
      }
      return {
        ...prev,
        selectedCars: [...prev.selectedCars, {
          carId: car._id, carName: car.name,
          carType: car.carType, pricePerDay: car.pricing?.marriage?.perDay || 0
        }]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone) return showError('Customer name and phone are required');
    if (!form.pickupLocation || !form.dropoffLocation) return showError('Pickup and drop locations are required');
    if (!form.pickupDate || !form.dropoffDate) return showError('Dates are required');
    if (!form.totalAmount) return showError('Total amount is required');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        numberOfPassengers: Number(form.numberOfPassengers) || 1,
        numberOfCars: Number(form.numberOfCars) || 1,
        totalAmount: Number(form.totalAmount),
        paidAmount: Number(form.paidAmount) || 0,
        discount: Number(form.discount) || 0,
      };
      const result = await adminService.createOfflineCarBooking(payload);
      setCreatedBooking(result);
      showSuccess('Offline booking created successfully!');
      setForm(defaultForm);
    } catch (err) {
      showError(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const due = (Number(form.totalAmount) || 0) - (Number(form.paidAmount) || 0) - (Number(form.discount) || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-10 px-4 shadow-xl">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-1">📋 Offline Booking</h1>
          <p className="text-white/90">Create walk-in / WhatsApp bookings for customers</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Success card */}
        {createdBooking && (
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">✅</span>
              <div>
                <h3 className="text-xl font-bold text-green-800">Booking Created!</h3>
                <p className="text-green-700">Ref: <strong>{createdBooking.booking?.bookingReference}</strong></p>
              </div>
            </div>
            {createdBooking.whatsappLink && (
              <a
                href={createdBooking.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.101 1.514 5.835L.036 23.5l5.823-1.527A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.5-5.063-1.371l-.363-.215-3.754.984.998-3.648-.237-.375A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Send WhatsApp Confirmation
              </a>
            )}
            <button onClick={() => setCreatedBooking(null)} className="ml-3 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all">
              Create Another
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">👤 Customer Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                <input type="text" required value={form.customerName} onChange={e => set('customerName', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Customer full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone * <span className="text-gray-400 text-xs">(used for WhatsApp)</span></label>
                <input type="tel" required value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 9876543210" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number <span className="text-gray-400 text-xs">(if different)</span></label>
                <input type="tel" value={form.customerWhatsapp} onChange={e => set('customerWhatsapp', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave blank to use phone number" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-gray-400 text-xs">(optional)</span></label>
                <input type="email" value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="customer@email.com" />
              </div>
            </div>
          </div>

          {/* Trip Type */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🗺️ Trip Type</h2>
            <div className="flex flex-wrap gap-3">
              {TRIP_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => set('tripType', t.id)}
                  className={`px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${form.tripType === t.id ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📍 Locations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup Location *</label>
                <input type="text" required value={form.pickupLocation}
                  onChange={e => handleLocationInput(e.target.value, 'source')}
                  onBlur={() => setTimeout(() => setShowSourceSug(false), 200)}
                  onFocus={() => form.pickupLocation.length >= 3 && setShowSourceSug(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type pickup location..." />
                {showSourceSug && sourceSuggestions.length > 0 && (
                  <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                    {sourceSuggestions.map((s, i) => (
                      <li key={i} onClick={() => selectSuggestion(s, 'source')}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0">
                        <span className="font-medium">{s.structured_formatting?.main_text || s.description}</span>
                        {s.structured_formatting?.secondary_text && <span className="text-gray-500 ml-1 text-xs">· {s.structured_formatting.secondary_text}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Drop Location *</label>
                <input type="text" required value={form.dropoffLocation}
                  onChange={e => handleLocationInput(e.target.value, 'dest')}
                  onBlur={() => setTimeout(() => setShowDestSug(false), 200)}
                  onFocus={() => form.dropoffLocation.length >= 3 && setShowDestSug(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type drop location..." />
                {showDestSug && destSuggestions.length > 0 && (
                  <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                    {destSuggestions.map((s, i) => (
                      <li key={i} onClick={() => selectSuggestion(s, 'dest')}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0">
                        <span className="font-medium">{s.structured_formatting?.main_text || s.description}</span>
                        {s.structured_formatting?.secondary_text && <span className="text-gray-500 ml-1 text-xs">· {s.structured_formatting.secondary_text}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Dates & Times */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📅 Dates & Times</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup Date *</label>
                <input type="date" required min={today} value={form.pickupDate} onChange={e => set('pickupDate', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup Time</label>
                <input type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Drop Date *</label>
                <input type="date" required min={form.pickupDate || today} value={form.dropoffDate} onChange={e => set('dropoffDate', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Drop Time</label>
                <input type="time" value={form.dropoffTime} onChange={e => set('dropoffTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Vehicle & Passengers */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🚗 Vehicle & Passengers</h2>
            {form.tripType !== 'marriage' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Car Type *</label>
                  <select value={form.carType} onChange={e => set('carType', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold">
                    {CAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Passengers *</label>
                  <input type="text" inputMode="numeric" value={form.numberOfPassengers}
                    onChange={e => { const v = e.target.value.replace(/[^\d]/g, ''); set('numberOfPassengers', v); }}
                    onBlur={e => { const n = parseInt(e.target.value) || 1; set('numberOfPassengers', Math.max(1, n)); }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Cars</label>
                    <input type="text" inputMode="numeric" value={form.numberOfCars}
                      onChange={e => { const v = e.target.value.replace(/[^\d]/g, ''); set('numberOfCars', v); }}
                      onBlur={e => { const n = parseInt(e.target.value) || 1; set('numberOfCars', Math.max(1, n)); }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Passengers</label>
                    <input type="text" inputMode="numeric" value={form.numberOfPassengers}
                      onChange={e => { const v = e.target.value.replace(/[^\d]/g, ''); set('numberOfPassengers', v); }}
                      onBlur={e => { const n = parseInt(e.target.value) || 1; set('numberOfPassengers', Math.max(1, n)); }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                {availableCars.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Cars <span className="text-gray-400 text-xs">(optional - tick to add)</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableCars.map(car => {
                        const selected = form.selectedCars.find(c => c.carId === car._id);
                        return (
                          <div key={car._id} onClick={() => toggleMarriageCar(car)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-sm">{car.name}</p>
                                <p className="text-xs text-gray-500">{car.carType} · {car.numberOfSeats} seats</p>
                                <p className="text-xs text-blue-600 font-semibold">₹{car.pricing?.marriage?.perDay || 0}/day</p>
                              </div>
                              {selected && <span className="text-blue-600 text-xl">✓</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {form.selectedCars.length > 0 && (
                      <p className="text-sm text-blue-700 font-semibold mt-2">✓ {form.selectedCars.length} car(s) selected</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">💰 Pricing (Set by Admin)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Amount (₹) *</label>
                <input type="number" required min="0" value={form.totalAmount}
                  onChange={e => set('totalAmount', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Paid Amount (₹)</label>
                <input type="number" min="0" value={form.paidAmount}
                  onChange={e => set('paidAmount', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Discount (₹)</label>
                <input type="number" min="0" value={form.discount}
                  onChange={e => set('discount', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0" />
              </div>
            </div>
            {form.totalAmount && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex flex-wrap gap-6 text-sm font-semibold">
                  <span>Total: <strong className="text-gray-900">₹{Number(form.totalAmount).toLocaleString('en-IN')}</strong></span>
                  <span>Paid: <strong className="text-green-700">₹{Number(form.paidAmount || 0).toLocaleString('en-IN')}</strong></span>
                  <span>Discount: <strong className="text-orange-600">₹{Number(form.discount || 0).toLocaleString('en-IN')}</strong></span>
                  <span className={due > 0 ? 'text-red-600' : 'text-green-700'}>
                    Balance Due: <strong>₹{Math.max(0, due).toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Driver & Vehicle Details (optional) */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🔧 Driver & Vehicle <span className="text-gray-400 text-sm font-normal">(optional)</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Driver Name</label>
                <input type="text" value={form.driverName} onChange={e => set('driverName', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Driver name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Driver Phone</label>
                <input type="tel" value={form.driverPhone} onChange={e => set('driverPhone', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Driver phone" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Make</label>
                <input type="text" value={form.vehicleMake} onChange={e => set('vehicleMake', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Maruti" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Model</label>
                <input type="text" value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Swift Dzire" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Plate Number</label>
                <input type="text" value={form.vehiclePlate} onChange={e => set('vehiclePlate', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. BR 01 AB 1234" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
                <input type="text" value={form.vehicleColor} onChange={e => set('vehicleColor', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. White" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📝 Additional Notes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Special Requests</label>
                <textarea rows="3" value={form.specialRequests} onChange={e => set('specialRequests', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Any special requirements from customer..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Notes</label>
                <textarea rows="3" value={form.notes} onChange={e => set('notes', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Internal notes for admin team..." />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
            {submitting ? (
              <><svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Creating Booking...</>
            ) : (
              <><span>📋</span> Create Offline Booking & Get WhatsApp Message</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminOfflineBooking;
