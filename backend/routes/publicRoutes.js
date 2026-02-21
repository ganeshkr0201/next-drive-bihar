import express from 'express';
import { authenticateJWT, requireUser } from '../middlewares/auth.js';
import * as publicControllers from '../controllers/publicControllers.js';
import { tourPackagesCache, publicDataCache, invalidateCacheAfter } from '../middlewares/cache.js';

const router = express.Router();

// Public routes with caching
router.get('/tour-packages', tourPackagesCache, publicControllers.tourPackage);
router.get('/tour-packages/:identifier', publicDataCache, publicControllers.tourPackageById);
router.get('/tour-categories', publicDataCache, publicControllers.tourPackageCategory);

// Protected routes (require JWT authentication)
router.post('/bookings/tour', 
    authenticateJWT, 
    requireUser, 
    invalidateCacheAfter(['tour_packages:*', 'admin_stats']), // Invalidate cache after booking
    publicControllers.tourBookings
);
router.post('/bookings/car', 
    authenticateJWT, 
    requireUser, 
    invalidateCacheAfter(['admin_stats']), // Invalidate cache after car booking
    publicControllers.carBookings
);
router.get('/bookings/my-bookings', authenticateJWT, requireUser, publicControllers.userBookings);
router.get('/bookings/:id', authenticateJWT, requireUser, publicControllers.singleBookings);
router.put('/bookings/:id/cancel', 
    authenticateJWT, 
    requireUser, 
    invalidateCacheAfter(['admin_stats']), // Invalidate stats after cancellation
    publicControllers.cancelBookings
);

// Query routes (require authentication)
router.post('/queries', 
    authenticateJWT, 
    requireUser, 
    invalidateCacheAfter(['admin_stats']), // Invalidate stats after new query
    publicControllers.submitQuery
);
router.get('/queries/my-queries', authenticateJWT, requireUser, publicControllers.getUsersQueries);
router.patch('/queries/:id/rate', authenticateJWT, requireUser, publicControllers.rateQueryResponse);

export default router;