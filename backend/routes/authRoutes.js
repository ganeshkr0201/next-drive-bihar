import express from 'express';
import { avatarUpload } from '../config/cloudinary.js';
import { authenticateJWT } from '../middlewares/auth.js';
import * as authControllers from '../controllers/authControllers.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', authControllers.register);  
router.post('/login', authControllers.login);
router.post('/resend-otp', authControllers.resendOtp);
router.post('/verify-otp', authControllers.verifyOtp);
router.post('/refresh-token', authControllers.refreshToken);

// Test email endpoint (for debugging)
router.post('/test-email', authControllers.testEmail);

// Google OAuth routes (temporarily disabled)
router.get('/google', authControllers.google);
router.get('/google/callback', authControllers.googleCallback);

// Protected routes (require JWT authentication)
router.get('/me', authenticateJWT, authControllers.getCurrentUser);
router.put('/profile', authenticateJWT, avatarUpload.single('avatar'), authControllers.userProfile);
router.delete('/delete-account', authenticateJWT, authControllers.deleteAccount);

// Logout route (client-side token removal)
router.post('/logout', authControllers.logout);

export default router;