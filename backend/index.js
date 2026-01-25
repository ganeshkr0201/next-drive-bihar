import dotenv from 'dotenv';

// Load environment variables FIRST before importing other modules
dotenv.config();

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
const PORT = process.env.PORT;


// connecting database
connectToDB(process.env.MONGO_URI);

// enabling cors
app.use(cors({
    origin: [
        'https://next-drive-bihar.vercel.app',      // Production frontend (correct URL)
        'https://nextdrivebihar.vercel.app',        // Alternative frontend URL (if any)
        'https://next-drive-bihar.onrender.com',    // Production backend (for OAuth)
        'http://localhost:5173',                    // Development frontend
        'http://localhost:5174',                    // Alternative dev port
        'http://localhost:3000'                     // Development backend
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}))


// using express-session
app.use(
    session({
        secret: process.env.PASSPORT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site in production
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

// Static file serving removed - now using Cloudinary for all images




// ROUTES
app.get('/', (req, res) => {
    res.send({
        success: "true",
        msg: "api working"
    })
})

// Debug endpoint to check environment variables (REMOVE IN PRODUCTION)
app.get('/debug/env', (req, res) => {
    res.json({
        CLIENT_URL: process.env.CLIENT_URL,
        GOOGLE_AUTH_CALLBACK: process.env.GOOGLE_AUTH_CALLBACK,
        NODE_ENV: process.env.NODE_ENV,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
    });
})

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api/notifications', notificationRoutes);


app.listen(PORT, () => {
    console.log(`server running on port: ${PORT}`);
})