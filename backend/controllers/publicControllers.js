import TourPackage from '../models/TourPackage.js';
import Booking from '../models/Booking.js';
import CarBooking from '../models/CarBooking.js';
import Car from '../models/Car.js';
import Query from '../models/Query.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import notificationService from '../utils/notificationService.js';
import { formatPhoneNumber } from '../utils/phoneFormatter.js';

// Distance validation function - Predefined Bihar routes
const validateAndCalculateDistance = (source, destination, frontendDistance) => {
  // Predefined accurate distances for common Bihar routes (in km)
  const biharRoutes = {
    'patna-gaya': 100,
    'patna-bihar sharif': 70,
    'patna-muzaffarpur': 70,
    'patna-darbhanga': 140,
    'patna-bhagalpur': 220,
    'gaya-bodhgaya': 15,
    'gaya-bodh gaya': 15,
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
    'patna-siwan': 110,
    'patna-buxar': 120,
    'patna-aurangabad': 110,
    'patna-jehanabad': 50,
    'patna-nawada': 110,
    'patna-bettiah': 160,
    'patna-madhubani': 160,
    'patna-samastipur': 100,
    'patna-khagaria': 150,
    'patna-kishanganj': 320,
    'patna-araria': 280,
    'patna-madhepura': 200,
    'patna-supaul': 220,
    'patna-gopalganj': 90,
    'patna-bhabua': 150,
    'patna-sheikhpura': 80,
    'patna-lakhisarai': 140,
    'patna-jamui': 160,
    'patna-sitamarhi': 130,
    'patna-jamalpur': 190,
    'patna-dehri': 120,
    'patna-bagaha': 170
  };

  // Clean and normalize city names
  const cleanCity = (city) => {
    return city.toLowerCase()
      .trim()
      .replace(/,.*$/, '') // Remove everything after comma
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  const sourceClean = cleanCity(source);
  const destClean = cleanCity(destination);

  // Try to find exact route match
  const routeKey1 = `${sourceClean}-${destClean}`;
  const routeKey2 = `${destClean}-${sourceClean}`;

  console.log('🔍 Checking route:', routeKey1);

  // If exact route found, use predefined distance
  if (biharRoutes[routeKey1]) {
    const predefinedDistance = biharRoutes[routeKey1];
    console.log('✅ Found predefined route:', routeKey1, '=', predefinedDistance, 'km');
    
    // Allow 20% tolerance for frontend distance
    const tolerance = 0.20;
    const minDistance = predefinedDistance * (1 - tolerance);
    const maxDistance = predefinedDistance * (1 + tolerance);
    
    if (frontendDistance >= minDistance && frontendDistance <= maxDistance) {
      console.log('✅ Frontend distance within tolerance, using:', frontendDistance, 'km');
      return frontendDistance;
    } else {
      console.log('⚠️ Frontend distance outside tolerance, using predefined:', predefinedDistance, 'km');
      return predefinedDistance;
    }
  }

  if (biharRoutes[routeKey2]) {
    const predefinedDistance = biharRoutes[routeKey2];
    console.log('✅ Found predefined route (reverse):', routeKey2, '=', predefinedDistance, 'km');
    
    const tolerance = 0.20;
    const minDistance = predefinedDistance * (1 - tolerance);
    const maxDistance = predefinedDistance * (1 + tolerance);
    
    if (frontendDistance >= minDistance && frontendDistance <= maxDistance) {
      console.log('✅ Frontend distance within tolerance, using:', frontendDistance, 'km');
      return frontendDistance;
    } else {
      console.log('⚠️ Frontend distance outside tolerance, using predefined:', predefinedDistance, 'km');
      return predefinedDistance;
    }
  }

  // If one city is Patna (hub), use average distance
  if (sourceClean.includes('patna') || destClean.includes('patna')) {
    console.log('ℹ️ One city is Patna (hub), validating against average');
    const avgDistance = 80;
    
    // Allow wider tolerance for unknown routes
    if (frontendDistance > 0 && frontendDistance <= 400) {
      console.log('✅ Frontend distance seems reasonable, using:', frontendDistance, 'km');
      return frontendDistance;
    } else {
      console.log('⚠️ Frontend distance unreasonable, using average:', avgDistance, 'km');
      return avgDistance;
    }
  }

  // For unknown routes, validate frontend distance is reasonable
  if (frontendDistance > 0 && frontendDistance <= 500) {
    console.log('ℹ️ Unknown route, frontend distance seems reasonable:', frontendDistance, 'km');
    return frontendDistance;
  }

  // If frontend distance is unreasonable or 0, use default
  console.log('⚠️ Unknown route with unreasonable distance, using default: 100 km');
  return 100; // Default distance for unknown routes
};




// Get all published tour packages
export const tourPackage = async (req, res) => {
  try {
    const { featured, limit, category } = req.query;
    
    let query = { status: 'Published' };
    
    // Filter by featured if specified
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Filter by category if specified
    if (category) {
      query.category = category;
    }
    
    let tourPackagesQuery = TourPackage.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    // Apply limit if specified
    if (limit) {
      tourPackagesQuery = tourPackagesQuery.limit(parseInt(limit));
    }
    
    const tourPackages = await tourPackagesQuery;
    
    res.json({
      success: true,
      packages: tourPackages
    });
  } catch (error) {
    console.error('Get tour packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tour packages'
    });
  }
}



