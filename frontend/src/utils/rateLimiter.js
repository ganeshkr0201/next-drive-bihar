// Simple rate limiter to prevent excessive API calls
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.maxRequests = 15; // Increased from 5 to 15 requests per minute
    this.windowMs = 60000; // 1 minute window
  }

  canMakeRequest(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this key
    const keyRequests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = keyRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if we're under the limit
    if (recentRequests.length >= this.maxRequests) {
      console.warn(`🚫 Rate limit exceeded for ${key}. Max ${this.maxRequests} requests per minute. Last request was ${Math.round((now - recentRequests[recentRequests.length - 1]) / 1000)}s ago.`);
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    // Only log if debug is enabled
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true') {
      console.log(`✅ Rate limit OK for ${key}: ${recentRequests.length}/${this.maxRequests} requests in last minute`);
    }
    return true;
  }

  reset(key) {
    this.requests.delete(key);
    console.log(`🔄 Rate limit reset for ${key}`);
  }

  resetAll() {
    this.requests.clear();
    console.log('🔄 All rate limits reset');
  }

  getStatus(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const keyRequests = this.requests.get(key) || [];
    const recentRequests = keyRequests.filter(timestamp => timestamp > windowStart);
    
    return {
      key,
      requestCount: recentRequests.length,
      maxRequests: this.maxRequests,
      canMakeRequest: recentRequests.length < this.maxRequests,
      nextAvailableIn: recentRequests.length >= this.maxRequests 
        ? Math.max(0, this.windowMs - (now - recentRequests[0]))
        : 0
    };
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Wrapper function for API calls with rate limiting
export const withRateLimit = (key, apiCall) => {
  return async (...args) => {
    // Bypass rate limiting for admin routes in development
    const isAdminRoute = key.startsWith('admin-');
    const isDevelopment = import.meta.env.DEV;
    
    if (isAdminRoute && isDevelopment) {
      console.log(`🚀 Bypassing rate limit for admin route: ${key}`);
      return await apiCall(...args);
    }
    
    if (!rateLimiter.canMakeRequest(key)) {
      throw new Error(`Rate limit exceeded for ${key}. Please wait before making more requests.`);
    }
    
    return await apiCall(...args);
  };
};