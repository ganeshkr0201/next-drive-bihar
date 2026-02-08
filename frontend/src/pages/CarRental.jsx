import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthRequiredMessage from '../components/AuthRequiredMessage/AuthRequiredMessage';
import bookingService from '../services/bookingService';
import carService from '../services/carService';

const CarRental = () => {
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  
  // Booking type tabs
  const [activeBookingType, setActiveBookingType] = useState('one-way');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCars, setLoadingCars] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Available cars from database
  const [availableCars, setAvailableCars] = useState([]);
  const [selectedCarData, setSelectedCarData] = useState(null);

  // Fetch available cars from database
  useEffect(() => {
    const fetchCars = async () => {
      setLoadingCars(true);
      try {
        const cars = await carService.getAvailableCars();
        setAvailableCars(cars);
      } catch (error) {
        console.error('Error fetching cars:', error);
        showError('Failed to load available cars');
      } finally {
        setLoadingCars(false);
      }
    };

    fetchCars();
  }, []);

  // Form state for different booking types
  const [bookingForm, setBookingForm] = useState({
    // Common fields
    sourceCity: '',
    destinationCity: '',
    selectedCar: '',
    pickupDate: '',
    pickupTime: '09:00',
    
    // Round trip specific
    dropDate: '',
    dropTime: '18:00',
    
    // Contact info
    contactNumber: '',
    emergencyContact: '',
    specialRequests: '',
    
    // Calculated fields
    distance: 0,
    estimatedTime: '',
    estimatedCost: 0,
    estimatedHours: 0
  });

  // City suggestions from Ola Maps
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  // Booking type tabs configuration
  const bookingTypes = [
    { id: 'one-way', label: 'One Way', icon: '→' },
    { id: 'round-trip', label: 'Round Trip', icon: '↔' },
    { id: 'outstation', label: 'Outstation', icon: '🏔️' },
    { id: 'marriage', label: 'Marriage Booking', icon: '💒' },
    { id: 'monthly', label: 'Monthly Subscription', icon: '📅' }
  ];

  // Ola Maps API integration
  const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_API_KEY || '';

  // Fetch city suggestions from Ola Maps
  const fetchCitySuggestions = async (query, type) => {
    if (query.length < 3) {
      if (type === 'source') setSourceSuggestions([]);
      else setDestinationSuggestions([]);
      return;
    }

    try {
      // Ola Maps Autocomplete API - Correct endpoint
      const response = await fetch(
        `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&location=25.5941,85.1376&api_key=${OLA_MAPS_API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.predictions || [];
        
        if (type === 'source') {
          setSourceSuggestions(suggestions);
        } else {
          setDestinationSuggestions(suggestions);
        }
      } else {
        console.error('Ola Maps Autocomplete error:', response.status);
      }
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
    }
  };

  // Calculate distance and time using Ola Maps
  const calculateDistanceAndTime = async (source, destination) => {
    if (!source || !destination) return;

    try {
      // First, geocode the addresses to get coordinates
      const sourceCoords = await geocodeAddress(source);
      const destCoords = await geocodeAddress(destination);
      
      if (!sourceCoords || !destCoords) {
        console.log('Could not geocode addresses, using estimation');
        useSimpleEstimation(source, destination);
        return;
      }

      // Ola Maps Directions API - Using coordinates
      const response = await fetch(
        `https://api.olamaps.io/routing/v1/directions?origin=${sourceCoords.lat},${sourceCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&mode=driving&api_key=${OLA_MAPS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract distance and duration from response
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceMeters = route.legs[0]?.distance || 0;
          const durationSeconds = route.legs[0]?.duration || 0;
          
          if (distanceMeters > 0) {
            const distanceKm = (distanceMeters / 1000).toFixed(2);
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const timeString = `${hours}h ${minutes}m`;
            const totalHours = parseFloat((durationSeconds / 3600).toFixed(2));
            
            // Calculate estimated cost
            let estimatedCost = 0;
            if (selectedCarData && selectedCarData.pricing) {
              estimatedCost = calculatePrice(distanceKm, totalHours, selectedCarData, activeBookingType);
            }
            
            setBookingForm(prev => ({
              ...prev,
              distance: distanceKm,
              estimatedTime: timeString,
              estimatedHours: totalHours,
              estimatedCost: estimatedCost
            }));
            return;
          }
        }
      }
      
      // If API call fails, use simple estimation
      console.log('Ola Maps API failed, using estimation');
      useSimpleEstimation(source, destination);
      
    } catch (error) {
      console.error('Error calculating distance:', error);
      useSimpleEstimation(source, destination);
    }
  };

  // Geocode address to coordinates using Ola Maps
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(address)}&api_key=${OLA_MAPS_API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.geocodingResults && data.geocodingResults.length > 0) {
          const location = data.geocodingResults[0].geometry.location;
          return { lat: location.lat, lng: location.lng };
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  // Use simple estimation as fallback
  const useSimpleEstimation = (source, destination) => {
    const estimatedDistance = estimateDistanceSimple(source, destination);
    
    if (estimatedDistance > 0) {
      const estimatedHours = estimatedDistance / 50; // Assume 50 km/h average
      const hours = Math.floor(estimatedHours);
      const minutes = Math.floor((estimatedHours % 1) * 60);
      const timeString = `${hours}h ${minutes}m`;
      
      let estimatedCost = 0;
      if (selectedCarData && selectedCarData.pricing) {
        estimatedCost = calculatePrice(estimatedDistance, estimatedHours, selectedCarData, activeBookingType);
      }
      
      setBookingForm(prev => ({
        ...prev,
        distance: estimatedDistance,
        estimatedTime: timeString,
        estimatedHours: estimatedHours,
        estimatedCost: estimatedCost
      }));
    } else {
      // Set to be confirmed by admin
      setBookingForm(prev => ({
        ...prev,
        distance: 0,
        estimatedTime: 'To be confirmed',
        estimatedHours: 0,
        estimatedCost: 0
      }));
    }
  };

  // Simple distance estimation for common Bihar routes
  const estimateDistanceSimple = (source, destination) => {
    const routes = {
      'patna-gaya': 100,
      'patna-bihar sharif': 70,
      'patna-muzaffarpur': 70,
      'patna-darbhanga': 140,
      'patna-bhagalpur': 220,
      'gaya-bodhgaya': 15,
      'patna-nalanda': 90,
      'patna-rajgir': 100,
      'patna-vaishali': 55,
      'patna-hajipur': 10,
      'patna-arrah': 55,
      'patna-begusarai': 125,
      'patna-katihar': 280,
      'patna-munger': 180,
      'patna-chhapra': 70,
      'patna-purnia': 290,
      'patna-saharsa': 200,
      'patna-sasaram': 110,
      'patna-motihari': 145,
      'patna-siwan': 110
    };
    
    const sourceCity = source.toLowerCase().split(',')[0].trim();
    const destCity = destination.toLowerCase().split(',')[0].trim();
    
    // Try direct route
    const routeKey1 = `${sourceCity}-${destCity}`;
    const routeKey2 = `${destCity}-${sourceCity}`;
    
    if (routes[routeKey1]) return routes[routeKey1];
    if (routes[routeKey2]) return routes[routeKey2];
    
    // Check if either city is Patna (hub)
    if (sourceCity.includes('patna') || destCity.includes('patna')) {
      return 80; // Average distance from Patna
    }
    
    return 0; // Unknown route
  };

  // Calculate price based on car pricing and booking type
  const calculatePrice = (distanceKm, hours, car, bookingType) => {
    if (!car || !car.pricing) return 0;

    let cost = 0;
    const pricing = car.pricing;

    switch (bookingType) {
      case 'one-way':
        cost = (distanceKm * pricing.oneWay.perKm) + pricing.oneWay.extraAmount;
        break;
      case 'round-trip':
        cost = (distanceKm * 2 * pricing.roundTrip.perKm) + pricing.roundTrip.extraAmount;
        break;
      case 'outstation':
        cost = (distanceKm * pricing.outstation.perKm) + pricing.outstation.extraAmount;
        break;
      case 'marriage':
        const marriageHours = Math.max(hours, 8); // Minimum 8 hours for marriage
        cost = (marriageHours * pricing.marriage.perHour) + pricing.marriage.extraAmount;
        break;
      case 'monthly':
        cost = pricing.monthly.price + pricing.monthly.extraAmount;
        break;
      default:
        cost = 0;
    }

    return cost.toFixed(2);
  };

  // Handle car selection
  const handleCarSelection = (carId) => {
    const car = availableCars.find(c => c._id === carId);
    setSelectedCarData(car);
    setBookingForm(prev => ({ ...prev, selectedCar: carId }));

    // Recalculate price if distance is already calculated
    if (bookingForm.distance > 0) {
      const newCost = calculatePrice(bookingForm.distance, bookingForm.estimatedHours, car, activeBookingType);
      setBookingForm(prev => ({ ...prev, estimatedCost: newCost }));
    }
  };

  // Handle booking type change
  const handleBookingTypeChange = (newType) => {
    setActiveBookingType(newType);
    
    // Recalculate price if car and distance are selected
    if (selectedCarData && bookingForm.distance > 0) {
      const newCost = calculatePrice(bookingForm.distance, bookingForm.estimatedHours, selectedCarData, newType);
      setBookingForm(prev => ({ ...prev, estimatedCost: newCost }));
    }
  };

  // Handle source city input
  const handleSourceCityChange = (value) => {
    setBookingForm(prev => ({ ...prev, sourceCity: value }));
    fetchCitySuggestions(value, 'source');
    setShowSourceSuggestions(true);
  };

  // Handle destination city input
  const handleDestinationCityChange = (value) => {
    setBookingForm(prev => ({ ...prev, destinationCity: value }));
    fetchCitySuggestions(value, 'destination');
    setShowDestinationSuggestions(true);
  };

  // Select source city from suggestions
  const selectSourceCity = (city) => {
    setBookingForm(prev => ({ ...prev, sourceCity: city.description }));
    setShowSourceSuggestions(false);
    if (bookingForm.destinationCity) {
      calculateDistanceAndTime(city.description, bookingForm.destinationCity);
    }
  };

  // Select destination city from suggestions
  const selectDestinationCity = (city) => {
    setBookingForm(prev => ({ ...prev, destinationCity: city.description }));
    setShowDestinationSuggestions(false);
    if (bookingForm.sourceCity) {
      calculateDistanceAndTime(bookingForm.sourceCity, city.description);
    }
  };

  // Handle form submission - show confirmation modal
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    console.log('🚗 Form submission started');
    console.log('📊 Booking form data:', bookingForm);
    console.log('🚙 Selected car:', selectedCarData);
    console.log('📍 Booking type:', activeBookingType);

    if (!isAuthenticated) {
      console.log('❌ User not authenticated');
      navigate('/login');
      return;
    }

    // Validation
    if (!bookingForm.sourceCity || !bookingForm.destinationCity || !bookingForm.selectedCar || 
        !bookingForm.pickupDate || !bookingForm.contactNumber) {
      console.log('❌ Missing required fields');
      showError('Please fill in all required fields');
      return;
    }

    // Validate contact number
    if (!/^\d{10}$/.test(bookingForm.contactNumber)) {
      console.log('❌ Invalid contact number:', bookingForm.contactNumber);
      showError('Contact number must be exactly 10 digits');
      return;
    }

    if (!selectedCarData) {
      console.log('❌ No car selected');
      showError('Please select a valid car');
      return;
    }

    // For monthly bookings, distance is not required
    // For other bookings, if distance is 0, calculate a default estimate
    if (activeBookingType !== 'monthly' && (!bookingForm.distance || bookingForm.distance === 0)) {
      console.log('⚠️ Distance not calculated, using default estimate');
      // Set a default estimated cost based on car type
      const defaultCost = selectedCarData.pricing[
        activeBookingType === 'one-way' ? 'oneWay' : 
        activeBookingType === 'round-trip' ? 'roundTrip' : 
        activeBookingType === 'outstation' ? 'outstation' : 
        activeBookingType === 'marriage' ? 'marriage' : 'monthly'
      ];
      
      // Estimate 50km for one-way, 100km for round-trip, etc.
      const estimatedDistance = activeBookingType === 'round-trip' ? 100 : 50;
      const estimatedCost = activeBookingType === 'marriage' 
        ? defaultCost.perHour * 8 + defaultCost.extraAmount
        : defaultCost.perKm * estimatedDistance + defaultCost.extraAmount;
      
      setBookingForm(prev => ({
        ...prev,
        distance: estimatedDistance,
        estimatedTime: 'To be confirmed',
        estimatedCost: estimatedCost.toFixed(2),
        estimatedHours: 2
      }));
    }

    console.log('✅ All validations passed, opening modal');
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  // Confirm and submit booking
  const confirmBooking = async () => {
    setIsLoading(true);
    try {
      const bookingData = {
        bookingType: activeBookingType,
        carId: bookingForm.selectedCar,
        carName: selectedCarData.name,
        carType: selectedCarData.carType,
        sourceCity: bookingForm.sourceCity,
        destinationCity: bookingForm.destinationCity,
        pickupDate: bookingForm.pickupDate,
        pickupTime: bookingForm.pickupTime,
        dropDate: bookingForm.dropDate || bookingForm.pickupDate,
        dropTime: bookingForm.dropTime || '18:00',
        pickupLocation: bookingForm.sourceCity,
        dropLocation: bookingForm.destinationCity,
        contactNumber: bookingForm.contactNumber,
        emergencyContact: bookingForm.emergencyContact,
        specialRequests: bookingForm.specialRequests,
        distance: bookingForm.distance,
        estimatedTime: bookingForm.estimatedTime,
        estimatedCost: bookingForm.estimatedCost,
        estimatedHours: bookingForm.estimatedHours,
        tripType: activeBookingType,
        numberOfPassengers: selectedCarData.numberOfSeats || 4,
        pricingDetails: {
          perKm: selectedCarData.pricing[activeBookingType === 'one-way' ? 'oneWay' : 
                 activeBookingType === 'round-trip' ? 'roundTrip' : 
                 activeBookingType === 'outstation' ? 'outstation' : 
                 activeBookingType === 'marriage' ? 'marriage' : 'monthly']
        }
      };

      console.log('📤 Submitting car booking:', bookingData);
      const response = await bookingService.createCarBooking(bookingData);
      console.log('✅ Booking created successfully:', response);
      
      showSuccess('Car booking request submitted successfully! Your booking is pending admin confirmation.');
      
      // Close modal and reset form
      setShowConfirmModal(false);
      setBookingForm({
        sourceCity: '',
        destinationCity: '',
        selectedCar: '',
        pickupDate: '',
        pickupTime: '09:00',
        dropDate: '',
        dropTime: '18:00',
        contactNumber: '',
        emergencyContact: '',
        specialRequests: '',
        distance: 0,
        estimatedTime: '',
        estimatedCost: 0,
        estimatedHours: 0
      });
      setSelectedCarData(null);
      
      // Optional: Navigate to My Bookings page after 2 seconds
      setTimeout(() => {
        navigate('/my-bookings');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Booking creation error:', error);
      showError(error.message || 'Failed to create car booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Car Rental
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Book your ride with ease. Choose from multiple booking options and get instant distance calculations.
          </p>
        </div>

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <div className="mb-8">
            <AuthRequiredMessage 
              title="Login Required for Booking"
              message="Please login to book cars and track your reservations."
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Booking Type Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex overflow-x-auto scrollbar-hide">
              {bookingTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleBookingTypeChange(type.id)}
                  className={`flex-1 min-w-[140px] px-4 py-4 text-center font-medium transition-all border-b-4 ${
                    activeBookingType === type.id
                      ? 'border-blue-600 bg-white text-blue-600'
                      : 'border-transparent text-gray-600 hover:bg-white/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-semibold">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Location Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source City */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Source City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter source city"
                    value={bookingForm.sourceCity}
                    onChange={(e) => handleSourceCityChange(e.target.value)}
                    onFocus={() => setShowSourceSuggestions(true)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {showSourceSuggestions && sourceSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {sourceSuggestions.map((city, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectSourceCity(city)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="text-sm text-gray-900">{city.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination City */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Destination City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter destination city"
                    value={bookingForm.destinationCity}
                    onChange={(e) => handleDestinationCityChange(e.target.value)}
                    onFocus={() => setShowDestinationSuggestions(true)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {destinationSuggestions.map((city, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectDestinationCity(city)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="text-sm text-gray-900">{city.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Distance and Time Display */}
              {bookingForm.distance > 0 ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{bookingForm.distance} km</div>
                      <div className="text-xs text-gray-600">Distance</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{bookingForm.estimatedTime}</div>
                      <div className="text-xs text-gray-600">Est. Time</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">₹{bookingForm.estimatedCost}</div>
                      <div className="text-xs text-gray-600">Est. Cost</div>
                    </div>
                  </div>
                </div>
              ) : bookingForm.sourceCity && bookingForm.destinationCity && activeBookingType !== 'monthly' ? (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800">
                      Distance and cost will be calculated and confirmed by our team after booking.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Car Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Select Car *
              </h3>

              {loadingCars ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : availableCars.length === 0 ? (
                <div className="text-center py-8 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <div className="text-4xl mb-2">🚗</div>
                  <p className="text-gray-700 font-medium">No cars available at the moment</p>
                  <p className="text-sm text-gray-600 mt-1">Please check back later or contact support</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableCars.map((car) => (
                    <button
                      key={car._id}
                      type="button"
                      onClick={() => handleCarSelection(car._id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        bookingForm.selectedCar === car._id
                          ? 'border-blue-600 bg-blue-50 shadow-lg'
                          : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-4xl mb-2">🚗</div>
                      <div className="font-semibold text-gray-900">{car.name}</div>
                      <div className="text-xs text-gray-600">{car.numberOfSeats} Seater</div>
                      <div className="text-xs text-gray-500 mt-1">{car.carType}</div>
                      {car.features && car.features.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {car.features.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date and Time Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Pickup Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingForm.pickupDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, pickupDate: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pickup Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingForm.pickupTime}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, pickupTime: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Round Trip - Drop Date */}
            {activeBookingType === 'round-trip' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Return Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Return Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={bookingForm.pickupDate || new Date().toISOString().split('T')[0]}
                      value={bookingForm.dropDate}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, dropDate: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Return Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={bookingForm.dropTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, dropTime: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile"
                    value={bookingForm.contactNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setBookingForm(prev => ({ ...prev, contactNumber: value }));
                      }
                    }}
                    maxLength="10"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter WhatsApp number"
                    value={bookingForm.emergencyContact}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setBookingForm(prev => ({ ...prev, emergencyContact: value }));
                      }
                    }}
                    maxLength="10"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Special Requests
              </h3>

              <textarea
                rows={3}
                placeholder="Any special requirements or requests..."
                value={bookingForm.specialRequests}
                onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setBookingForm({
                    sourceCity: '',
                    destinationCity: '',
                    selectedCar: '',
                    pickupDate: '',
                    pickupTime: '09:00',
                    dropDate: '',
                    dropTime: '18:00',
                    contactNumber: '',
                    emergencyContact: '',
                    specialRequests: '',
                    distance: 0,
                    estimatedTime: '',
                    estimatedCost: 0
                  });
                }}
                className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={isLoading || !isAuthenticated}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : !isAuthenticated ? (
                  'Login to Book'
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm Booking
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Safe & Reliable</h3>
            <p className="text-gray-600 text-sm">Well-maintained vehicles with professional drivers</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">24/7 Support</h3>
            <p className="text-gray-600 text-sm">Round-the-clock customer support and assistance</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Best Prices</h3>
            <p className="text-gray-600 text-sm">Competitive rates with transparent pricing</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Confirm Your Booking</h3>
                    <p className="text-blue-100 text-sm">Please review your booking details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Trip Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Trip Summary
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-3xl font-bold text-blue-600">
                      {bookingForm.distance > 0 ? `${bookingForm.distance} km` : 'TBD'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Total Distance</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-3xl font-bold text-green-600">
                      {bookingForm.estimatedTime || 'TBD'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Estimated Time</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-3xl font-bold text-purple-600">
                      {bookingForm.estimatedCost > 0 ? `₹${bookingForm.estimatedCost}` : 'TBD'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Estimated Cost</div>
                  </div>
                </div>
              </div>

              {/* Car Details */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Car Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Car:</span>
                    <span className="font-semibold text-gray-900">{selectedCarData?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold text-gray-900">{selectedCarData?.carType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Seats:</span>
                    <span className="font-semibold text-gray-900">{selectedCarData?.numberOfSeats} Seater</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Booking Type:</span>
                    <span className="font-semibold text-gray-900 capitalize">{activeBookingType.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Journey Details */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Journey Details
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Pickup Location</div>
                      <div className="font-semibold text-gray-900">{bookingForm.sourceCity}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(bookingForm.pickupDate).toLocaleDateString('en-IN', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })} at {bookingForm.pickupTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Drop Location</div>
                      <div className="font-semibold text-gray-900">{bookingForm.destinationCity}</div>
                      {activeBookingType === 'round-trip' && bookingForm.dropDate && (
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(bookingForm.dropDate).toLocaleDateString('en-IN', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })} at {bookingForm.dropTime}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-gray-600">Phone Number</div>
                    <div className="font-semibold text-gray-900">+91 {bookingForm.contactNumber}</div>
                  </div>
                  {bookingForm.emergencyContact && (
                    <div>
                      <div className="text-sm text-gray-600">WhatsApp Number</div>
                      <div className="font-semibold text-gray-900">+91 {bookingForm.emergencyContact}</div>
                    </div>
                  )}
                </div>
                {bookingForm.specialRequests && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">Special Requests</div>
                    <div className="text-gray-900 mt-1">{bookingForm.specialRequests}</div>
                  </div>
                )}
              </div>

              {/* Important Note */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h5 className="font-semibold text-yellow-900 mb-1">Important Note</h5>
                    <p className="text-sm text-yellow-800">
                      Your booking will be sent to the admin for confirmation. You will receive a notification once your booking is approved. 
                      {bookingForm.distance > 0 
                        ? ' The estimated cost is subject to change based on actual distance and time.'
                        : ' The admin will calculate the exact distance and cost, and confirm the final amount with you.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={confirmBooking}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Confirming...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm Booking
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarRental;
