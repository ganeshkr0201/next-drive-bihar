import User from '../models/User.js';
import TourPackage from '../models/TourPackage.js';
import Booking from '../models/Booking.js';
import Query from '../models/Query.js';
import CarBooking from '../models/CarBooking.js';
import Notification from '../models/Notification.js';
import notificationService from '../utils/notificationService.js';



// Get dashboard statistics
export const getDashboardStatistics = async (req, res) => {
  try {
    const [totalUsers, totalQueries, totalTourBookings, totalCarBookings, totalTourPackages] = await Promise.all([
      User.countDocuments(),
      Query.countDocuments(),
      Booking.countDocuments({ type: 'tour' }),
      CarBooking.countDocuments(),
      TourPackage.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalQueries,
        totalTourBookings,
        totalCarBookings,
        totalTourPackages
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
}


// Get all queries with filtering
export const getQueriesWithFiltering = async (req, res) => {
  try {
    const { status, category, filter } = req.query;
    let queries;

    if (filter === 'active') {
      queries = await Query.getActiveQueries();
    } else if (filter === 'closed') {
      queries = await Query.getClosedQueries();
    } else if (status) {
      queries = await Query.getByStatus(status);
    } else if (category) {
      queries = await Query.getByCategory(category);
    } else {
      queries = await Query.find()
        .populate('user', 'name email')
        .populate('assignedTo', 'name email')
        .populate('respondedBy', 'name email')
        .sort({ createdAt: -1 });
    }

    // Get statistics
    const stats = await Promise.all([
      Query.countDocuments({ status: 'pending' }),
      Query.countDocuments({ status: 'resolved' }),
      Query.countDocuments({ status: 'closed' }),
      Query.countDocuments({ category: 'car-booking' }),
      Query.countDocuments({ category: 'tour-package' }),
      Query.countDocuments({ category: 'others' })
    ]);

    res.json({
      success: true,
      queries,
      stats: {
        pending: stats[0],
        resolved: stats[1],
        closed: stats[2],
        carBooking: stats[3],
        tourPackage: stats[4],
        others: stats[5],
        total: stats[0] + stats[1] + stats[2],
        active: stats[0] + stats[1]
      }
    });
  } catch (error) {
    console.error('Get queries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queries'
    });
  }
}


// Respond to a query
export const respondToQuery = async (req, res) => {
  try {
    console.log('📝 Respond to query endpoint hit:', req.params.id);
    console.log('📝 Request body:', req.body);
    
    const { id } = req.params;
    const { response, status = 'resolved' } = req.body;

    if (!response || !response.trim()) {
      console.log('❌ No response provided');
      return res.status(400).json({
        success: false,
        message: 'Response is required'
      });
    }

    console.log('🔍 Finding query with ID:', id);
    const query = await Query.findById(id);
    
    if (!query) {
      console.log('❌ Query not found');
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    console.log('✅ Query found, updating...');
    const updatedQuery = await Query.findByIdAndUpdate(
      id,
      {
        response: response.trim(),
        status,
        respondedAt: new Date(),
        respondedBy: req.user._id
      },
      { new: true }
    ).populate('respondedBy', 'name email');

    console.log('✅ Query updated successfully');

    // Simplified notification creation (skip if it fails)
    try {
      const user = await User.findOne({ email: query.email });
      if (user) {
        const notification = new Notification({
          recipient: user._id,
          sender: req.user._id,
          type: 'query_response',
          title: 'Response to Your Query',
          message: `We have responded to your query: "${query.subject}".`,
          relatedQuery: query._id,
          priority: 'high'
        });
        await notification.save();
        console.log('✅ Notification created');
      }
    } catch (notificationError) {
      console.log('⚠️ Notification creation failed (non-critical):', notificationError.message);
    }

    res.json({
      success: true,
      message: 'Query response sent successfully',
      query: updatedQuery
    });

  } catch (error) {
    console.error('❌ Respond to query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to query',
      error: error.message
    });
  }
}


// Get all tour bookings
export const getAllTourBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ type: 'tour' })
      .populate('user', 'name email')
      .populate('tourPackage', 'title')
      .populate('cancelledBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get tour bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tour bookings'
    });
  }
}