// Get single tour package by slug or ID
export const tourPackageById = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by slug first, then by ID
    let tourPackage = await TourPackage.findOne({ 
      slug: identifier, 
      status: 'Published' 
    }).populate('createdBy', 'name');
    
    if (!tourPackage) {
      tourPackage = await TourPackage.findOne({ 
        _id: identifier, 
        status: 'Published' 
      }).populate('createdBy', 'name');
    }
    
    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        message: 'Tour package not found'
      });
    }
    
    res.json({
      success: true,
      package: tourPackage
    });
  } catch (error) {
    console.error('Get tour package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tour package'
    });
  }
}



// Get tour package categories
export const tourPackageCategory = async (req, res) => {
  try {
    const categories = await TourPackage.distinct('category', { status: 'Published' });
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
}



// Create tour booking
export const tourBookings = async (req, res) => {
  try {
    const {
      tourPackage,
      numberOfTravelers,
      travelDate,
      totalAmount,
      specialRequests,
      contactNumber,
      emergencyContact,
      pickupLocation,
      dropLocation
    } = req.body;

    // Validate required fields
    if (!tourPackage || !numberOfTravelers || !travelDate || !totalAmount || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tour package, number of travelers, travel date, total amount, and contact number are required'
      });
    }

    // Verify tour package exists
    const pkg = await TourPackage.findById(tourPackage);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Tour package not found'
      });
    }

    // Check if travel date is in the future or today
    const travelDateTime = new Date(travelDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    if (travelDateTime < today) {
      return res.status(400).json({
        success: false,
        message: 'Travel date cannot be in the past'
      });
    }

    // Format phone numbers to include +91 prefix
    const formattedContactNumber = formatPhoneNumber(contactNumber);
    const formattedEmergencyContact = emergencyContact ? formatPhoneNumber(emergencyContact) : null;

    // Round off the total amount to nearest integer
    const roundedAmount = Math.round(parseFloat(totalAmount));

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      tourPackage,
      type: 'tour',
      numberOfTravelers: parseInt(numberOfTravelers),
      travelDate: travelDateTime,
      totalAmount: roundedAmount,
      specialRequests,
      contactNumber: formattedContactNumber,
      emergencyContact: formattedEmergencyContact,
      pickupLocation,
      dropLocation,
      status: 'pending',
      bookingDate: new Date()
    });

    await booking.save();

    // Populate the booking for response
    await booking.populate([
      { path: 'user', select: 'name email' },
      { path: 'tourPackage', select: 'title duration pricing' }
    ]);

    // Send notification to all admins about new booking
    try {
      await notificationService.notifyAdminsAboutNewBooking(booking);
    } catch (notificationError) {
      console.error('Failed to send admin notifications:', notificationError);
      // Don't fail the booking creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
}



