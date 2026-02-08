import express from 'express';
import * as carControllers from '../controllers/carControllers.js';
import { authenticateJWT, requireAdmin } from '../middlewares/auth.js';
import { createCacheMiddleware } from '../middlewares/cache.js';
import redisManager from '../config/redis.js';

const router = express.Router();

// Cache middleware for cars
const carsCache = createCacheMiddleware({
  ttl: 1800, // 30 minutes - cars don't change frequently
  keyGenerator: (req) => `cars:available`,
  condition: () => true
});

const allCarsCache = createCacheMiddleware({
  ttl: 600, // 10 minutes
  keyGenerator: (req) => `cars:all`,
  condition: (req) => req.user && req.user.role === 'admin'
});

// Cache invalidation helper for cars
const invalidateCarCache = async () => {
  try {
    await redisManager.del('cars:available');
    await redisManager.del('cars:all');
    console.log('🗑️ Car cache invalidated');
  } catch (error) {
    console.error('❌ Failed to invalidate car cache:', error.message);
  }
};

// Public routes - with caching
router.get('/available', carsCache, carControllers.getAvailableCars);

// Admin routes
router.use(authenticateJWT, requireAdmin);

router.get('/', allCarsCache, carControllers.getAllCars);
router.get('/:id', carControllers.getCarById);

// Mutation routes - invalidate cache manually after operations
router.post('/', async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to invalidate cache after success
  res.json = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      invalidateCarCache().catch(console.error);
    }
    return originalJson(data);
  };
  
  next();
}, carControllers.createCar);

router.put('/:id', async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      invalidateCarCache().catch(console.error);
    }
    return originalJson(data);
  };
  next();
}, carControllers.updateCar);

router.delete('/:id', async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      invalidateCarCache().catch(console.error);
    }
    return originalJson(data);
  };
  next();
}, carControllers.deleteCar);

router.patch('/:id/toggle-availability', async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      invalidateCarCache().catch(console.error);
    }
    return originalJson(data);
  };
  next();
}, carControllers.toggleCarAvailability);

export default router;
