import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import tourService from '../services/tourService';
import bookingService from '../services/bookingService';
import envConfig from '../config/env';

const TourDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const [tourPackage, setTourPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    numberOfTravelers: 1,
    travelDate: '',
    travelTime: '09:00',
    specialRequests: '',
    contactNumber: '',
    emergencyContact: '',
    pickupLocation: '',
    dropLocation: ''
  });

  useEffect(() => {
    loadTourPackage();
  }, [id]);

  const loadTourPackage = async () => {
    setIsLoading(true);
    try {
      const pkg = await tourService.getTourPackage(id);
      setTourPackage(pkg);
    } catch (error) {
      showError('Tour package not found');
      navigate('/tour-packages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!bookingForm.travelDate || !bookingForm.contactNumber) {
      showError('Please fill in all required fields');
      return;
    }

    // Check if pickup location is required and provided
    if (tourPackage.pickupLocations && tourPackage.pickupLocations.length > 0 && !bookingForm.pickupLocation) {
      showError('Please select a pickup location');
      return;
    }

    // Validate travel date is in the future
    const travelDateTime = new Date(`${bookingForm.travelDate}T${bookingForm.travelTime}`);
    const now = new Date();
    if (travelDateTime <= now) {
      showError('Travel date must be in the future');
      return;
    }

    // Validate contact number
    if (!/^\d{10}$/.test(bookingForm.contactNumber)) {
      showError('Contact number must be exactly 10 digits');
      return;
    }

    setIsLoading(true);
    try {
      const totalAmount = tourPackage.pricing.basePrice * bookingForm.numberOfTravelers;
      
      const bookingData = {
        tourPackage: tourPackage._id,
        numberOfTravelers: parseInt(bookingForm.numberOfTravelers),
        travelDate: bookingForm.travelDate,
        travelTime: bookingForm.travelTime,
        totalAmount,
        specialRequests: bookingForm.specialRequests,
        contactNumber: bookingForm.contactNumber,
        emergencyContact: bookingForm.emergencyContact,
        pickupLocation: bookingForm.pickupLocation,
        dropLocation: bookingForm.dropLocation
      };

      await bookingService.createTourBooking(bookingData);
      showSuccess('Booking request submitted successfully! Your booking is pending admin confirmation. You will receive an update soon.');
      setShowBookingForm(false);
      setBookingForm({
        numberOfTravelers: 1,
        travelDate: '',
        travelTime: '09:00',
        specialRequests: '',
        contactNumber: '',
        emergencyContact: '',
        pickupLocation: '',
        dropLocation: ''
      });
    } catch (error) {
      showError(error.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tourPackage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tour Package Not Found</h2>
          <button
            onClick={() => navigate('/tour-packages')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Tour Packages
          </button>
        </div>
      </div>
    );
  }

  const images = tourPackage.images?.gallery || [];
  const mainImage = images[selectedImage] || { url: tourPackage.images?.featured || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Tour Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{tourPackage.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{tourPackage.duration.days} Days / {tourPackage.duration.nights} Nights</span>
            </div>
            <div className="flex items-center">
              <img src="/tour_logo.svg" alt="Location" className="w-5 h-5 mr-2" />
              <span className="font-medium">{tourPackage.destinations?.[0]?.name || 'Bihar'}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">Max {tourPackage.maxGroupSize} people</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content - Left Side (60%) */}
          <div className="lg:w-3/5 order-1 lg:order-1 space-y-8">
            {/* Image Gallery */}
            {images.length > 1 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Gallery</h2>
                  <button
                    onClick={() => setShowGallery(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All ({images.length})
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className={`relative h-20 rounded-lg overflow-hidden cursor-pointer ${
                        selectedImage === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={image.url?.startsWith('http') ? image.url : `${import.meta.env.VITE_API_URL}/${image.url}`}
                        alt={image.alt || tourPackage.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Tour</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                {tourPackage.description}
              </p>

              {/* Highlights */}
              {tourPackage.highlights && tourPackage.highlights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Tour Highlights</h3>
                  <p className="text-blue-600 text-base leading-relaxed">
                    {Array.isArray(tourPackage.highlights) 
                      ? tourPackage.highlights.join(', ')
                      : typeof tourPackage.highlights === 'string' 
                        ? tourPackage.highlights.replace(/[\[\]"]/g, '').split(',').map(h => h.trim()).join(', ')
                        : tourPackage.highlights
                    }
                  </p>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tourPackage.inclusions && tourPackage.inclusions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Inclusions</h3>
                    <ul className="space-y-2">
                      {tourPackage.inclusions.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tourPackage.exclusions && tourPackage.exclusions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Exclusions</h3>
                    <ul className="space-y-2">
                      {tourPackage.exclusions.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-4 h-4 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Pickup & Drop Locations */}
              {((tourPackage.pickupLocations && tourPackage.pickupLocations.length > 0) || 
                (tourPackage.dropLocations && tourPackage.dropLocations.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {tourPackage.pickupLocations && tourPackage.pickupLocations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Pickup Locations</h3>
                      <ul className="space-y-2">
                        {tourPackage.pickupLocations.map((location, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-gray-700 text-sm">{location}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tourPackage.dropLocations && tourPackage.dropLocations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Drop Locations</h3>
                      <ul className="space-y-2">
                        {tourPackage.dropLocations.map((location, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-4 h-4 text-orange-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-gray-700 text-sm">{location}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Booking Form - Right Side (40%) */}
          <div className="lg:w-2/5 order-2 lg:order-2">
            {showBookingForm ? (
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 sticky top-4 overflow-hidden">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold mb-2 flex items-center">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Book Your Adventure
                      </h3>
                      <p className="text-blue-100 text-sm font-medium">{tourPackage.title}</p>
                      <p className="text-blue-200 text-xs mt-1">
                        {tourPackage.duration.days} Days • {tourPackage.duration.nights} Nights
                      </p>
                    </div>
                    <button
                      onClick={() => setShowBookingForm(false)}
                      className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">
                  {/* Essential Details Section */}
                  <div className="space-y-4">
                    <div className="flex items-center mb-3">
                      <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Booking Details</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Number of Travelers */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Travelers *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            value={bookingForm.numberOfTravelers}
                            onChange={(e) => {
                              let value = e.target.value;
                              // Allow only numbers
                              value = value.replace(/[^\d]/g, '');
                              // Remove leading zeros
                              value = value.replace(/^0+(?=\d)/, '');
                              const numValue = parseInt(value) || 1;
                              if (numValue >= 1 && numValue <= tourPackage.maxGroupSize) {
                                setBookingForm(prev => ({ ...prev, numberOfTravelers: numValue }));
                              } else if (value === '') {
                                setBookingForm(prev => ({ ...prev, numberOfTravelers: 1 }));
                              }
                            }}
                            onBlur={(e) => {
                              const numValue = parseInt(e.target.value) || 1;
                              setBookingForm(prev => ({ 
                                ...prev, 
                                numberOfTravelers: Math.max(1, Math.min(tourPackage.maxGroupSize, numValue))
                              }));
                            }}
                            className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium"
                            placeholder="1"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Travel Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date *
                        </label>
                        <input
                          type="date"
                          required
                          min={today}
                          value={bookingForm.travelDate}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, travelDate: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center mb-3">
                      <div className="w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Contact Details</h4>
                    </div>
                    
                    {/* Checkbox to use same number - Above inputs */}
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                      <input
                        type="checkbox"
                        id="sameAsPhoneTour"
                        checked={sameAsPhone}
                        onChange={(e) => {
                          setSameAsPhone(e.target.checked);
                          if (e.target.checked) {
                            setBookingForm(prev => ({ ...prev, emergencyContact: prev.contactNumber }));
                          }
                        }}
                        className="w-3.5 h-3.5 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="sameAsPhoneTour" className="text-xs text-gray-700 cursor-pointer select-none font-medium">
                        WhatsApp number is same as phone number
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            placeholder="10-digit mobile"
                            value={bookingForm.contactNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= envConfig.phoneNumberLength) {
                                setBookingForm(prev => ({ ...prev, contactNumber: value }));
                                // If checkbox is checked, also update WhatsApp number
                                if (sameAsPhone) {
                                  setBookingForm(prev => ({ ...prev, emergencyContact: value }));
                                }
                              }
                            }}
                            maxLength={envConfig.phoneNumberLength.toString()}
                            className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium text-base"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          WhatsApp Number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            placeholder="WhatsApp number"
                            value={bookingForm.emergencyContact}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= envConfig.phoneNumberLength) {
                                setBookingForm(prev => ({ ...prev, emergencyContact: value }));
                                // Uncheck the checkbox if user manually edits WhatsApp number
                                if (sameAsPhone && value !== bookingForm.contactNumber) {
                                  setSameAsPhone(false);
                                }
                              }
                            }}
                            maxLength={envConfig.phoneNumberLength.toString()}
                            disabled={sameAsPhone}
                            className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium text-base disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Preferences Section - Simplified with Animation */}
                  {((tourPackage.pickupLocations && tourPackage.pickupLocations.length > 0) || 
                    (tourPackage.dropLocations && tourPackage.dropLocations.length > 0)) && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center mb-3">
                        <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 transform transition-transform duration-200 hover:scale-110">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Pickup & Drop</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {tourPackage.pickupLocations && tourPackage.pickupLocations.length > 0 && (
                          <div className="transform transition-all duration-300 hover:scale-[1.02]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pickup Location *
                            </label>
                            <div className="relative">
                              <select
                                required
                                value={bookingForm.pickupLocation}
                                onChange={(e) => setBookingForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 font-medium appearance-none hover:border-gray-300"
                              >
                                <option value="">Select pickup</option>
                                {tourPackage.pickupLocations.map((location, index) => (
                                  <option key={index} value={location}>{location}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}

                        {tourPackage.dropLocations && tourPackage.dropLocations.length > 0 && (
                          <div className="transform transition-all duration-300 hover:scale-[1.02]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Drop Location
                            </label>
                            <div className="relative">
                              <select
                                value={bookingForm.dropLocation}
                                onChange={(e) => setBookingForm(prev => ({ ...prev, dropLocation: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 font-medium appearance-none hover:border-gray-300"
                              >
                                <option value="">Select drop</option>
                                {tourPackage.dropLocations.map((location, index) => (
                                  <option key={index} value={location}>{location}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Special Requests - Simplified */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any special requirements..."
                      value={bookingForm.specialRequests}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all resize-none text-gray-900"
                    />
                  </div>

                  {/* Booking Summary - Compact */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Booking Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Price per person:</span>
                        <span className="text-lg font-bold text-gray-900">₹{tourPackage.pricing.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Travelers:</span>
                        <span className="text-lg font-bold text-gray-900">{bookingForm.numberOfTravelers}</span>
                      </div>
                      <div className="border-t-2 border-blue-300 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900">Total:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            ₹{(tourPackage.pricing.basePrice * parseInt(bookingForm.numberOfTravelers || 1)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-900 transition-all font-bold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Confirm Booking
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="w-full bg-gray-100 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Terms - Compact */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      By booking, you agree to our{' '}
                      <a href="/terms" className="text-blue-600 hover:text-blue-800 underline font-medium">Terms</a>
                      {' '}and{' '}
                      <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline font-medium">Privacy Policy</a>
                    </p>
                  </div>
                </form>
              </div>
            ) : (
              /* Booking Sidebar */
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-gray-900">₹{tourPackage.pricing.basePrice.toLocaleString()}</span>
                    {tourPackage.pricing.originalPrice > tourPackage.pricing.basePrice && (
                      <span className="text-lg text-gray-500 line-through">₹{tourPackage.pricing.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-gray-600">per person</p>
                  {tourPackage.pricing.originalPrice > tourPackage.pricing.basePrice && (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium inline-block mt-2">
                      Save ₹{(tourPackage.pricing.originalPrice - tourPackage.pricing.basePrice).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Quick Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{tourPackage.duration.days}D/{tourPackage.duration.nights}N</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Group Size:</span>
                    <span className="font-medium">Max {tourPackage.maxGroupSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium">{tourPackage.difficulty}</span>
                  </div>
                </div>

                {/* Book Now Button */}
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 mb-4"
                >
                  Book This Tour
                </button>

                {/* Contact Info */}
                <div className="text-center text-sm text-gray-600">
                  <p>Need help? Call us at</p>
                  <p className="font-semibold text-blue-600">+91 12345 67890</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Gallery ({images.length} photos)</h3>
              <button
                onClick={() => setShowGallery(false)}
                className="text-white hover:text-gray-300"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                  <img
                    src={image.url?.startsWith('http') ? image.url : `${import.meta.env.VITE_API_URL}/${image.url}`}
                    alt={image.alt || tourPackage.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                    onClick={() => setSelectedImage(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourDetail;