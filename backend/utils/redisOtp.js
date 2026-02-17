import bcrypt from 'bcrypt';
import redisManager from '../config/redis.js';
import { generateOTP } from './generateOtp.js';

class RedisOTPManager {
  constructor() {
    this.defaultTTL = 600; // 10 minutes
    this.maxAttempts = 5;
    this.resendCooldown = 30; // 30 seconds
  }

  // Generate and store OTP in Redis
  async generateAndStoreOTP(email, customTTL = null) {
    try {
      const otp = generateOTP();
      const hashedOtp = await bcrypt.hash(otp, 10);
      const ttl = customTTL || this.defaultTTL;
      
      const otpData = {
        hashedOtp,
        email,
        createdAt: Date.now(),
        attempts: 0,
        maxAttempts: this.maxAttempts
      };

      // Store OTP in Redis
      const success = await redisManager.set(`otp:${email}`, otpData, ttl);
      
      if (success) {
        console.log(`✅ OTP generated and stored for ${email} (TTL: ${ttl}s)`);
        return { otp, ttl, success: true };
      } else {
        throw new Error('Failed to store OTP in Redis');
      }
    } catch (error) {
      console.error('❌ OTP generation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify OTP from Redis
  async verifyOTP(email, providedOtp) {
    try {
      const otpData = await redisManager.get(`otp:${email}`);
      
      if (!otpData) {
        return {
          success: false,
          error: 'OTP not found or expired',
          code: 'OTP_NOT_FOUND'
        };
      }

      // Check if max attempts exceeded
      if (otpData.attempts >= otpData.maxAttempts) {
        await redisManager.del(`otp:${email}`);
        return {
          success: false,
          error: 'Maximum OTP verification attempts exceeded',
          code: 'MAX_ATTEMPTS_EXCEEDED'
        };
      }

      // Verify OTP
      const isValid = await bcrypt.compare(providedOtp, otpData.hashedOtp);
      
      if (isValid) {
        // OTP is valid, remove from Redis
        await redisManager.del(`otp:${email}`);
        console.log(`✅ OTP verified successfully for ${email}`);
        
        return {
          success: true,
          message: 'OTP verified successfully'
        };
      } else {
        // Increment attempt count
        otpData.attempts += 1;
        const remainingTTL = await redisManager.ttl(`otp:${email}`);
        await redisManager.set(`otp:${email}`, otpData, remainingTTL > 0 ? remainingTTL : this.defaultTTL);
        
        const remainingAttempts = otpData.maxAttempts - otpData.attempts;
        
        return {
          success: false,
          error: `Invalid OTP. ${remainingAttempts} attempts remaining`,
          code: 'INVALID_OTP',
          remainingAttempts
        };
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      return {
        success: false,
        error: 'OTP verification failed',
        code: 'VERIFICATION_ERROR'
      };
    }
  }

  // Check if OTP exists and get info
  async getOTPInfo(email) {
    try {
      const otpData = await redisManager.get(`otp:${email}`);
      
      if (!otpData) {
        return { exists: false };
      }

      const ttl = await redisManager.ttl(`otp:${email}`);
      
      return {
        exists: true,
        createdAt: otpData.createdAt,
        attempts: otpData.attempts,
        maxAttempts: otpData.maxAttempts,
        remainingAttempts: otpData.maxAttempts - otpData.attempts,
        ttl: ttl > 0 ? ttl : 0,
        expiresAt: new Date(Date.now() + (ttl * 1000))
      };
    } catch (error) {
      console.error('❌ Get OTP info error:', error);
      return { exists: false, error: error.message };
    }
  }

  // Check resend cooldown
  async canResendOTP(email) {
    try {
      const lastSentKey = `otp_last_sent:${email}`;
      const lastSent = await redisManager.get(lastSentKey);
      
      if (!lastSent) {
        return { canResend: true };
      }

      const timeDiff = Date.now() - lastSent.timestamp;
      const cooldownRemaining = this.resendCooldown * 1000 - timeDiff;
      
      if (cooldownRemaining > 0) {
        return {
          canResend: false,
          cooldownRemaining: Math.ceil(cooldownRemaining / 1000),
          message: `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting another OTP`
        };
      }

      return { canResend: true };
    } catch (error) {
      console.error('❌ Resend cooldown check error:', error);
      return { canResend: true }; // Allow resend if check fails
    }
  }

  // Set resend cooldown
  async setResendCooldown(email) {
    try {
      const lastSentKey = `otp_last_sent:${email}`;
      await redisManager.set(lastSentKey, { timestamp: Date.now() }, this.resendCooldown);
      return true;
    } catch (error) {
      console.error('❌ Set resend cooldown error:', error);
      return false;
    }
  }

  // Delete OTP (for cleanup)
  async deleteOTP(email) {
    try {
      await redisManager.del(`otp:${email}`);
      await redisManager.del(`otp_last_sent:${email}`);
      console.log(`🗑️ OTP data deleted for ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Delete OTP error:', error);
      return false;
    }
  }

  // Get OTP statistics
  async getOTPStats() {
    try {
      // Note: This method has limited functionality on Upstash
      // since it doesn't support KEYS command
      return {
        activeOTPs: 'N/A (Upstash limitation)',
        activeCooldowns: 'N/A (Upstash limitation)',
        totalOTPOperations: 'N/A (Upstash limitation)',
        note: 'OTP statistics not available on Upstash Redis'
      };
    } catch (error) {
      console.error('❌ Get OTP stats error:', error);
      return {
        activeOTPs: 0,
        activeCooldowns: 0,
        totalOTPOperations: 0,
        error: error.message
      };
    }
  }

  // Cleanup expired OTPs (maintenance function)
  async cleanupExpiredOTPs() {
    try {
      // Note: This method has limited functionality on Upstash
      console.log('🧹 OTP cleanup not needed on Upstash (automatic TTL handling)');
      return { cleanedCount: 0, note: 'Upstash handles TTL automatically' };
    } catch (error) {
      console.error('❌ OTP cleanup error:', error);
      return { cleanedCount: 0, error: error.message };
    }
  }
}

// Create singleton instance
const redisOTPManager = new RedisOTPManager();

export default redisOTPManager;
export { redisOTPManager };