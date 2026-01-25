import express from 'express';
import * as publicControllers from '../controllers/publicControllers.js';

const router = express.Router();

// Middleware to check authentication for booking routes
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false,
      message: "Authentication required" 
    });
  }
  next();
};

// Get all published tour packages
router.get('/tour-packages', publicControllers.tourPackage);

// Get single tour package by slug or ID
router.get('/tour-packages/:identifier', publicControllers.tourPackageById);

// Get tour package categories
router.get('/tour-categories', publicControllers.tourPackageCategory);

// Create tour booking
router.post('/bookings/tour', requireAuth, publicControllers.tourBookings);

// Get user's bookings
router.get('/bookings/my-bookings', requireAuth, publicControllers.userBookings);

// Get single booking
router.get('/bookings/:id', requireAuth, publicControllers.singleBookings);

// Cancel booking
router.patch('/bookings/:id/cancel', requireAuth, publicControllers.cancelBookings);

// Submit query (requires authentication)
router.post('/queries', requireAuth, publicControllers.submitQuery);

// Get user's queries
router.get('/queries/my-queries', requireAuth, publicControllers.getUsersQueries);

// Rate query response
router.patch('/queries/:id/rate', requireAuth, publicControllers.rateQueryResponse);

export default router;