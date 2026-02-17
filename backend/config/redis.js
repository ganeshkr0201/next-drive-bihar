import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || "development";

dotenv.config({
  path: `.env.${env}`
});


class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.client) return this.client;

    try {
      this.client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      // Test the connection
      await this.client.ping();
      this.isConnected = true;
      
      console.log('✅ Upstash Redis connected successfully');
      return this.client;
      
    } catch (error) {
      console.error('❌ Upstash Redis connection failed:', error.message);
      console.error('💡 Please check your Upstash credentials and network connection');
      
      this.isConnected = false;
      this.client = null;
      throw error; // Don't continue without Redis
    }
  }

  async disconnect() {
    if (this.client) {
      // Upstash doesn't need explicit disconnect
      this.client = null;
      this.isConnected = false;
      console.log('👋 Upstash Redis disconnected');
    }
  }

  async get(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected. Please ensure Upstash Redis is properly configured.');
    }

    try {
      const value = await this.client.get(key);
      // Upstash returns parsed JSON automatically
      return value;
    } catch (err) {
      console.error('❌ Redis GET error:', err.message);
      throw err;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected) {
      throw new Error('Redis not connected. Please ensure Upstash Redis is properly configured.');
    }

    try {
      // Upstash handles JSON serialization automatically
      await this.client.set(key, value, { ex: ttlSeconds });
      return true;
    } catch (err) {
      console.error('❌ Redis SET error:', err.message);
      throw err;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected. Please ensure Upstash Redis is properly configured.');
    }

    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      console.error('❌ Redis DEL error:', err.message);
      throw err;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected. Please ensure Upstash Redis is properly configured.');
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      console.error('❌ Redis EXISTS error:', err.message);
      throw err;
    }
  }

  /* ==============================
     OTP Operations
     ============================== */

  async setOTP(email, otp, ttlSeconds = 600) {
    return this.set(`otp:${email}`, { otp, createdAt: Date.now() }, ttlSeconds);
  }

  async getOTP(email) {
    return this.get(`otp:${email}`);
  }

  async deleteOTP(email) {
    return this.del(`otp:${email}`);
  }

  /* ==============================
     Rate Limiting (Fixed Window)
     ============================== */

  async incrementRateLimit(key, windowSeconds = 60) {
    if (!this.isConnected) {
      throw new Error('Redis not connected. Please ensure Upstash Redis is properly configured.');
    }

    try {
      // Upstash increment
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, windowSeconds);
      }
      const ttl = await this.client.ttl(key);
      return { count, ttl };
    } catch (err) {
      console.error('❌ Rate limit error:', err.message);
      throw err;
    }
  }

  /* ==============================
     TTL Operations
     ============================== */

  async ttl(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected. Please ensure Upstash Redis is properly configured.');
    }

    try {
      return await this.client.ttl(key);
    } catch (err) {
      console.error('❌ Redis TTL error:', err.message);
      throw err;
    }
  }

  /* ==============================
     Cache Invalidation
     ============================== */

  async invalidatePattern(pattern) {
    // Upstash doesn't support SCAN command
    // For pattern invalidation, we'll need to track keys manually
    // or use specific key deletion
    console.warn(`⚠️ Pattern invalidation (${pattern}) not supported on Upstash Redis.`);
    console.warn('💡 Consider using specific key deletion or implementing key tracking.');
    return true;
  }

  /* ==============================
     Health Check
     ============================== */

  async healthCheck() {
    if (!this.isConnected) {
      return {
        status: 'disconnected',
        message: 'Upstash Redis not connected',
        provider: 'Upstash (Serverless)',
        type: 'upstash'
      };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      
      return {
        status: 'connected',
        latency: `${Date.now() - start}ms`,
        provider: 'Upstash (Serverless)',
        type: 'upstash',
        message: 'Upstash Redis is healthy'
      };
    } catch (err) {
      return {
        status: 'error',
        message: err.message,
        provider: 'Upstash (Serverless)',
        type: 'upstash'
      };
    }
  }
}

/* ==============================
   Singleton Export
   ============================== */

const redisManager = new RedisManager();
export default redisManager;
export { redisManager };
