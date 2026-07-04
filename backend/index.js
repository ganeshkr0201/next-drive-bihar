import dotenv from "dotenv";

const env = process.env.NODE_ENV || "development";

dotenv.config({
  path: env === "production" ? ".env" : `.env.${env}`,
});

console.log("NODE_ENV:", process.env.NODE_ENV);

// ⚠️  All imports below are hoisted in ES modules and run BEFORE the code above.
// The fix: passport.js reads env vars lazily (inside the if-block at call time,
// not at module parse time), so it works correctly as long as we call
// initializePassport() explicitly here AFTER dotenv has loaded.

import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './models/User.js';

import connectToDB from './config/database.js';
import redisManager from './config/redis.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import carRoutes from './routes/carRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import { generateTokenPair } from './utils/jwt.js';

// Register Google strategy HERE — after dotenv.config() has run
// (static imports are hoisted, but this function call is not)
const initializePassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_AUTH_CALLBACK) {
    console.warn('⚠️ Google OAuth not configured - missing environment variables');
    console.warn('  GOOGLE_CLIENT_ID:', !!process.env.GOOGLE_CLIENT_ID);
    console.warn('  GOOGLE_CLIENT_SECRET:', !!process.env.GOOGLE_CLIENT_SECRET);
    console.warn('  GOOGLE_AUTH_CALLBACK:', process.env.GOOGLE_AUTH_CALLBACK);
    return;
  }

  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_AUTH_CALLBACK,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            user.authProvider = 'google';
            if (!user.avatar && profile.photos?.[0]) user.avatar = profile.photos[0].value;
            await user.save();
          }
          return done(null, user);
        }
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          authProvider: 'google',
          avatar: profile.photos?.[0]?.value || null,
          isVerified: true,
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
  console.log('✅ Google OAuth strategy registered with callback:', process.env.GOOGLE_AUTH_CALLBACK);
};

initializePassport();

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize services
const initializeServices = async () => {
  try {
    // Connect to database
    await connectToDB(process.env.MONGO_URI);

    // Initialize Redis connection
    await redisManager.connect();
    console.log('🎯 Redis initialized successfully');
  } catch (error) {
    console.warn('⚠️ Service initialization failed:', error.message);
    console.warn('⚠️ Continuing without Redis cache - performance may be affected');
  }
};

// Get client URL from environment or use default
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// enabling cors
app.use(cors({
    origin: [
        CLIENT_URL,                          
        'http://localhost:5173',                    // Development frontend (Vite default)
        'http://localhost:5174',                    // Alternative dev port
        'http://localhost:4000',                    // Backend port (for testing)
        'https://nextdrivebihar.com',      // Production frontend URL (Vercel)
        'https://www.nextdrivebihar.com',  // Production frontend URL with www (if applicable)
    ],
    credentials: false, // Not needed for JWT
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200 // For legacy browser support
}));

// Trust proxy for production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    app.use(helmet());
}

// Initialize passport for Google OAuth
app.use(passport.initialize());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ROUTES
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "NextDrive Bihar API is working",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        redis: redisManager.isConnected ? 'Connected' : 'Disconnected'
    });
});

// Health check endpoint with Redis status
app.get('/health', async (req, res) => {
    const redisHealth = await redisManager.healthCheck();
    
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        redis: redisHealth,
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
    });
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/drivers', driverRoutes);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    await redisManager.disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    await redisManager.disconnect();
    process.exit(0);
});

// Start server immediately — services initialize in background (non-blocking)
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`🌐 Client URL: ${CLIENT_URL}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

initializeServices().catch(err => {
    console.error("Service init failed:", err);
});