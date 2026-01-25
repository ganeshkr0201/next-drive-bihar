import express from 'express';
import { tourUpload } from '../config/cloudinary.js';
import * as adminControllers from '../controllers/adminControllers.js';


const router = express.Router();



// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  console.log(`🔐 Admin middleware check - Authenticated: ${req.isAuthenticated()}`);
  
  if (!req.isAuthenticated()) {
    console.log(`❌ User not authenticated`);
    return res.status(401).json({ 
      success: false,
      message: "Authentication required" 
    });
  }

  console.log(`👤 User: ${req.user.name} (${req.user.email}) - Role: ${req.user.role}`);

  if (req.user.role !== 'admin') {
    console.log(`❌ User is not admin: ${req.user.role}`);
    return res.status(403).json({ 
      success: false,
      message: "Admin privileges required" 
    });
  }

  console.log(`✅ Admin access granted`);
  next();
};

// Get dashboard statistics
router.get('/stats', requireAdmin, adminControllers.getDashboardStatistics);

// Get all queries with filtering
router.get('/queries', requireAdmin, adminControllers.getQueriesWithFiltering);

// Respond to a query
router.patch('/queries/:id/respond', requireAdmin, adminControllers.respondToQuery);

// Get all tour bookings
router.get('/tour-bookings', requireAdmin, adminControllers.getAllTourBookings);

// Get all car bookings
router.get('/car-bookings', requireAdmin, adminControllers.getAllCarBookings);

// Get all tour packages
router.get('/tour-packages', requireAdmin, adminControllers.getAllTourPackages);

// Create new tour package
router.post('/tour-packages', requireAdmin, tourUpload.array('images', 10), adminControllers.createNewTourPackage);

// Update tour package
router.put('/tour-packages/:id', requireAdmin, tourUpload.array('images', 10), adminControllers.updateTourPackage);

// Delete tour package
router.delete('/tour-packages/:id', requireAdmin, adminControllers.deleteTourPackage);

// Confirm booking (admin)
router.patch('/bookings/:id/confirm', requireAdmin, adminControllers.confirmBooking);

// Cancel booking (admin)
router.patch('/bookings/:id/cancel', requireAdmin, adminControllers.cancelBooking);

// Complete booking (admin)
router.patch('/bookings/:id/complete', requireAdmin, adminControllers.completeBooking);

// Update booking status (legacy route - kept for compatibility)
router.put('/tour-bookings/:id/status', requireAdmin, adminControllers.updatBookingStatus);

// Update car booking status
router.put('/car-bookings/:id/status', requireAdmin, adminControllers.updateCarBookingStatus);

// Get all users
router.get('/users', requireAdmin, adminControllers.getAllUsers);

// Delete user
router.delete('/users/:id', requireAdmin, adminControllers.deleteUser);

// Create admin user (REMOVE IN PRODUCTION)
router.post('/create-admin', adminControllers.adminUser);

export default router;