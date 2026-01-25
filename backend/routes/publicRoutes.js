import express from 'express';
import { authenticateJWT, requireUser } from '../middlewares/auth.js';
import * as publicControllers from '../controllers/publicControllers.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/tour-packages', publicControllers.tourPackage);
router.get('/tour-packages/:identifier', publicControllers.tourPackageById);
router.get('/tour-categories', publicControllers.tourPackageCategory);

// Protected routes (require JWT authentication)
router.post('/bookings/tour', authenticateJWT, requireUser, publicControllers.tourBookings);
router.get('/bookings/my-bookings', authenticateJWT, requireUser, publicControllers.userBookings);
router.get('/bookings/:id', authenticateJWT, requireUser, publicControllers.singleBookings);
router.patch('/bookings/:id/cancel', authenticateJWT, requireUser, publicControllers.cancelBookings);

// Query routes (require authentication)
router.post('/queries', authenticateJWT, requireUser, publicControllers.submitQuery);
router.get('/queries/my-queries', authenticateJWT, requireUser, publicControllers.getUsersQueries);
router.patch('/queries/:id/rate', authenticateJWT, requireUser, publicControllers.rateQueryResponse);

export default router;