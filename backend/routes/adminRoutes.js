import express from 'express';
import { tourUpload } from '../config/cloudinary.js';
import { authenticateJWT, requireAdmin } from '../middlewares/auth.js';
import * as adminControllers from '../controllers/adminControllers.js';
import { statsCache, invalidateCacheAfter } from '../middlewares/cache.js';

const router = express.Router();

// All admin routes require JWT authentication and admin role
router.use(authenticateJWT);
router.use(requireAdmin);

// Get dashboard statistics with caching (5 minutes)
router.get('/stats', statsCache, adminControllers.getDashboardStatistics);

// Get all queries with filtering (no cache - real-time data needed)
router.get('/queries', adminControllers.getQueriesWithFiltering);

// Respond to a query (invalidate stats cache after successful response)
router.patch('/queries/:id/respond', 
    invalidateCacheAfter(['admin_stats']), 
    adminControllers.respondToQuery
);

// Get all tour bookings (no cache - real-time data needed)
router.get('/tour-bookings', adminControllers.getAllTourBookings);

// Get all car bookings (no cache - real-time data needed)
router.get('/car-bookings', adminControllers.getAllCarBookings);

// Create offline/walk-in car booking (admin only)
router.post('/car-bookings/offline', adminControllers.createOfflineCarBooking);

// Get all tour packages (no cache for admin - they need real-time data)
router.get('/tour-packages', adminControllers.getAllTourPackages);

// Create new tour package
router.post('/tour-packages', tourUpload.array('images', 10), adminControllers.createNewTourPackage);

// Update tour package
router.put('/tour-packages/:id', tourUpload.array('images', 10), adminControllers.updateTourPackage);

// Delete tour package
router.delete('/tour-packages/:id', adminControllers.deleteTourPackage);

// Confirm booking (admin)
router.patch('/bookings/:id/confirm', adminControllers.confirmBooking);

// Cancel booking (admin)
router.patch('/bookings/:id/cancel', adminControllers.cancelBooking);

// Complete booking (admin)
router.patch('/bookings/:id/complete', adminControllers.completeBooking);

// Update booking status (legacy route - kept for compatibility)
router.put('/tour-bookings/:id/status', adminControllers.updatBookingStatus);

// Update car booking status
router.put('/car-bookings/:id/status', adminControllers.updateCarBookingStatus);

// Confirm car booking (admin)
router.patch('/car-bookings/:id/confirm', adminControllers.confirmCarBooking);

// Cancel car booking (admin)
router.patch('/car-bookings/:id/cancel', adminControllers.cancelCarBooking);

// Complete car booking (admin)
router.patch('/car-bookings/:id/complete', adminControllers.completeCarBooking);

// Update booking payment details (works for both tour and car bookings)
router.put('/bookings/:id/payment', adminControllers.updateBookingPayment);

// Get all users
router.get('/users', adminControllers.getAllUsers);

// Get users with pagination (alternative endpoint for better performance)
router.get('/users/paginated', adminControllers.getUsersWithPagination);

// Delete user
router.delete('/users/:id', adminControllers.deleteUser);


export default router;
