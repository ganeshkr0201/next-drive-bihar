import express from 'express';
import { tourUpload } from '../config/cloudinary.js';
import { authenticateJWT, requireAdmin } from '../middlewares/auth.js';
import * as adminControllers from '../controllers/adminControllers.js';

const router = express.Router();

// All admin routes require JWT authentication and admin role
router.use(authenticateJWT);
router.use(requireAdmin);

// Get dashboard statistics
router.get('/stats', adminControllers.getDashboardStatistics);

// Get all queries with filtering
router.get('/queries', adminControllers.getQueriesWithFiltering);

// Respond to a query
router.patch('/queries/:id/respond', adminControllers.respondToQuery);

// Get all tour bookings
router.get('/tour-bookings', adminControllers.getAllTourBookings);

// Get all car bookings
router.get('/car-bookings', adminControllers.getAllCarBookings);

// Get all tour packages
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

// Get all users
router.get('/users', adminControllers.getAllUsers);

// Get users with pagination (alternative endpoint for better performance)
router.get('/users/paginated', adminControllers.getUsersWithPagination);

// Delete user
router.delete('/users/:id', adminControllers.deleteUser);

// Create admin user (REMOVE IN PRODUCTION) - no auth required for initial setup
router.post('/create-admin', adminControllers.adminUser);

export default router;