// Get all car bookings
export const getAllCarBookings = async (req, res) => {
  try {
    const bookings = await CarBooking.find()
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get car bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch car bookings'
    });
  }
}


// Get all tour packages
export const getAllTourPackages = async (req, res) => {
  try {
    const packages = await TourPackage.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Get booking statistics for each package
    const packagesWithStats = await Promise.all(
      packages.map(async (pkg) => {
        const bookingStats = await Booking.aggregate([
          { 
            $match: { 
              tourPackage: pkg._id,
              type: 'tour'
            } 
          },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              totalTravelers: { $sum: '$numberOfTravelers' },
              totalRevenue: { $sum: '$totalAmount' }
            }
          }
        ]);

        const stats = bookingStats[0] || {
          totalBookings: 0,
          totalTravelers: 0,
          totalRevenue: 0
        };

        return {
          ...pkg.toObject(),
          bookingStats: stats
        };
      })
    );

    res.json({
      success: true,
      packages: packagesWithStats
    });
  } catch (error) {
    console.error('Get tour packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tour packages'
    });
  }
}


// Create new tour package
export const createNewTourPackage = async (req, res) => {
  try {
    const {
      name,
      duration,
      summary,
      highlights,
      price,
      discount,
      inclusions,
      exclusions,
      pickupLocations,
      dropLocations
    } = req.body;

    // Validate required fields
    if (!name || !duration || !summary || !highlights || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, duration, summary, highlights, and price are required'
      });
    }

    // Process highlights
    let highlightsArray = [];
    if (highlights) {
      highlightsArray = highlights.split('\n').filter(h => h.trim());
    }

    // Process inclusions
    let inclusionsArray = [];
    if (inclusions) {
      inclusionsArray = inclusions.split('\n').filter(i => i.trim());
    }

    // Process exclusions
    let exclusionsArray = [];
    if (exclusions) {
      exclusionsArray = exclusions.split('\n').filter(e => e.trim());
    }

    // Process pickup locations
    let pickupLocationsArray = [];
    if (pickupLocations) {
      pickupLocationsArray = pickupLocations.split('\n').filter(p => p.trim());
    }

    // Process drop locations
    let dropLocationsArray = [];
    if (dropLocations) {
      dropLocationsArray = dropLocations.split('\n').filter(d => d.trim());
    }

    // Process uploaded images from Cloudinary
    const images = req.files || [];
    const galleryImages = images.map(file => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public_id
      caption: '',
      alt: name
    }));

    // Parse duration (e.g., "5 Days / 4 Nights" -> { days: 5, nights: 4 })
    const durationParts = duration.match(/(\d+)\s*days?\s*\/?\s*(\d+)?\s*nights?/i);
    const days = durationParts ? parseInt(durationParts[1]) : 1;
    const nights = durationParts && durationParts[2] ? parseInt(durationParts[2]) : Math.max(0, days - 1);

    // Generate unique slug
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    
    // Check for existing slugs and add counter if needed
    while (await TourPackage.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Calculate pricing
    const basePrice = parseFloat(price);
    const discountAmount = discount ? parseFloat(discount) : 0;
    const originalPrice = basePrice + discountAmount;

    // Create tour package
    const tourPackage = new TourPackage({
      title: name,
      slug: slug,
      description: summary,
      shortDescription: summary.substring(0, 200),
      duration: {
        days,
        nights
      },
      pricing: {
        basePrice,
        originalPrice,
        currency: 'INR'
      },
      images: {
        featured: images[0]?.path || '', // Cloudinary URL
        featuredPublicId: images[0]?.filename || '', // Cloudinary public_id
        gallery: galleryImages
      },
      destinations: [{
        name: 'Bihar',
        description: summary,
        attractions: highlightsArray
      }],
      highlights: highlightsArray,
      category: 'Heritage & Culture', // Default category
      difficulty: 'Easy',
      maxGroupSize: 50,
      minGroupSize: 2,
      status: 'Published', // Auto-publish new packages
      featured: false, // Can be updated later
      createdBy: req.user._id,
      inclusions: inclusionsArray.length > 0 ? inclusionsArray : ['Transportation', 'Accommodation', 'Meals as per itinerary'],
      exclusions: exclusionsArray.length > 0 ? exclusionsArray : ['Personal expenses', 'Travel insurance'],
      pickupLocations: pickupLocationsArray,
      dropLocations: dropLocationsArray,
      bookingInfo: {
        cancellationPolicy: 'Cancellation allowed up to 48 hours before travel',
        paymentTerms: '50% advance payment required'
      }
    });

    await tourPackage.save();
    console.log(`📦 Created tour package with ${images.length} images uploaded to Cloudinary`);

    res.status(201).json({
      success: true,
      message: 'Tour package created successfully',
      package: tourPackage
    });
  } catch (error) {
    console.error('Create tour package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tour package'
    });
  }
}


