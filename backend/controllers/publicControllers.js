import TourPackage from '../models/TourPackage.js';
import Booking from '../models/Booking.js';
import CarBooking from '../models/CarBooking.js';
import Query from '../models/Query.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import notificationService from '../utils/notificationService.js';
import { formatPhoneNumber } from '../utils/phoneFormatter.js';



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

    // Check if travel date is in the future
    const travelDateTime = new Date(travelDate);
    if (travelDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Travel date must be in the future'
      });
    }

    // Format phone numbers to include +91 prefix
    const formattedContactNumber = formatPhoneNumber(contactNumber);
    const formattedEmergencyContact = emergencyContact ? formatPhoneNumber(emergencyContact) : null;

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      tourPackage,
      type: 'tour',
      numberOfTravelers: parseInt(numberOfTravelers),
      travelDate: travelDateTime,
      totalAmount: parseFloat(totalAmount),
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
      estimatedCost,
      estimatedHours,
      tripType,
      pricingDetails,
      numberOfPassengers
    } = req.body;

    // Validate required fields
    if (!carType || !sourceCity || !destinationCity || !pickupDate || !contactNumber) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Car type, source city, destination city, pickup date, and contact number are required'
      });
    }

    // Check if pickup date is in the future
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime || '00:00'}`);
    if (pickupDateTime <= new Date()) {
      console.log('❌ Validation failed: Pickup date must be in future');
      return res.status(400).json({
        success: false,
        message: 'Pickup date must be in the future'
      });
    }

    // Format phone numbers to include +91 prefix
    const formattedContactNumber = formatPhoneNumber(contactNumber);
    const formattedEmergencyContact = emergencyContact ? formatPhoneNumber(emergencyContact) : null;

    console.log('✅ Validation passed, creating car booking...');

    // Create car booking with correct field mapping
    const carBooking = new CarBooking({
      user: req.user._id,
      carType: carType || 'SUV',
      pickupLocation: pickupLocation || sourceCity,
      dropoffLocation: dropLocation || destinationCity,
      pickupDate: pickupDateTime,
      dropoffDate: dropDate ? new Date(`${dropDate}T${dropTime || '18:00'}`) : pickupDateTime,
      pickupTime: pickupTime || '09:00',
      numberOfPassengers: numberOfPassengers || 4,
      tripType: (tripType || bookingType || 'one-way').toLowerCase(),
      totalAmount: parseFloat(estimatedCost) || 0,
      paidAmount: 0,
      discount: 0,
      status: 'pending',
      paymentStatus: 'pending',
      specialRequests: specialRequests || '',
      // Store additional data in notes for reference
      notes: [{
        content: JSON.stringify({
          carId,
          carName,
          sourceCity,
          destinationCity,
          contactNumber: formattedContactNumber,
          emergencyContact: formattedEmergencyContact,
          distance,
          estimatedTime,
          estimatedHours,
          pricingDetails
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
    res.status(500).json({
      success: false,
      message: 'Failed to create car booking',
      error: error.message
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
    });

    let isCarBooking = false;
    
    // If not found in Booking collection, try CarBooking collection
    if (!booking) {
      booking = await CarBooking.findOne({ 
        _id: req.params.id, 
        user: req.user._id 
      });
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

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = req.user._id;
    booking.cancelledByType = 'user';
    booking.cancelledAt = new Date();
    
    await booking.save();

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