// Create car booking
export const carBookings = async (req, res) => {
  try {
    console.log('🚗 Car booking request received');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User:', req.user?._id);
    
    const {
      bookingType,
      carId,
      carName,
      carType,
      sourceCity,
      destinationCity,
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,
      pickupLocation,
      dropLocation,
      contactNumber,
      emergencyContact,
      specialRequests,
      distance,
      estimatedTime,
      estimatedHours,
      tripType,
      numberOfPassengers,
      // Marriage booking specific
      numberOfCars,
      selectedCars
    } = req.body;

    const bookingTypeKey = (tripType || bookingType || 'one-way').toLowerCase();

    // Check if this is a marriage booking
    if (bookingTypeKey === 'marriage') {
      console.log('💒 Processing marriage booking');
      
      // Marriage booking validation
      if (!numberOfCars || !selectedCars || selectedCars.length === 0) {
        console.log('❌ Validation failed: Missing marriage booking details');
        return res.status(400).json({
          success: false,
          message: 'Number of cars and selected cars are required for marriage booking'
        });
      }

      if (!sourceCity || !destinationCity || !pickupDate || !dropDate || !contactNumber) {
        console.log('❌ Validation failed: Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Source city, destination city, pickup date, drop date, and contact number are required'
        });
      }

      // Check if pickup date is in the future or today
      const pickupDateTime = new Date(`${pickupDate}T${pickupTime || '00:00'}`);
      const dropDateTime = new Date(`${dropDate}T${dropTime || '18:00'}`);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today
      
      if (pickupDateTime < today) {
        console.log('❌ Validation failed: Pickup date cannot be in the past');
        return res.status(400).json({
          success: false,
          message: 'Pickup date cannot be in the past'
        });
      }

      if (dropDateTime <= pickupDateTime) {
        console.log('❌ Validation failed: Drop date must be after pickup date');
        return res.status(400).json({
          success: false,
          message: 'Return date must be after pickup date'
        });
      }

      // Calculate number of days
      const diffTime = Math.abs(dropDateTime - pickupDateTime);
      const numberOfDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
      console.log('📅 Marriage booking days:', numberOfDays);

      // Validate and calculate price for each car
      let totalCalculatedCost = 0;
      const validatedCars = [];

      for (const carData of selectedCars) {
        const car = await Car.findById(carData.carId);
        if (!car) {
          console.log('❌ Car not found:', carData.carId);
          return res.status(404).json({
            success: false,
            message: `Car ${carData.carName} not found`
          });
        }

        if (!car.isAvailable || car.status !== 'Active') {
          console.log('❌ Car not available:', car.name);
          return res.status(400).json({
            success: false,
            message: `Car ${car.name} is not available for booking`
          });
        }

        // Calculate cost for this car
        const carCost = (numberOfDays * car.pricing.marriage.perDay) + car.pricing.marriage.extraAmount;
        totalCalculatedCost += carCost;

        validatedCars.push({
          carId: car._id,
          carName: car.name,
          carType: car.carType,
          pricePerDay: car.pricing.marriage.perDay,
          calculatedCost: Math.round(carCost)
        });

        console.log(`🚗 Car: ${car.name}, Days: ${numberOfDays}, Cost: ₹${carCost}`);
      }

      console.log('💵 Total calculated cost:', totalCalculatedCost);

      // Format phone numbers
      const formattedContactNumber = formatPhoneNumber(contactNumber);
      const formattedEmergencyContact = emergencyContact ? formatPhoneNumber(emergencyContact) : null;

      // Round off the total cost
      const roundedAmount = Math.round(totalCalculatedCost);

      // Create marriage booking
      const carBooking = new CarBooking({
        user: req.user._id,
        carType: 'Multiple', // For marriage bookings with multiple cars
        pickupLocation: pickupLocation || sourceCity,
        dropoffLocation: dropLocation || destinationCity,
        pickupDate: pickupDateTime,
        dropoffDate: dropDateTime,
        pickupTime: pickupTime || undefined,
        dropoffTime: dropTime || undefined,
        numberOfPassengers: 0, // Not applicable for marriage bookings
        tripType: 'marriage',
        numberOfCars: numberOfCars,
        selectedCars: validatedCars,
        totalAmount: roundedAmount,
        paidAmount: 0,
        discount: 0,
        status: 'pending',
        paymentStatus: 'pending',
        specialRequests: specialRequests || '',
        notes: [{
          content: JSON.stringify({
            bookingType: 'marriage',
            numberOfCars: numberOfCars,
            numberOfDays: numberOfDays,
            sourceCity,
            destinationCity,
            contactNumber: formattedContactNumber,
            emergencyContact: formattedEmergencyContact,
            carsDetails: validatedCars,
            totalCalculatedCost: totalCalculatedCost,
            roundedAmount: roundedAmount
          }),
          addedBy: req.user._id,
          addedAt: new Date()
        }]
      });

      await carBooking.save();
      console.log('✅ Marriage booking saved to database:', carBooking._id);

      // Populate the booking for response
      await carBooking.populate('user', 'name email');
      console.log('✅ Marriage booking populated');

      // Send notification to admins
      try {
        await notificationService.notifyAdminsAboutNewCarBooking(carBooking);
        console.log('✅ Admin notifications sent');
      } catch (notificationError) {
        console.error('❌ Failed to send admin notifications:', notificationError);
      }

      console.log('✅ Sending success response');
      return res.status(201).json({
        success: true,
        message: 'Marriage booking created successfully',
        booking: carBooking
      });
    }

    // Regular booking (non-marriage) - existing logic
    // Validate required fields
    if (!carId || !carType || !sourceCity || !destinationCity || !pickupDate || !contactNumber) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Car ID, car type, source city, destination city, pickup date, and contact number are required'
      });
    }

    // Check if pickup date is in the future or today
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime || '00:00'}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    if (pickupDateTime < today) {
      console.log('❌ Validation failed: Pickup date cannot be in the past');
      return res.status(400).json({
        success: false,
        message: 'Pickup date cannot be in the past'
      });
    }

    // Fetch car details from database to get pricing
    const car = await Car.findById(carId);
    if (!car) {
      console.log('❌ Car not found');
      return res.status(404).json({
        success: false,
        message: 'Selected car not found'
      });
    }

    if (!car.isAvailable || car.status !== 'Active') {
      console.log('❌ Car not available');
      return res.status(400).json({
        success: false,
        message: 'Selected car is not available for booking'
      });
    }

    // Validate and recalculate distance on backend for security
    console.log('🔍 Validating distance between:', sourceCity, 'and', destinationCity);
    const frontendDistance = parseFloat(distance) || 0;
    const validatedDistance = validateAndCalculateDistance(sourceCity, destinationCity, frontendDistance);
    
    console.log('📏 Frontend distance:', frontendDistance, 'km');
    console.log('📏 Validated distance:', validatedDistance, 'km');
    
    // Use validated distance for price calculation
    const distanceKm = validatedDistance;
    const hours = parseFloat(estimatedHours) || 0;

    // Calculate price on backend for security
    let calculatedCost = 0;

    console.log('💰 Calculating price for booking type:', bookingTypeKey);
    console.log('📏 Distance:', distanceKm, 'km, Hours:', hours);

    switch (bookingTypeKey) {
      case 'one-way':
        calculatedCost = (distanceKm * car.pricing.oneWay.perKm) + car.pricing.oneWay.extraAmount;
        break;
      case 'round-trip':
        // For round trip, distance is doubled (x * 2 = 2x) as the car travels both ways
        calculatedCost = (distanceKm * 2 * car.pricing.roundTrip.perKm) + car.pricing.roundTrip.extraAmount;
        break;
      case 'outstation':
        calculatedCost = (distanceKm * car.pricing.outstation.perKm) + car.pricing.outstation.extraAmount;
        break;
      case 'monthly':
        calculatedCost = car.pricing.monthly.price + car.pricing.monthly.extraAmount;
        break;
      default:
        calculatedCost = 0;
    }

    console.log('💵 Calculated cost:', calculatedCost);

    // Format phone numbers to include +91 prefix
    const formattedContactNumber = formatPhoneNumber(contactNumber);
    const formattedEmergencyContact = emergencyContact ? formatPhoneNumber(emergencyContact) : null;

    console.log('✅ Validation passed, creating car booking...');

    // Round off the calculated cost to nearest integer
    const roundedAmount = Math.round(calculatedCost);

    // Create car booking with correct field mapping
    const carBooking = new CarBooking({
      user: req.user._id,
      carType: carType || 'SUV',
      pickupLocation: pickupLocation || sourceCity,
      dropoffLocation: dropLocation || destinationCity,
      pickupDate: pickupDateTime,
      dropoffDate: dropDate ? new Date(`${dropDate}T${dropTime || '18:00'}`) : pickupDateTime,
      pickupTime: pickupTime || undefined,
      dropoffTime: dropTime || undefined,
      numberOfPassengers: numberOfPassengers || 4,
      tripType: bookingTypeKey,
      totalAmount: roundedAmount,
      paidAmount: 0,
      discount: 0,
      status: 'pending',
      paymentStatus: 'pending',
      specialRequests: specialRequests || '',
      // Store additional data in notes for reference
      notes: [{
        content: JSON.stringify({
          carId,
          carName: car.name,
          carModel: car.carType,
          sourceCity,
          destinationCity,
          contactNumber: formattedContactNumber,
          emergencyContact: formattedEmergencyContact,
          distance: distanceKm,
          estimatedTime,
          estimatedHours: hours,
          bookingType: bookingTypeKey,
          pricingUsed: car.pricing[bookingTypeKey === 'one-way' ? 'oneWay' : 
                                     bookingTypeKey === 'round-trip' ? 'roundTrip' : 
                                     bookingTypeKey === 'outstation' ? 'outstation' : 
                                     bookingTypeKey === 'marriage' ? 'marriage' : 'monthly'],
          calculatedCost: calculatedCost,
          roundedAmount: roundedAmount
        }),
        addedBy: req.user._id,
        addedAt: new Date()
      }]
    });

    await carBooking.save();
    console.log('✅ Car booking saved to database:', carBooking._id);

    // Populate the booking for response
    await carBooking.populate('user', 'name email');
    console.log('✅ Car booking populated');

    // Send notification to all admins about new car booking
    try {
      await notificationService.notifyAdminsAboutNewCarBooking(carBooking);
      console.log('✅ Admin notifications sent');
    } catch (notificationError) {
      console.error('❌ Failed to send admin notifications:', notificationError);
      // Don't fail the booking creation if notification fails
    }

    console.log('✅ Sending success response');
    res.status(201).json({
      success: true,
      message: 'Car booking created successfully',
      booking: carBooking
    });
  } catch (error) {
    console.error('❌ Create car booking error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    if (error.name === 'ValidationError') {
      console.error('❌ Validation errors:', error.errors);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create car booking',
      error: error.message,
      details: error.name === 'ValidationError' ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
}



// Get user's bookings
export const userBookings = async (req, res) => {
  try {
    // Fetch both tour bookings and car bookings
    const [tourBookings, carBookings] = await Promise.all([
      Booking.find({ user: req.user._id })
        .populate('tourPackage', 'title duration pricing images')
        .sort({ createdAt: -1 }),
      CarBooking.find({ user: req.user._id })
        .sort({ createdAt: -1 })
    ]);

    // Combine and sort all bookings by creation date
    const allBookings = [
      ...tourBookings.map(booking => ({ ...booking.toObject(), type: 'tour' })),
      ...carBookings.map(booking => ({ ...booking.toObject(), type: 'car' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      bookings: allBookings
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
}



// Get single booking
export const singleBookings = async (req, res) => {
  try {
    // Try to find the booking in both collections
    let booking = await Booking.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).populate([
      { path: 'tourPackage', select: 'title duration pricing images highlights' },
      { path: 'user', select: 'name email' }
    ]);

    // If not found in Booking collection, try CarBooking collection
    if (!booking) {
      booking = await CarBooking.findOne({ 
        _id: req.params.id, 
        user: req.user._id 
      }).populate([
        { path: 'user', select: 'name email' }
      ]);
      
      if (booking) {
        booking = { ...booking.toObject(), type: 'car' };
      }
    } else {
      booking = { ...booking.toObject(), type: 'tour' };
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
    });
  }
}


// Cancel booking
export const cancelBookings = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Try to find the booking in both collections
    let booking = await Booking.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).populate('user', 'name email').populate('tourPackage', 'title');

    let isCarBooking = false;
    
    // If not found in Booking collection, try CarBooking collection
    if (!booking) {
      booking = await CarBooking.findOne({ 
        _id: req.params.id, 
        user: req.user._id 
      }).populate('user', 'name email');
      isCarBooking = true;
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';
    booking.cancelledBy = req.user._id;
    booking.cancelledByType = 'user';
    booking.cancelledAt = new Date();
    
    // Reset payment details when booking is cancelled
    booking.paidAmount = 0;
    booking.discount = 0;
    
    await booking.save();

    // Populate again to ensure we have fresh data
    if (isCarBooking) {
      await booking.populate('user', 'name email');
    } else {
      await booking.populate('user', 'name email');
      await booking.populate('tourPackage', 'title');
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
}



// Submit query (requires authentication)
export const submitQuery = async (req, res) => {
  try {
    const { name, email, phone, whatsapp, subject, message, category } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !subject || !message || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, subject, message, and category are required'
      });
    }

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Validate WhatsApp number if provided
    if (whatsapp && !/^\d{10}$/.test(whatsapp)) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp number must be exactly 10 digits'
      });
    }

    // Use authenticated user's information
    const userId = req.user._id;

    // Format phone numbers to include +91 prefix
    const formattedPhone = formatPhoneNumber(phone);
    const formattedWhatsApp = whatsapp ? formatPhoneNumber(whatsapp) : null;

    // Create query
    const query = new Query({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: formattedPhone,
      whatsapp: formattedWhatsApp,
      subject: subject.trim(),
      message: message.trim(),
      category,
      status: 'pending',
      user: userId
    });

    await query.save();

    // Notify all admins about the new query
    try {
      const admins = await User.find({ role: 'admin' });
      
      const adminNotifications = admins.map(admin => ({
        recipient: admin._id,
        sender: userId,
        type: 'query_response',
        title: 'New Query Received',
        message: `New ${category.replace('-', ' ')} query from ${name}: "${subject}". Please check the admin dashboard to respond.`,
        relatedQuery: query._id,
        priority: 'medium',
        actionUrl: '/admin/dashboard'
      }));

      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }
    } catch (notificationError) {
      console.error('Failed to create admin notifications:', notificationError);
      // Don't fail the query submission if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Your query has been submitted successfully. You can track its status in your dashboard.',
      query: {
        _id: query._id,
        name: query.name,
        email: query.email,
        phone: query.phone,
        subject: query.subject,
        category: query.category,
        status: query.status,
        createdAt: query.createdAt
      }
    });
  } catch (error) {
    console.error('Submit query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit query'
    });
  }
}



// Get user's queries
export const getUsersQueries = async (req, res) => {
  try {
    const queries = await Query.find({ 
      $or: [
        { user: req.user._id },
        { email: req.user.email }
      ]
    })
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      queries
    });
  } catch (error) {
    console.error('Get user queries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queries'
    });
  }
}



// Rate query response
export const rateQueryResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || !['satisfied', 'unsatisfied'].includes(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Valid rating (satisfied/unsatisfied) is required'
      });
    }

    const query = await Query.findOne({
      _id: id,
      $or: [
        { user: req.user._id },
        { email: req.user.email }
      ],
      status: 'resolved'
    });

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found or not resolved yet'
      });
    }

    query.rating = rating;
    query.ratedAt = new Date();
    if (feedback) {
      query.feedback = feedback.trim();
    }
    // Status will automatically change to 'closed' via the pre-save middleware

    await query.save();

    res.json({
      success: true,
      message: 'Thank you for your feedback! Your query has been closed.',
      query
    });
  } catch (error) {
    console.error('Rate query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating'
    });
  }
}


