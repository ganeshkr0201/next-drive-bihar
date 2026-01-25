import express from 'express';
import { avatarUpload } from '../config/cloudinary.js';
import * as authControllers from '../controllers/authControllers.js';


const router = express.Router();



// Register users
router.post('/register', authControllers.register);  

// Resend OTP route
router.post('/resend-otp', authControllers.resendOtp);

// Login users
router.post('/login', authControllers.login);

// Google authentication
router.get('/google', authControllers.google);
router.get('/google/callback', authControllers.googleCallback, authControllers.googleSuccess);

// Logout users
router.get('/logout', authControllers.logout);

// Verify OTP route
router.post('/verify-otp', authControllers.verifyOtp);

// Get current user session
router.get('/me', authControllers.getCurrentUser);

// Update user profile
router.put('/profile', avatarUpload.single('avatar'), authControllers.userProfile);

// Delete own account
router.delete('/delete-account', authControllers.deleteAccount);


export default router;