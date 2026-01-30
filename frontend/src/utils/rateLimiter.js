// Simple rate limiter to prevent excessive API calls
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.maxRequests = 10; // Max requests per minute
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
      console.warn(`Rate limit exceeded for ${key}. Max ${this.maxRequests} requests per minute.`);
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }

  reset(key) {
    this.requests.delete(key);
  }

  resetAll() {
    this.requests.clear();
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Wrapper function for API calls with rate limiting
export const withRateLimit = (key, apiCall) => {
  return async (...args) => {
    if (!rateLimiter.canMakeRequest(key)) {
      throw new Error(`Rate limit exceeded for ${key}. Please wait before making more requests.`);
    }
    
    return await apiCall(...args);
  };
};