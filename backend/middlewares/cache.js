import redisManager from '../config/redis.js';

// Cache middleware factory
export const createCacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}`,
    condition = () => true, // Always cache by default
    skipCache = (req) => false // Never skip cache by default
  } = options;

  return async (req, res, next) => {
    // Skip caching for non-GET requests or if condition not met
    if (req.method !== 'GET' || !condition(req) || skipCache(req)) {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);
      const startTime = Date.now();
      
      // Try to get from cache
      const cachedData = await redisManager.get(cacheKey);
      
      if (cachedData) {
        const cacheTime = Date.now() - startTime;
        console.log(`🎯 Cache HIT: ${cacheKey} (${cacheTime}ms)`);
        
        return res.json({
          ...cachedData,
          cached: true,
          cacheTimestamp: new Date().toISOString(),
          dataSource: 'redis',
          responseTime: `${cacheTime}ms`
        });
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original res.json method
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function(data) {
        const dbTime = Date.now() - startTime;
        
        // Only cache successful responses
        if (res.statusCode === 200 && data.success !== false) {
          redisManager.set(cacheKey, data, ttl).then(() => {
            console.log(`✅ Cache SET: ${cacheKey}`);
          }).catch(err => {
            console.error(`❌ Cache SET error: ${err.message}`);
          });
          
          // Add metadata to response
          data.cached = false;
          data.dataSource = 'database';
          data.responseTime = `${dbTime}ms`;
          data.cachedUntil = new Date(Date.now() + (ttl * 1000)).toISOString();
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('❌ Cache middleware error:', error);
      next(); // Continue without caching if Redis fails
    }
  };
};

// Specific cache middlewares
export const tourPackagesCache = createCacheMiddleware({
  ttl: 600, // 10 minutes
  keyGenerator: (req) => `tour_packages:${req.query.page || 1}:${req.query.limit || 10}`,
  condition: (req) => !req.user || req.user.role !== 'admin' // Don't cache for admins
});

export const statsCache = createCacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: () => 'admin_stats',
  condition: (req) => req.user && req.user.role === 'admin'
});

export const publicDataCache = createCacheMiddleware({
  ttl: 1800, // 30 minutes
  keyGenerator: (req) => `public:${req.originalUrl}`,
  condition: () => true
});

// Cache invalidation helpers
export const invalidateCache = {
  // Invalidate tour packages cache
  tourPackages: async () => {
    // For Upstash, we'll need to delete specific keys since SCAN is not supported
    const keysToDelete = [
      'tour_packages:1:10',
      'tour_packages:1:20',
      'tour_packages:2:10',
      'tour_packages:2:20'
    ];
    
    for (const key of keysToDelete) {
      try {
        await redisManager.del(key);
      } catch (err) {
        console.error(`Failed to delete cache key ${key}:`, err.message);
      }
    }
    console.log('🗑️ Tour packages cache invalidated (specific keys)');
  },

  // Invalidate admin stats cache
  adminStats: async () => {
    await redisManager.del('admin_stats');
    console.log('🗑️ Admin stats cache invalidated');
  },

  // Invalidate public data cache
  publicData: async () => {
    // For Upstash, delete common public cache keys
    const keysToDelete = [
      'public:/api/tour-categories',
      'public:/api/tour-packages',
      'public:/api/featured-tours'
    ];
    
    for (const key of keysToDelete) {
      try {
        await redisManager.del(key);
      } catch (err) {
        console.error(`Failed to delete cache key ${key}:`, err.message);
      }
    }
    console.log('🗑️ Public data cache invalidated (specific keys)');
  },

  // Invalidate all cache
  all: async () => {
    console.log('⚠️ Full cache invalidation not supported on Upstash - clearing common keys');
    await invalidateCache.tourPackages();
    await invalidateCache.adminStats();
    await invalidateCache.publicData();
    console.log('🗑️ Common cache keys invalidated');
  }
};

// Middleware to invalidate cache after mutations
export const invalidateCacheAfter = (patterns = []) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override response methods to invalidate cache after successful operations
    const invalidateAfterResponse = async (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          if (typeof pattern === 'function') {
            await pattern(req, data);
          } else {
            await redisManager.invalidatePattern(pattern);
          }
        }
      }
    };

    res.json = function(data) {
      invalidateAfterResponse(data).catch(console.error);
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      invalidateAfterResponse(data).catch(console.error);
      return originalSend.call(this, data);
    };

    next();
  };
};

export default {
  createCacheMiddleware,
  tourPackagesCache,
  statsCache,
  publicDataCache,
  invalidateCache,
  invalidateCacheAfter
};