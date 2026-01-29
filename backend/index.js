import dotenv from 'dotenv';
dotenv.config();

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
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// enabling cors
app.use(cors({
    origin: [
        CLIENT_URL,                          
        'http://localhost:5173',                    // Development frontend (Vite default)
        'http://localhost:5174',                    // Alternative dev port
        'http://localhost:4000',                    // Backend port (for testing)
        'http://127.0.0.1:5173',                    // Alternative localhost format
        'http://127.0.0.1:5174',                    // Alternative localhost format
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
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')} - Auth: ${req.get('Authorization') ? 'Bearer ***' : 'None'}`);
    next();
});


// ROUTES
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "NextDrive Bihar API is working",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api/notifications', notificationRoutes);


app.listen(PORT, () => {
    console.log(`🚀 NextDrive Bihar Backend Server running on port: ${PORT}`);
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`🌐 Client URL: ${CLIENT_URL}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.MONGO_URI ? 'Connected' : 'Not configured'}`);
});