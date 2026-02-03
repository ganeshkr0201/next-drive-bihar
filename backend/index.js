import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express'
import passport from 'passport';

// Import passport configuration for Google OAuth
import './config/passport.js'

import connectToDB from './config/database.js';
import redisManager from './config/redis.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize services
const initializeServices = async () => {
  try {
    // Connect to database
    await connectToDB(process.env.MONGO_URI);
    console.log('✅ Database connected successfully');

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
        'https://next-drive-bihar.vercel.app',       // Production frontend URL
        'https://www.next-drive-bihar.vercel.app',   // Production frontend URL with www
    ],
    credentials: false, // Not needed for JWT
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200 // For legacy browser support
}));

// Trust proxy for production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
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

// Initialize services and start server
const startServer = async () => {
    await initializeServices();
    
    app.listen(PORT, () => {
        console.log(`🚀 NextDrive Bihar Backend Server running on port: ${PORT}`);
        console.log(`📍 Server URL: http://localhost:${PORT}`);
        console.log(`🌐 Client URL: ${CLIENT_URL}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Database: Connected`);
        console.log(`🎯 Redis: ${redisManager.isConnected ? 'Connected' : 'Disconnected'}`);
    });
};

startServer().catch(console.error);