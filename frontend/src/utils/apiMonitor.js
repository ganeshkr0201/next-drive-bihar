// Global API call monitor to track and prevent excessive API calls
class ApiMonitor {
  constructor() {
    this.calls = new Map();
    this.isEnabled = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';
    this.maxCallsPerMinute = 50; // Increased from 30 to 50
    this.windowMs = 60000; // 1 minute
  }

  logCall(endpoint, method = 'GET') {
    if (!this.isEnabled) return;

    const now = Date.now();
    const key = `${method} ${endpoint}`;
    
    // Get existing calls
    const existingCalls = this.calls.get(key) || [];
    
    // Filter recent calls (last minute)
    const recentCalls = existingCalls.filter(timestamp => now - timestamp < this.windowMs);
    
    // Add current call
    recentCalls.push(now);
    this.calls.set(key, recentCalls);
    
    // Only log if there are many calls
    if (recentCalls.length > 10) {
      console.log(`📡 API Call: ${key} (${recentCalls.length} calls in last minute)`);
    }
    
    // Warn if too many calls (increased threshold)
    if (recentCalls.length > 20) {
      console.warn(`⚠️ High frequency API calls detected for ${key}: ${recentCalls.length} calls in last minute`);
    }
    
    // Check global call count less frequently
    if (recentCalls.length % 10 === 0) {
      this.checkGlobalCallCount();
    }
  }

  checkGlobalCallCount() {
    const now = Date.now();
    let totalRecentCalls = 0;
    
    for (const [endpoint, calls] of this.calls.entries()) {
      const recentCalls = calls.filter(timestamp => now - timestamp < this.windowMs);
      totalRecentCalls += recentCalls.length;
    }
    
    if (totalRecentCalls > this.maxCallsPerMinute) {
      console.error(`🚨 EXCESSIVE API USAGE: ${totalRecentCalls} calls in last minute (limit: ${this.maxCallsPerMinute})`);
      this.logTopEndpoints();
    }
  }

  logTopEndpoints() {
    const now = Date.now();
    const endpointCounts = new Map();
    
    for (const [endpoint, calls] of this.calls.entries()) {
      const recentCalls = calls.filter(timestamp => now - timestamp < this.windowMs);
      if (recentCalls.length > 0) {
        endpointCounts.set(endpoint, recentCalls.length);
      }
    }
    
    // Sort by call count
    const sortedEndpoints = Array.from(endpointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    console.table(sortedEndpoints.map(([endpoint, count]) => ({
      Endpoint: endpoint,
      'Calls (last minute)': count
    })));
  }

  getStats() {
    const now = Date.now();
    const stats = {
      totalEndpoints: this.calls.size,
      totalRecentCalls: 0,
      topEndpoints: []
    };
    
    const endpointCounts = new Map();
    
    for (const [endpoint, calls] of this.calls.entries()) {
      const recentCalls = calls.filter(timestamp => now - timestamp < this.windowMs);
      stats.totalRecentCalls += recentCalls.length;
      
      if (recentCalls.length > 0) {
        endpointCounts.set(endpoint, recentCalls.length);
      }
    }
    
    stats.topEndpoints = Array.from(endpointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }));
    
    return stats;
  }

  reset() {
    this.calls.clear();
    console.log('🔄 API monitor reset');
  }
}

// Global instance
export const apiMonitor = new ApiMonitor();

// Axios interceptor to automatically log API calls
export const setupApiMonitoring = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      apiMonitor.logCall(config.url, config.method?.toUpperCase());
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Development helper to check API usage
if (typeof window !== 'undefined') {
  window.apiMonitor = apiMonitor;
  window.checkApiUsage = () => {
    const stats = apiMonitor.getStats();
    console.log('📊 API Usage Stats:', stats);
    return stats;
  };
}