// Update tour package
export const updateTourPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      duration,
      location,
      highlights,
      maxGroupSize,
      difficulty,
      rating
    } = req.body;

    const tourPackage = await TourPackage.findById(id);
    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        message: 'Tour package not found'
      });
    }

    // Process highlights
    let highlightsArray = [];
    if (highlights) {
      try {
        highlightsArray = JSON.parse(highlights);
      } catch (error) {
        highlightsArray = highlights.split('\n').filter(h => h.trim());
      }
    }

    // Process uploaded images from Cloudinary
    const newImages = req.files ? req.files.map(file => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public_id
      caption: '',
      alt: name || tourPackage.title
    })) : [];

    // Update fields
    if (name) tourPackage.title = name;
    if (description) tourPackage.description = description;
    if (price) {
      tourPackage.pricing.basePrice = parseFloat(price);
      tourPackage.pricing.originalPrice = parseFloat(price);
    }
    if (duration) {
      // Parse duration (e.g., "5 Days / 4 Nights" -> { days: 5, nights: 4 })
      const durationParts = duration.match(/(\d+)\s*days?\s*\/?\s*(\d+)?\s*nights?/i);
      const days = durationParts ? parseInt(durationParts[1]) : 1;
      const nights = durationParts && durationParts[2] ? parseInt(durationParts[2]) : Math.max(0, days - 1);
      tourPackage.duration = { days, nights };
    }
    if (highlightsArray.length > 0) tourPackage.highlights = highlightsArray;
    if (maxGroupSize) tourPackage.maxGroupSize = parseInt(maxGroupSize);
    if (difficulty) tourPackage.difficulty = difficulty;
    
    // Add new images to existing gallery
    if (newImages.length > 0) {
      if (!tourPackage.images) {
        tourPackage.images = { gallery: [] };
      }
      if (!tourPackage.images.gallery) {
        tourPackage.images.gallery = [];
      }
      
      // If this is the first image and no featured image exists, set it as featured
      if (!tourPackage.images.featured && newImages.length > 0) {
        tourPackage.images.featured = newImages[0].url;
        tourPackage.images.featuredPublicId = newImages[0].publicId;
      }
      
      tourPackage.images.gallery = [...tourPackage.images.gallery, ...newImages];
    }

    // Update lastModifiedBy
    tourPackage.lastModifiedBy = req.user._id;

    await tourPackage.save();

    res.json({
      success: true,
      message: 'Tour package updated successfully',
      package: tourPackage
    });
  } catch (error) {
    console.error('Update tour package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tour package'
    });
  }
}


// Delete tour package
export const deleteTourPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const tourPackage = await TourPackage.findById(id);
    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        message: 'Tour package not found'
      });
    }

    await TourPackage.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Tour package deleted successfully'
    });
  } catch (error) {
    console.error('Delete tour package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tour package'
    });
  }
}


// Confirm booking (admin)
export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('tourPackage', 'title');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be confirmed'
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    // Send confirmation notification to user
    try {
      await notificationService.createBookingConfirmationNotification(booking, req.user);
    } catch (notificationError) {
      console.error('Failed to send confirmation notification:', notificationError);
      // Don't fail the confirmation if notification fails
    }

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      booking
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking'
    });
  }
}


