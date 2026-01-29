// Minimal test server to debug connection issues
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001; // Use different port to avoid conflicts

// Enable CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json());

// Simple test routes
app.get('/', (req, res) => {
    console.log('📥 Received request to /');
    res.json({
        success: true,
        message: "Test server is working!",
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    console.log('📥 Received request to /health');
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/tour-packages', (req, res) => {
    console.log('📥 Received request to /api/tour-packages');
    res.json({
        success: true,
        data: [
            {
                _id: "test1",
                title: "Test Tour Package",
                description: "This is a test tour package",
                price: 5000,
                duration: "3 days",
                images: []
            }
        ]
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`🧪 Test server running on port: ${PORT}`);
    console.log(`📍 Test server URL: http://localhost:${PORT}`);
    console.log('🔍 Try: curl http://localhost:3001/health');
});