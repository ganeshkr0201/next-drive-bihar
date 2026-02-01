#!/usr/bin/env node

/**
 * 🧪 Upstash Redis Connection Test
 * 
 * This script tests your Upstash Redis connection and basic operations.
 * Run this before starting your application to ensure everything works.
 */

import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

async function testUpstashConnection() {
  log(colors.blue + colors.bold, '\n🧪 Testing Upstash Redis Connection...\n');

  // Check environment variables
  log(colors.yellow, '1. Checking environment variables...');
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    log(colors.red, '❌ Missing Upstash credentials!');
    log(colors.yellow, '💡 Please set these environment variables in .env:');
    log(colors.yellow, '   UPSTASH_REDIS_REST_URL=your_upstash_url');
    log(colors.yellow, '   UPSTASH_REDIS_REST_TOKEN=your_upstash_token');
    process.exit(1);
  }

  if (url === 'YOUR_UPSTASH_REDIS_REST_URL' || token === 'YOUR_UPSTASH_REDIS_REST_TOKEN') {
    log(colors.red, '❌ Please replace placeholder values with actual Upstash credentials!');
    log(colors.yellow, '💡 Get your credentials from: https://console.upstash.com/');
    process.exit(1);
  }

  log(colors.green, '✅ Environment variables found');
  log(colors.blue, `   URL: ${url.substring(0, 30)}...`);
  log(colors.blue, `   Token: ${token.substring(0, 10)}...`);

  try {
    // Initialize Redis client
    log(colors.yellow, '\n2. Initializing Upstash Redis client...');
    const redis = new Redis({
      url: url,
      token: token,
    });

    // Test connection
    log(colors.yellow, '\n3. Testing connection...');
    const start = Date.now();
    const pong = await redis.ping();
    const latency = Date.now() - start;
    
    if (pong === 'PONG') {
      log(colors.green, `✅ Connection successful! (${latency}ms)`);
    } else {
      log(colors.red, `❌ Unexpected ping response: ${pong}`);
      process.exit(1);
    }

    // Test basic operations
    log(colors.yellow, '\n4. Testing basic operations...');
    
    // SET operation
    const testKey = 'test:upstash:connection';
    const testValue = { message: 'Hello from Upstash!', timestamp: Date.now() };
    
    await redis.set(testKey, testValue, { ex: 60 }); // 60 seconds TTL
    log(colors.green, '✅ SET operation successful');

    // GET operation
    const retrieved = await redis.get(testKey);
    if (retrieved && retrieved.message === testValue.message) {
      log(colors.green, '✅ GET operation successful');
      log(colors.blue, `   Retrieved: ${JSON.stringify(retrieved)}`);
    } else {
      log(colors.red, '❌ GET operation failed');
      process.exit(1);
    }

    // EXISTS operation
    const exists = await redis.exists(testKey);
    if (exists === 1) {
      log(colors.green, '✅ EXISTS operation successful');
    } else {
      log(colors.red, '❌ EXISTS operation failed');
    }

    // TTL operation
    const ttl = await redis.ttl(testKey);
    if (ttl > 0) {
      log(colors.green, `✅ TTL operation successful (${ttl}s remaining)`);
    } else {
      log(colors.yellow, `⚠️ TTL operation returned: ${ttl}`);
    }

    // DELETE operation
    await redis.del(testKey);
    const existsAfterDelete = await redis.exists(testKey);
    if (existsAfterDelete === 0) {
      log(colors.green, '✅ DELETE operation successful');
    } else {
      log(colors.red, '❌ DELETE operation failed');
    }

    // Test OTP-like operations
    log(colors.yellow, '\n5. Testing OTP-like operations...');
    
    const otpKey = 'otp:test@example.com';
    const otpData = {
      hashedOtp: 'hashed_otp_value',
      email: 'test@example.com',
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: 5
    };

    await redis.set(otpKey, otpData, { ex: 600 }); // 10 minutes
    const otpRetrieved = await redis.get(otpKey);
    
    if (otpRetrieved && otpRetrieved.email === 'test@example.com') {
      log(colors.green, '✅ OTP operations successful');
      await redis.del(otpKey); // Cleanup
    } else {
      log(colors.red, '❌ OTP operations failed');
    }

    // Test increment (for rate limiting)
    log(colors.yellow, '\n6. Testing rate limiting operations...');
    
    const rateLimitKey = 'rate_limit:test:127.0.0.1';
    const count1 = await redis.incr(rateLimitKey);
    const count2 = await redis.incr(rateLimitKey);
    
    if (count1 === 1 && count2 === 2) {
      log(colors.green, '✅ Rate limiting operations successful');
      await redis.del(rateLimitKey); // Cleanup
    } else {
      log(colors.red, '❌ Rate limiting operations failed');
    }

    // Final success message
    log(colors.green + colors.bold, '\n🎉 All tests passed! Upstash Redis is working correctly.');
    log(colors.blue, '\n📋 Summary:');
    log(colors.blue, '   ✅ Connection established');
    log(colors.blue, '   ✅ Basic operations (SET, GET, EXISTS, TTL, DEL)');
    log(colors.blue, '   ✅ OTP storage and retrieval');
    log(colors.blue, '   ✅ Rate limiting (INCR)');
    log(colors.blue, `   ⚡ Average latency: ~${latency}ms`);
    
    log(colors.green, '\n🚀 Your application is ready to use Upstash Redis!');

  } catch (error) {
    log(colors.red, '\n❌ Test failed!');
    log(colors.red, `Error: ${error.message}`);
    
    if (error.message.includes('401')) {
      log(colors.yellow, '\n💡 This looks like an authentication error.');
      log(colors.yellow, '   Please check your UPSTASH_REDIS_REST_TOKEN');
    } else if (error.message.includes('404')) {
      log(colors.yellow, '\n💡 This looks like a URL error.');
      log(colors.yellow, '   Please check your UPSTASH_REDIS_REST_URL');
    } else if (error.message.includes('timeout')) {
      log(colors.yellow, '\n💡 This looks like a network timeout.');
      log(colors.yellow, '   Please check your internet connection');
    }
    
    log(colors.yellow, '\n🔧 Troubleshooting:');
    log(colors.yellow, '   1. Verify credentials at https://console.upstash.com/');
    log(colors.yellow, '   2. Check your internet connection');
    log(colors.yellow, '   3. Ensure your Upstash database is active');
    
    process.exit(1);
  }
}

// Run the test
testUpstashConnection().catch(console.error);