// Cancel booking (admin)
export const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('tourPackage', 'title');

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
    booking.cancellationReason = reason;
    booking.cancelledBy = req.user._id;
    booking.cancelledByType = 'admin';
    booking.cancelledAt = new Date();
    
    await booking.save();

    // Send cancellation notification to user
    try {
      await notificationService.createBookingCancellationNotification(booking, req.user);
    } catch (notificationError) {
      console.error('Failed to send cancellation notification:', notificationError);
      // Don't fail the cancellation if notification fails
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


// Complete booking (admin)
export const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('tourPackage', 'title');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be marked as completed'
      });
    }

    booking.status = 'completed';
    await booking.save();

    // Send completion notification to user
    try {
      await notificationService.createBookingCompletionNotification(booking, req.user);
    } catch (notificationError) {
      console.error('Failed to send completion notification:', notificationError);
      // Don't fail the completion if notification fails
    }

    res.json({
      success: true,
      message: 'Booking marked as completed successfully',
      booking
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking'
    });
  }
}


// Update booking status (legacy route - kept for compatibility)
export const updatBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, confirmed, cancelled, or completed'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('user', 'name email').populate('tourPackage', 'title');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
}


// Update car booking status
export const updateCarBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, confirmed, in-progress, completed, or cancelled'
      });
    }

    const booking = await CarBooking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update car booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
}


// Get all users (optimized for performance)
export const getAllUsers = async (req, res) => {
  try {
    console.log('📊 Fetching users...');
    
    // Simple query without complex aggregations to avoid timeout
    const users = await User.find()
      .select('-password -otpHash')
      .sort({ 
        role: 1,  // This will put 'admin' before 'user' alphabetically
        createdAt: -1  // Then sort by creation date (newest first)
      })
      .lean(); // Use lean() for better performance

    console.log(`✅ Found ${users.length} users`);

    // Skip booking statistics for now to avoid timeout
    // Can be added back later with pagination or separate endpoint
    const sortedUsers = users.sort((a, b) => {
      // If both are admins or both are regular users, maintain creation date order
      if (a.role === b.role) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      // Admins come first
      return a.role === 'admin' ? -1 : 1;
    });

    res.json({
      success: true,
      users: sortedUsers.map(user => ({
        ...user,
        bookingStats: {
          tourBookings: 0,
          carBookings: 0,
          totalBookings: 0
        }
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Get users with pagination (for better performance with large datasets)
export const getUsersWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      User.find()
        .select('-password -otpHash')
        .sort({ role: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments()
    ]);

    res.json({
      success: true,
      users: users.map(user => ({
        ...user,
        bookingStats: {
          tourBookings: 0,
          carBookings: 0,
          totalBookings: 0
        }
      })),
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users with pagination error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
}


// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting other admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Get user statistics before deletion for response
    let tourBookings = 0, carBookings = 0, queries = 0, notifications = 0;
    
    try {
      [tourBookings, carBookings, queries, notifications] = await Promise.all([
        Booking.countDocuments({ user: id }),
        CarBooking.countDocuments({ user: id }),
        Query.countDocuments({ user: id }),
        Notification.countDocuments({ 
          $or: [
            { recipient: id },
            { sender: id }
          ]
        })
      ]);
    } catch (statsError) {
      console.error('Error getting user statistics:', statsError);
      // Continue with deletion even if stats fail
    }

    // Delete user (cascade delete will handle related data)
    const deletedUser = await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User account and all associated data deleted successfully',
      deletedData: {
        user: user.name,
        tourBookings,
        carBookings,
        queries,
        notifications,
        avatar: user.avatar ? 'Yes' : 'No'
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}


// Create admin user (REMOVE IN PRODUCTION)
export const adminUser = async (req, res) => {
  try {
    const { name, email, password, role = 'admin' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      isVerified: true,
      authProvider: 'local'
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: `${role === 'admin' ? 'Admin' : 'User'} created successfully`,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
}