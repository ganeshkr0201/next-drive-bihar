import dotenv from 'dotenv';

// Load environment variables FIRST before importing other modules
dotenv.config();

// Set NODE_ENV if not set
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

// Validate critical environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    console.error('💡 Make sure to set these in your Render dashboard Environment tab');
    console.error('💡 JWT_SECRET is required for JWT authentication');
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
console.log(`🔐 Authentication: JWT-based (stateless)`);

import cors from 'cors';
import express from 'express'
import passport from 'passport';

// Import passport configuration for Google OAuth
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

// enabling cors - simplified for JWT
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
    credentials: false, // Not needed for JWT
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200 // For legacy browser support
}));

// Trust proxy for production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Initialize passport for Google OAuth (without sessions)
app.use(passport.initialize());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging for debugging in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')} - Auth: ${req.get('Authorization') ? 'Bearer ***' : 'None'}`);
        next();
    });
}

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