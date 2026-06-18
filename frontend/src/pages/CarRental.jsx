import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthRequiredMessage from '../components/AuthRequiredMessage/AuthRequiredMessage';
import bookingService from '../services/bookingService';
import carService from '../services/carService';

const CarRental = () => {
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Get booking type from URL parameter
  const urlBookingType = searchParams.get('type');
  
  // Map URL types to internal booking types
  const bookingTypeMap = {
    'oneway': 'one-way',
    'roundtrip': 'round-trip',
    'outstation': 'outstation',
    'marriage': 'marriage',
    'monthly': 'monthly'
  };
  
  // Booking type tabs
  const [activeBookingType, setActiveBookingType] = useState(
    urlBookingType && bookingTypeMap[urlBookingType] 
      ? bookingTypeMap[urlBookingType] 
      : 'one-way'
  );
  const [selectedCarCategory, setSelectedCarCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCars, setLoadingCars] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);

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
    pickupTime: '',
    numberOfPassengers: 1,
    
    // Round trip specific
    dropDate: '',
    dropTime: '',
    
    // Marriage booking specific
    numberOfCars: 1,
    selectedCars: [],
    
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

  // Fetch city suggestions from Ola Maps with Bihar filtering
  const fetchCitySuggestions = async (query, type) => {
    if (query.length < 3) {
      if (type === 'source') setSourceSuggestions([]);
      else setDestinationSuggestions([]);
      return;
    }

    try {
      
      // Ola Maps Autocomplete API
      // Using Patna as location bias and adding Bihar to search query
      const searchQuery = `${query}, Bihar`;
      const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(searchQuery)}&location=25.5941,85.1376&radius=300000&language=en&api_key=${OLA_MAPS_API_KEY}`;
      
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Request-Id': `autocomplete-${Date.now()}`
        }
      });
      
      
      if (response.ok) {
        const data = await response.json();
        
        let suggestions = data.predictions || [];
        
        // Filter to only show Bihar locations
        suggestions = suggestions.filter(suggestion => {
          const desc = suggestion.description?.toLowerCase() || '';
          const secondaryText = suggestion.structured_formatting?.secondary_text?.toLowerCase() || '';
          
          // Must contain 'bihar' in description or secondary text
          return desc.includes('bihar') || secondaryText.includes('bihar');
        });
        
        // Sort by relevance - exact matches first
        suggestions.sort((a, b) => {
          const aMain = a.structured_formatting?.main_text?.toLowerCase() || '';
          const bMain = b.structured_formatting?.main_text?.toLowerCase() || '';
          const queryLower = query.toLowerCase();
          
          const aExact = aMain === queryLower;
          const bExact = bMain === queryLower;
          
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          const aStarts = aMain.startsWith(queryLower);
          const bStarts = bMain.startsWith(queryLower);
          
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          
          return 0;
        });
        
        
        if (type === 'source') {
          setSourceSuggestions(suggestions);
        } else {
          setDestinationSuggestions(suggestions);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Autocomplete API Error:', response.status, errorText);
        
        // Set empty suggestions on error
        if (type === 'source') {
          setSourceSuggestions([]);
        } else {
          setDestinationSuggestions([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);
      
      // Set empty suggestions on error
      if (type === 'source') {
        setSourceSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
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
      useSimpleEstimation(source, destination);
      
    } catch (error) {
      console.error('Error calculating distance:', error);
      useSimpleEstimation(source, destination);
    }
  };

  // Geocode address to coordinates using Ola Maps
  const geocodeAddress = async (address) => {
    
    try {
      // Clean the address
      const cleanAddress = address.trim().replace(/\s+/g, ' ');
      
      const url = `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(cleanAddress)}&language=en&api_key=${OLA_MAPS_API_KEY}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Request-Id': `geocode-${Date.now()}`
        }
      });
      
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.geocodingResults && data.geocodingResults.length > 0) {
          const result = data.geocodingResults[0];
          const location = result.geometry?.location;
          
          if (location && location.lat && location.lng) {
            return {
              lat: location.lat,
              lng: location.lng,
              formatted_address: result.formatted_address
            };
          }
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Geocoding Error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Geocoding exception:', error);
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
        // For round trip, distance is doubled (x * 2 = 2x) as the car travels both ways
        cost = (distanceKm * 2 * pricing.roundTrip.perKm) + pricing.roundTrip.extraAmount;
        break;
      case 'outstation':
        cost = (distanceKm * pricing.outstation.perKm) + pricing.outstation.extraAmount;
        break;
      case 'marriage':
        const marriageDays = Math.max(hours / 24, 1); // Convert hours to days, minimum 1 day
        cost = (marriageDays * pricing.marriage.perDay) + pricing.marriage.extraAmount;
        break;
      case 'monthly':
        cost = pricing.monthly.price + pricing.monthly.extraAmount;
        break;
      default:
        cost = 0;
    }

    // Return rounded whole number
    return Math.round(cost);
  };

  // Calculate marriage booking price with multiple cars
  const calculateMarriagePrice = (pickupDate, dropDate, selectedCarIds) => {
    if (!pickupDate || !dropDate || !selectedCarIds || selectedCarIds.length === 0) {
      return 0;
    }

    // Calculate number of days
    const pickup = new Date(pickupDate);
    const drop = new Date(dropDate);
    const diffTime = Math.abs(drop - pickup);
    const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1); // Minimum 1 day


    // Calculate total cost for all selected cars
    let totalCost = 0;
    selectedCarIds.forEach((carId, index) => {
      if (carId) {
        const car = availableCars.find(c => c._id === carId);
        if (car && car.pricing && car.pricing.marriage) {
          const carCost = (diffDays * car.pricing.marriage.perDay) + car.pricing.marriage.extraAmount;
          totalCost += carCost;
        }
      }
    });

    return Math.round(totalCost);
  };

  // Recalculate marriage booking price when details change
  useEffect(() => {
    if (activeBookingType === 'marriage' && bookingForm.pickupDate && bookingForm.dropDate && bookingForm.selectedCars.length > 0) {
      const validCars = bookingForm.selectedCars.filter(carId => carId !== '');
      if (validCars.length > 0) {
        const newCost = calculateMarriagePrice(bookingForm.pickupDate, bookingForm.dropDate, validCars);
        setBookingForm(prev => ({ ...prev, estimatedCost: newCost }));
      }
    }
  }, [activeBookingType, bookingForm.pickupDate, bookingForm.dropDate, bookingForm.selectedCars, availableCars]);


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


    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Validation
    if (!bookingForm.sourceCity || !bookingForm.destinationCity || !bookingForm.pickupDate || !bookingForm.contactNumber) {
      showError('Please fill in all required fields');
      return;
    }

    // Marriage booking specific validation
    if (activeBookingType === 'marriage') {
      if (!bookingForm.dropDate) {
        showError('Please select return date for marriage booking');
        return;
      }
      if (!bookingForm.numberOfCars || bookingForm.numberOfCars < 1) {
        showError('Please enter number of cars required');
        return;
      }
      const validCars = bookingForm.selectedCars.filter(carId => carId !== '');
      if (validCars.length !== bookingForm.numberOfCars) {
        showError(`Please select all ${bookingForm.numberOfCars} cars`);
        return;
      }
    } else {
      // For non-marriage bookings, validate car selection
      if (!bookingForm.selectedCar) {
        showError('Please select a car');
        return;
      }
    }

    // Validate number of passengers for applicable booking types
    if ((activeBookingType === 'one-way' || activeBookingType === 'round-trip' || activeBookingType === 'outstation')) {
      if (!bookingForm.numberOfPassengers || bookingForm.numberOfPassengers < 1) {
        showError('Please enter a valid number of passengers (minimum 1)');
        return;
      }
      if (selectedCarData && bookingForm.numberOfPassengers > selectedCarData.numberOfSeats) {
        showError(`Selected vehicle has only ${selectedCarData.numberOfSeats} seats. Please select a larger vehicle or reduce passengers.`);
        return;
      }
    }

    // Validate contact number
    if (!/^\d{10}$/.test(bookingForm.contactNumber)) {
      showError('Contact number must be exactly 10 digits');
      return;
    }

    // For non-marriage bookings, validate selectedCarData
    if (activeBookingType !== 'marriage' && !selectedCarData) {
      showError('Please select a valid car');
      return;
    }

    // For monthly bookings and marriage bookings, distance is not required
    // For other bookings, if distance is 0, calculate a default estimate
    if (activeBookingType !== 'monthly' && activeBookingType !== 'marriage' && (!bookingForm.distance || bookingForm.distance === 0)) {
      // Set a default estimated cost based on car type
      const defaultCost = selectedCarData.pricing[
        activeBookingType === 'one-way' ? 'oneWay' : 
        activeBookingType === 'round-trip' ? 'roundTrip' : 
        activeBookingType === 'outstation' ? 'outstation' : 'monthly'
      ];
      
      // Estimate 50km for one-way, 100km for round-trip, etc.
      const estimatedDistance = activeBookingType === 'round-trip' ? 100 : 50;
      const estimatedCost = defaultCost.perKm * estimatedDistance + defaultCost.extraAmount;
      
      setBookingForm(prev => ({
        ...prev,
        distance: estimatedDistance,
        estimatedTime: 'To be confirmed',
        estimatedCost: Math.round(estimatedCost),
        estimatedHours: 2
      }));
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  // Confirm and submit booking
  const confirmBooking = async () => {
    setIsLoading(true);
    try {
      let bookingData;

      if (activeBookingType === 'marriage') {
        // Marriage booking with multiple cars
        const selectedCarsData = bookingForm.selectedCars
          .filter(carId => carId !== '')
          .map(carId => {
            const car = availableCars.find(c => c._id === carId);
            if (!car) {
              console.error('❌ Car not found in availableCars:', carId);
              throw new Error(`Car with ID ${carId} not found`);
            }
            return {
              carId: car._id,
              carName: car.name,
              carType: car.carType,
              pricePerDay: car.pricing.marriage.perDay
            };
          });

        bookingData = {
          bookingType: 'marriage',
          numberOfCars: bookingForm.numberOfCars,
          selectedCars: selectedCarsData,
          sourceCity: bookingForm.sourceCity,
          destinationCity: bookingForm.destinationCity,
          pickupDate: bookingForm.pickupDate,
          pickupTime: bookingForm.pickupTime,
          dropDate: bookingForm.dropDate,
          dropTime: bookingForm.dropTime,
          pickupLocation: bookingForm.sourceCity,
          dropLocation: bookingForm.destinationCity,
          contactNumber: bookingForm.contactNumber,
          emergencyContact: bookingForm.emergencyContact,
          specialRequests: bookingForm.specialRequests,
          estimatedCost: bookingForm.estimatedCost,
          tripType: 'marriage'
        };
      } else {
        // Regular booking (one-way, round-trip, outstation, monthly)
        bookingData = {
          bookingType: activeBookingType,
          carId: bookingForm.selectedCar,
          carName: selectedCarData.name,
          carType: selectedCarData.carType,
          sourceCity: bookingForm.sourceCity,
          destinationCity: bookingForm.destinationCity,
          pickupDate: bookingForm.pickupDate,
          pickupTime: bookingForm.pickupTime,
          dropDate: bookingForm.dropDate || bookingForm.pickupDate,
          dropTime: bookingForm.dropTime,
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
          numberOfPassengers: (activeBookingType === 'one-way' || activeBookingType === 'round-trip' || activeBookingType === 'outstation') 
            ? bookingForm.numberOfPassengers 
            : selectedCarData.numberOfSeats || 4,
          pricingDetails: {
            perKm: selectedCarData.pricing[activeBookingType === 'one-way' ? 'oneWay' : 
                   activeBookingType === 'round-trip' ? 'roundTrip' : 
                   activeBookingType === 'outstation' ? 'outstation' : 
                   activeBookingType === 'marriage' ? 'marriage' : 'monthly']
          }
        };
      }

      const response = await bookingService.createCarBooking(bookingData);
      
      showSuccess('Car booking request submitted successfully! Your booking is pending admin confirmation.');
      
      // Close modal and reset form
      setShowConfirmModal(false);
      setBookingForm({
        sourceCity: '',
        destinationCity: '',
        selectedCar: '',
        pickupDate: '',
        pickupTime: '',
        numberOfPassengers: 1,
        dropDate: '',
        dropTime: '',
        numberOfCars: 1,
        selectedCars: [],
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-4 md:mb-6 border border-white/20">
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs md:text-sm font-medium">Premium Car Rental Service</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-4 tracking-tight">
              Book Your Perfect Ride
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-blue-100 max-w-2xl mx-auto px-4">
              Professional drivers, well-maintained vehicles, and transparent pricing for all your travel needs
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-6 md:-mt-8 relative z-10">{/* Content continues */}

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <div className="mb-4 md:mb-6">
            <AuthRequiredMessage 
              title="Login Required for Booking"
              message="Please login to book cars and track your reservations."
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Booking Type Tabs */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-4 md:mb-6">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 p-1.5 md:p-2">
            <div className="flex overflow-x-auto scrollbar-hide gap-1.5 md:gap-2">
              {bookingTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleBookingTypeChange(type.id)}
                  className={`flex-1 min-w-[110px] md:min-w-[130px] px-2 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-center font-medium transition-all ${
                    activeBookingType === type.id
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="text-base md:text-lg mb-0.5">{type.icon}</div>
                  <div className="text-[10px] md:text-xs font-semibold leading-tight">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleBookingSubmit} className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
            {/* Location Section */}
            <div className="space-y-4 md:space-y-5">
              <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-gray-200">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Journey Details</h3>
                  <p className="text-xs md:text-sm text-gray-500">Enter your pickup and drop locations</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Source City */}
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-700 mb-2 md:mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-green-600 rounded-full"></div>
                    </div>
                    Pickup Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter pickup city or location"
                    value={bookingForm.sourceCity}
                    onChange={(e) => handleSourceCityChange(e.target.value)}
                    onFocus={() => setShowSourceSuggestions(true)}
                    className="w-full px-4 md:px-5 py-3 md:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base font-medium placeholder:text-gray-400"
                  />
                  {showSourceSuggestions && sourceSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {sourceSuggestions.map((city, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectSourceCity(city)}
                          className="w-full px-5 py-3.5 text-left hover:bg-blue-50 transition-all border-b border-gray-100 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{city.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination City */}
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-700 mb-2 md:mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-red-600 rounded-full"></div>
                    </div>
                    Drop Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter destination city or location"
                    value={bookingForm.destinationCity}
                    onChange={(e) => handleDestinationCityChange(e.target.value)}
                    onFocus={() => setShowDestinationSuggestions(true)}
                    className="w-full px-4 md:px-5 py-3 md:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base font-medium placeholder:text-gray-400"
                  />
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {destinationSuggestions.map((city, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectDestinationCity(city)}
                          className="w-full px-5 py-3.5 text-left hover:bg-blue-50 transition-all border-b border-gray-100 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{city.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Distance and Time Display */}
              {bookingForm.distance > 0 ? (
                <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl">
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                        {activeBookingType === 'round-trip' 
                          ? `${bookingForm.distance} × 2 = ${(bookingForm.distance * 2).toFixed(2)}`
                          : bookingForm.distance
                        }
                      </div>
                      <div className="text-[10px] md:text-xs font-medium text-blue-200 uppercase tracking-wide">
                        {activeBookingType === 'round-trip' ? 'Total Kilometers' : 'Kilometers'}
                      </div>
                    </div>
                    <div className="text-center border-x border-white/20">
                      <div className="text-2xl md:text-3xl font-bold text-white mb-1">{bookingForm.estimatedTime}</div>
                      <div className="text-[10px] md:text-xs font-medium text-blue-200 uppercase tracking-wide">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-green-400 mb-1">₹{bookingForm.estimatedCost}</div>
                      <div className="text-[10px] md:text-xs font-medium text-blue-200 uppercase tracking-wide">Estimated</div>
                    </div>
                  </div>
                </div>
              ) : bookingForm.sourceCity && bookingForm.destinationCity && activeBookingType !== 'monthly' ? (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl md:rounded-2xl p-4 md:p-5">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 mb-1 text-sm md:text-base">Price Confirmation Pending</h4>
                      <p className="text-xs md:text-sm text-amber-800 leading-relaxed">
                        Our team will calculate the exact distance and provide you with the final pricing after reviewing your booking.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Car Selection - Hidden for marriage bookings */}
            {activeBookingType !== 'marriage' && (
            <div className="space-y-4 md:space-y-5">
              <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-gray-200">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Choose Your Vehicle</h3>
                  <p className="text-xs md:text-sm text-gray-500">Select from our premium fleet</p>
                </div>
              </div>

              {loadingCars ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium mt-4">Loading vehicles...</p>
                </div>
              ) : availableCars.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-bold text-lg mb-1">No Vehicles Available</p>
                  <p className="text-sm text-gray-600">Please check back later or contact our support team</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Dropdown Select */}
                  <div className="relative">
                    <select
                      required
                      value={bookingForm.selectedCar}
                      onChange={(e) => handleCarSelection(e.target.value)}
                      className="w-full px-4 md:px-5 py-3 md:py-4 pr-10 md:pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none text-base font-medium cursor-pointer hover:border-gray-300"
                    >
                      <option value="" className="text-gray-400">Select your preferred vehicle</option>
                      {availableCars.map((car) => (
                        <option key={car._id} value={car._id} className="py-2">
                          {car.name} • {car.carType} • {car.numberOfSeats} Seats • ₹
                          {car.pricing[activeBookingType === 'one-way' ? 'oneWay' : 
                             activeBookingType === 'round-trip' ? 'roundTrip' : 
                             activeBookingType === 'outstation' ? 'outstation' : 
                             activeBookingType === 'marriage' ? 'marriage' : 'monthly']
                             [activeBookingType === 'marriage' ? 'perDay' : 
                              activeBookingType === 'monthly' ? 'price' : 'perKm']}
                          {activeBookingType === 'marriage' ? '/day' : 
                           activeBookingType === 'monthly' ? '/month' : '/km'}
                          {car.isAvailable ? ' ✓' : ' ✗'}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Selected Car Details Card */}
                  {selectedCarData && (
                    <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl border border-blue-800">
                      <div className="flex items-start gap-3 md:gap-5">
                        {/* Car Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xl md:text-2xl font-bold text-white mb-1.5 md:mb-2">{selectedCarData.name}</h4>
                              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1 bg-blue-500/30 backdrop-blur-sm text-white rounded-md md:rounded-lg text-[10px] md:text-xs font-bold border border-blue-400/30">
                                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  {selectedCarData.carType}
                                </span>
                                <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1 bg-purple-500/30 backdrop-blur-sm text-white rounded-md md:rounded-lg text-[10px] md:text-xs font-bold border border-purple-400/30">
                                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {selectedCarData.numberOfSeats} Seats
                                </span>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold shadow-lg flex-shrink-0 ${
                              selectedCarData.isAvailable 
                                ? 'bg-green-500 text-white' 
                                : 'bg-red-500 text-white'
                            }`}>
                              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse"></span>
                              {selectedCarData.isAvailable ? 'Available' : 'Not Available'}
                            </span>
                          </div>

                          {/* Features */}
                          {selectedCarData.features && selectedCarData.features.length > 0 && (
                            <div className="mb-3 md:mb-4">
                              <p className="text-[10px] md:text-xs font-bold text-blue-200 mb-1.5 md:mb-2 uppercase tracking-wide">Included Features</p>
                              <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {selectedCarData.features.map((feature, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-md md:rounded-lg text-[10px] md:text-xs font-medium border border-white/20">
                                    <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pricing */}
                          <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-white/20">
                            <div>
                              <p className="text-[10px] md:text-xs text-blue-200 mb-0.5 md:mb-1 font-medium uppercase tracking-wide">Rate</p>
                              <p className="text-2xl md:text-3xl font-bold text-white">
                                ₹{selectedCarData.pricing[activeBookingType === 'one-way' ? 'oneWay' : 
                                   activeBookingType === 'round-trip' ? 'roundTrip' : 
                                   activeBookingType === 'outstation' ? 'outstation' : 
                                   activeBookingType === 'marriage' ? 'marriage' : 'monthly']
                                   [activeBookingType === 'marriage' ? 'perDay' : 
                                    activeBookingType === 'monthly' ? 'price' : 'perKm']}
                                <span className="text-sm md:text-base text-blue-200 font-normal ml-1">
                                  {activeBookingType === 'marriage' ? '/ day' : 
                                   activeBookingType === 'monthly' ? '/ month' : '/ km'}
                                </span>
                              </p>
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Date and Time Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Schedule</h3>
                  <p className="text-sm text-gray-500">Select your pickup date and time</p>
                </div>
              </div>

              <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={bookingForm.pickupDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, pickupDate: e.target.value }))}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Pickup Time
                  </label>
                  <input
                    type="time"
                    value={bookingForm.pickupTime}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, pickupTime: e.target.value }))}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base font-medium"
                  />
                </div>
              </div>

              {/* Number of Passengers - Only for one-way, round-trip, and outstation */}
              {(activeBookingType === 'one-way' || activeBookingType === 'round-trip' || activeBookingType === 'outstation') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Number of Passengers *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Enter number of passengers"
                    value={bookingForm.numberOfPassengers}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Allow only numbers
                      value = value.replace(/[^\d]/g, '');
                      
                      // Allow empty string for clearing
                      if (value === '') {
                        setBookingForm(prev => ({ ...prev, numberOfPassengers: '' }));
                        return;
                      }
                      
                      // Remove leading zeros
                      value = value.replace(/^0+(?=\d)/, '');
                      const numValue = parseInt(value);
                      
                      if (numValue >= 1 && numValue <= 50) {
                        setBookingForm(prev => ({ ...prev, numberOfPassengers: numValue }));
                      }
                    }}
                    onBlur={(e) => {
                      // Set to 1 if empty on blur
                      if (e.target.value === '') {
                        setBookingForm(prev => ({ ...prev, numberOfPassengers: 1 }));
                      }
                    }}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base font-medium placeholder:text-gray-400"
                  />
                  {selectedCarData && bookingForm.numberOfPassengers && bookingForm.numberOfPassengers > selectedCarData.numberOfSeats && (
                    <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm text-red-800 font-medium">
                        Warning: Selected vehicle has only {selectedCarData.numberOfSeats} seats. Please select a larger vehicle or reduce passengers.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Marriage Booking - Number of Cars and Drop Date/Time */}
            {activeBookingType === 'marriage' && (
              <>
                {/* Number of Cars */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Marriage Booking Details</h3>
                      <p className="text-sm text-gray-500">Select number of cars and duration</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Number of Cars Required *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      placeholder="Enter number of cars (1-10)"
                      value={bookingForm.numberOfCars}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          // Allow empty field temporarily while user is typing
                          setBookingForm(prev => ({ 
                            ...prev, 
                            numberOfCars: ''
                          }));
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
                            setBookingForm(prev => ({ 
                              ...prev, 
                              numberOfCars: numValue,
                              selectedCars: Array(numValue).fill('').map((_, idx) => prev.selectedCars[idx] || '')
                            }));
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // On blur, if empty, set to 1
                        if (e.target.value === '' || parseInt(e.target.value) < 1) {
                          setBookingForm(prev => ({ 
                            ...prev, 
                            numberOfCars: 1,
                            selectedCars: ['']
                          }));
                        }
                      }}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:bg-white transition-all text-base font-medium placeholder:text-gray-400"
                    />
                    <p className="mt-2 text-xs text-gray-500">You can select up to 10 cars for your marriage booking</p>
                  </div>
                </div>

                {/* Car Selection Dropdowns */}
                {bookingForm.numberOfCars > 0 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Select Cars</h3>
                        <p className="text-sm text-gray-500">Choose {bookingForm.numberOfCars} car{bookingForm.numberOfCars > 1 ? 's' : ''} for your booking</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Array.from({ length: bookingForm.numberOfCars }).map((_, index) => (
                        <div key={index}>
                          <label className="block text-sm font-bold text-gray-700 mb-3">
                            Car {index + 1} *
                          </label>
                          <select
                            required
                            value={bookingForm.selectedCars[index] || ''}
                            onChange={(e) => {
                              const newSelectedCars = [...bookingForm.selectedCars];
                              newSelectedCars[index] = e.target.value;
                              setBookingForm(prev => ({ ...prev, selectedCars: newSelectedCars }));
                            }}
                            className="w-full px-4 md:px-5 py-3 md:py-4 pr-10 md:pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all appearance-none text-base font-medium cursor-pointer hover:border-gray-300"
                          >
                            <option value="">Select car {index + 1}</option>
                            {availableCars.map((car) => (
                              <option key={car._id} value={car._id}>
                                {car.name} • {car.carType} • {car.numberOfSeats} Seats • ₹{car.pricing.marriage.perDay}/day
                                {car.isAvailable ? ' ✓' : ' ✗'}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drop Date and Time for Marriage */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Return Schedule</h3>
                      <p className="text-sm text-gray-500">Select your return date and time</p>
                    </div>
                  </div>

                  <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        Return Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={bookingForm.pickupDate || today}
                        value={bookingForm.dropDate}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, dropDate: e.target.value }))}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all text-base font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        Return Time
                      </label>
                      <input
                        type="time"
                        value={bookingForm.dropTime}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, dropTime: e.target.value }))}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all text-base font-medium"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Round Trip - Drop Date */}
            {activeBookingType === 'round-trip' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Return Schedule</h3>
                    <p className="text-sm text-gray-500">Select your return date and time</p>
                  </div>
                </div>

                <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Return Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={bookingForm.pickupDate || today}
                      value={bookingForm.dropDate}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, dropDate: e.target.value }))}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Return Time
                    </label>
                    <input
                      type="time"
                      value={bookingForm.dropTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, dropTime: e.target.value }))}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Contact Details</h3>
                  <p className="text-sm text-gray-500">How can we reach you?</p>
                </div>
              </div>

              {/* Checkbox to use same number - Above inputs */}
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <input
                  type="checkbox"
                  id="sameAsPhone"
                  checked={sameAsPhone}
                  onChange={(e) => {
                    setSameAsPhone(e.target.checked);
                    if (e.target.checked) {
                      setBookingForm(prev => ({ ...prev, emergencyContact: prev.contactNumber }));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="sameAsPhone" className="text-xs sm:text-sm text-gray-700 cursor-pointer select-none font-medium">
                  WhatsApp number is same as phone number
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={bookingForm.contactNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setBookingForm(prev => ({ ...prev, contactNumber: value }));
                        // If checkbox is checked, also update WhatsApp number
                        if (sameAsPhone) {
                          setBookingForm(prev => ({ ...prev, emergencyContact: value }));
                        }
                      }
                    }}
                    maxLength="10"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base font-medium placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter WhatsApp number"
                    value={bookingForm.emergencyContact}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setBookingForm(prev => ({ ...prev, emergencyContact: value }));
                        // Uncheck the checkbox if user manually edits WhatsApp number
                        if (sameAsPhone && value !== bookingForm.contactNumber) {
                          setSameAsPhone(false);
                        }
                      }
                    }}
                    maxLength="10"
                    disabled={sameAsPhone}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base font-medium placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Additional Requirements</h3>
                  <p className="text-sm text-gray-500">Any special requests or preferences?</p>
                </div>
              </div>

              <textarea
                rows={4}
                placeholder="Tell us about any special requirements, preferences, or additional information..."
                value={bookingForm.specialRequests}
                onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all resize-none text-base font-medium placeholder:text-gray-400"
              />
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
              <button
                type="button"
                onClick={() => {
                  setBookingForm({
                    sourceCity: '',
                    destinationCity: '',
                    selectedCar: '',
                    pickupDate: '',
                    pickupTime: '',
                    numberOfPassengers: 1,
                    dropDate: '',
                    dropTime: '',
                    contactNumber: '',
                    emergencyContact: '',
                    specialRequests: '',
                    distance: 0,
                    estimatedTime: '',
                    estimatedCost: 0
                  });
                  setSelectedCarData(null);
                }}
                className="flex-1 px-6 md:px-8 py-3.5 md:py-4 bg-gray-100 text-gray-700 rounded-xl md:rounded-2xl font-bold hover:bg-gray-200 transition-all text-base border-2 border-gray-200"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isLoading || !isAuthenticated}
                className="flex-1 px-6 md:px-8 py-3.5 md:py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-xl md:rounded-2xl font-bold hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-600/40 transform hover:-translate-y-0.5 text-base"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Login to Book</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Proceed to Booking</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 md:p-8 text-center border border-gray-100 hover:shadow-xl transition-all">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-5 shadow-lg shadow-blue-500/30">
              <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">Safe & Reliable</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Well-maintained vehicles with professional, verified drivers</p>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 md:p-8 text-center border border-gray-100 hover:shadow-xl transition-all">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-5 shadow-lg shadow-green-500/30">
              <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">24/7 Support</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Round-the-clock customer support and roadside assistance</p>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 md:p-8 text-center border border-gray-100 hover:shadow-xl transition-all">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-5 shadow-lg shadow-purple-500/30">
              <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">Best Prices</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Competitive rates with transparent, no-hidden-cost pricing</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-3 sm:p-4 md:p-6 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Confirm Your Booking</h3>
                    <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">Please review your booking details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 overflow-y-auto flex-1">
              {/* Trip Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border-2 border-blue-200">
                <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Trip Summary
                </h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  <div className="text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-sm">
                    <div className="text-lg sm:text-2xl md:text-3xl font-bold text-blue-600">
                      {bookingForm.distance > 0 
                        ? (activeBookingType === 'round-trip' 
                            ? `${bookingForm.distance} × 2 = ${(bookingForm.distance * 2).toFixed(2)}`
                            : `${bookingForm.distance}`)
                        : 'TBD'}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-0.5 sm:mt-1">
                      {bookingForm.distance > 0 
                        ? (activeBookingType === 'round-trip' ? 'Total km' : 'km')
                        : 'Distance'}
                    </div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-sm">
                    <div className="text-lg sm:text-2xl md:text-3xl font-bold text-green-600">
                      {bookingForm.estimatedTime || 'TBD'}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-0.5 sm:mt-1">Time</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-sm border-2 border-purple-200">
                    <div className="text-lg sm:text-2xl md:text-3xl font-bold text-purple-600">
                      {bookingForm.estimatedCost > 0 ? `₹${bookingForm.estimatedCost.toLocaleString('en-IN')}` : 'TBD'}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-0.5 sm:mt-1 font-semibold">Cost</div>
                  </div>
                </div>
              </div>

              {/* Car Details */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-gray-200">
                <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Car Details
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
                    <span className="text-xs sm:text-sm text-gray-600">Car</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{selectedCarData?.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
                    <span className="text-xs sm:text-sm text-gray-600">Type</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{selectedCarData?.carType}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
                    <span className="text-xs sm:text-sm text-gray-600">Seats</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{selectedCarData?.numberOfSeats} Seater</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
                    <span className="text-xs sm:text-sm text-gray-600">Booking Type</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 capitalize">{activeBookingType.replace('-', ' ')}</span>
                  </div>
                  {(activeBookingType === 'one-way' || activeBookingType === 'round-trip' || activeBookingType === 'outstation') && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-xs sm:text-sm text-gray-600">Passengers</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">{bookingForm.numberOfPassengers} {bookingForm.numberOfPassengers === 1 ? 'Person' : 'People'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Journey Details */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-gray-200">
                <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Journey Details
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-600 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs text-gray-600">Pickup Location</div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-900 break-words">{bookingForm.sourceCity}</div>
                      <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                        {new Date(bookingForm.pickupDate).toLocaleDateString('en-IN', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })} at {bookingForm.pickupTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-600 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs text-gray-600">Drop Location</div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-900 break-words">{bookingForm.destinationCity}</div>
                      {activeBookingType === 'round-trip' && bookingForm.dropDate && (
                        <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
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
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-gray-200">
                <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
                    <div className="text-[10px] sm:text-xs text-gray-600">Phone Number</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">+91 {bookingForm.contactNumber}</div>
                  </div>
                  {bookingForm.emergencyContact && (
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
                      <div className="text-[10px] sm:text-xs text-gray-600">WhatsApp Number</div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-900">+91 {bookingForm.emergencyContact}</div>
                    </div>
                  )}
                </div>
                {bookingForm.specialRequests && (
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                    <div className="text-[10px] sm:text-xs text-gray-600 mb-1">Special Requests</div>
                    <div className="text-xs sm:text-sm text-gray-900">{bookingForm.specialRequests}</div>
                  </div>
                )}
              </div>

              {/* Important Note */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex gap-2 sm:gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs sm:text-sm font-semibold text-yellow-900 mb-1">Important Note</h5>
                    <p className="text-[10px] sm:text-xs text-yellow-800">
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
            <div className="bg-gray-50 px-3 py-3 sm:px-4 sm:py-3 md:px-6 md:py-4 border-t border-gray-200 flex gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={confirmBooking}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Confirming...</span>
                    <span className="sm:hidden">Wait...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline">Confirm Booking</span>
                    <span className="sm:hidden">Confirm</span>
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
