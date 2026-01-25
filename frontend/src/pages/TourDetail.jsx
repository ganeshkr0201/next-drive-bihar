import { useState, useEffect } from 'react';
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
  
  const [tourPackage, setTourPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    numberOfTravelers: 1,
    travelDate: '',
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

    if (!bookingForm.travelDate || !bookingForm.contactNumber || !bookingForm.pickupLocation) {
      showError('Please fill in all required fields');
      return;
    }

    // Validate travel date is in the future
    const travelDate = new Date(bookingForm.travelDate);
    if (travelDate <= new Date()) {
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
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 sticky top-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold mb-1">Book Your Adventure</h3>
                      <p className="text-blue-100 text-sm">{tourPackage.title}</p>
                    </div>
                    <button
                      onClick={() => setShowBookingForm(false)}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="p-4 space-y-4">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <div className="bg-blue-100 p-1 rounded mr-2">
                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      Personal Info
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Travelers and Travel Date in same row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Travelers *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={tourPackage.maxGroupSize}
                            required
                            value={bookingForm.numberOfTravelers}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, numberOfTravelers: e.target.value }))}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                            placeholder="Number"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Travel Date *
                          </label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={bookingForm.travelDate}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, travelDate: e.target.value }))}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <div className="bg-green-100 p-1 rounded mr-2">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      Contact Details
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Phone Number and WhatsApp Number in same row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="Enter 10-digit mobile number"
                            value={bookingForm.contactNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                              if (value.length <= envConfig.phoneNumberLength) {
                                setBookingForm(prev => ({ ...prev, contactNumber: value }));
                              }
                            }}
                            maxLength={envConfig.phoneNumberLength.toString()}
                            minLength={envConfig.phoneNumberLength.toString()}
                            pattern={`[0-9]{${envConfig.phoneNumberLength}}`}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            WhatsApp Number
                          </label>
                          <input
                            type="tel"
                            placeholder="Enter 10-digit WhatsApp number"
                            value={bookingForm.emergencyContact}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                              if (value.length <= envConfig.phoneNumberLength) {
                                setBookingForm(prev => ({ ...prev, emergencyContact: value }));
                              }
                            }}
                            maxLength={envConfig.phoneNumberLength.toString()}
                            pattern={`[0-9]{${envConfig.phoneNumberLength}}`}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Preferences */}
                  {((tourPackage.pickupLocations && tourPackage.pickupLocations.length > 0) || 
                    (tourPackage.dropLocations && tourPackage.dropLocations.length > 0)) && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="bg-purple-100 p-1 rounded mr-2">
                          <img src="/tour_logo.svg" alt="Location" className="w-3 h-3" />
                        </div>
                        Locations
                      </h4>
                      
                      <div className="space-y-3">
                        {/* Pickup and Drop Locations in same row */}
                        <div className="grid grid-cols-1 gap-3">
                          {(tourPackage.pickupLocations && tourPackage.pickupLocations.length > 0) || 
                           (tourPackage.dropLocations && tourPackage.dropLocations.length > 0) ? (
                            <div className="grid grid-cols-2 gap-3">
                              {tourPackage.pickupLocations && tourPackage.pickupLocations.length > 0 && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Pickup Location
                                  </label>
                                  <select
                                    value={bookingForm.pickupLocation}
                                    onChange={(e) => setBookingForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                  >
                                    <option value="">Select pickup</option>
                                    {tourPackage.pickupLocations.map((location, index) => (
                                      <option key={index} value={location}>{location}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {tourPackage.dropLocations && tourPackage.dropLocations.length > 0 && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Drop Location
                                  </label>
                                  <select
                                    value={bookingForm.dropLocation}
                                    onChange={(e) => setBookingForm(prev => ({ ...prev, dropLocation: e.target.value }))}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                  >
                                    <option value="">Select drop</option>
                                    {tourPackage.dropLocations.map((location, index) => (
                                      <option key={index} value={location}>{location}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Special Requests
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any special requirements..."
                      value={bookingForm.specialRequests}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm"
                    />
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price per person:</span>
                        <span className="font-medium">₹{tourPackage.pricing.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Travelers:</span>
                        <span className="font-medium">{bookingForm.numberOfTravelers}</span>
                      </div>
                      <div className="border-t border-blue-200 pt-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Total:</span>
                          <span className="text-lg font-bold text-blue-600">
                            ₹{(tourPackage.pricing.basePrice * parseInt(bookingForm.numberOfTravelers || 1)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Confirm Booking'
                      )}
                    </button>
                  </div>

                  {/* Terms */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      By booking, you agree to our{' '}
                      <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">Terms</a>
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