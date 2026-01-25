import dotenv from 'dotenv';
import MongoStore from 'connect-mongo';

// Load environment variables FIRST before importing other modules
dotenv.config();

// Set NODE_ENV if not set
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

// Validate critical environment variables
const requiredEnvVars = ['MONGO_URI', 'PASSPORT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    console.error('💡 Make sure to set these in your Render dashboard Environment tab');
} else {
    console.log('✅ Required environment variables loaded');
}

// Optional environment variables check
const optionalEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'CLIENT_URL'];
const missingOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);

if (missingOptionalVars.length > 0) {
    console.warn('⚠️ Missing optional environment variables:', missingOptionalVars);
    console.warn('💡 Some features (like Google OAuth) may not work');
}

console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'https://next-drive-bihar.vercel.app'}`);

import cors from 'cors';
import express from 'express'
import session from 'express-session';
import passport from 'passport';

import './config/passport.js'
import connectToDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// connecting database
connectToDB(process.env.MONGO_URI);

// Get client URL from environment or use default
const CLIENT_URL = process.env.CLIENT_URL || 'https://next-drive-bihar.vercel.app';

// enabling cors
app.use(cors({
    origin: [
        'https://next-drive-bihar.vercel.app',      // Production frontend (correct URL)
        'https://nextdrivebihar.vercel.app',        // Alternative frontend URL (if any)
        'https://next-drive-bihar.onrender.com',    // Production backend (for OAuth)
        CLIENT_URL,                                 // Dynamic client URL from env
        'http://localhost:5173',                    // Development frontend
        'http://localhost:5174',                    // Alternative dev port
        'http://localhost:3000'                     // Development backend
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Cookie',
        'X-Requested-With',
        'Accept',
        'Origin',
        'User-Agent',
        'DNT',
        'Cache-Control',
        'X-Mx-ReqToken',
        'Keep-Alive'
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false
}));

// Trust proxy for production (important for secure cookies behind reverse proxy)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Mobile-friendly session configuration
const sessionConfig = {
    secret: process.env.PASSPORT_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // Custom session name
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        touchAfter: 24 * 3600, // lazy session update
        ttl: 7 * 24 * 60 * 60 // 7 days
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: undefined // Remove domain restriction to allow cross-site cookies
    }
};

// Mobile-specific cookie configuration
if (process.env.NODE_ENV === 'production') {
    // For production, use 'none' for cross-site but with fallback
    sessionConfig.cookie.sameSite = 'none';
    sessionConfig.cookie.secure = true; // Required for sameSite: 'none'
} else {
    // For development, use 'lax' which works better locally
    sessionConfig.cookie.sameSite = 'lax';
    sessionConfig.cookie.secure = false;
}

// using express-session with mobile-friendly configuration
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

// Simplified mobile detection and logging
app.use((req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Add mobile detection to request object
    req.isMobile = isMobile;
    
    // Simple logging for debugging
    if (process.env.NODE_ENV === 'production') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')} - Mobile: ${isMobile}`);
    }
    
    next();
});

// Static file serving removed - now using Cloudinary for all images




// ROUTES
app.get('/', (req, res) => {
    res.send({
        success: "true",
        msg: "api working"
    })
})

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api/notifications', notificationRoutes);


app.listen(PORT, () => {
    console.log(`server running on port: ${PORT}`);
})