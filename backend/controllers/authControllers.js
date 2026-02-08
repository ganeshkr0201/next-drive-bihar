import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import passport from 'passport';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';
import { generateOTP } from '../utils/generateOtp.js';
import { cloudinaryUtils } from '../config/cloudinary.js';
import { generateTokenPair, verifyToken } from '../utils/jwt.js';
import redisOTPManager from '../utils/redisOtp.js';
import { formatPhoneNumber } from '../utils/phoneFormatter.js';



export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Name, email, and password are required" 
            });
        }

        const userExist = await User.findOne({email});
        if(userExist) {
            if (!userExist.isVerified) {
                return res.status(400).json({ 
                    success: false,
                    message: "Please check your email for verification code.",
                    requiresVerification: true,
                    email: userExist.email
                });
            }
            
            return res.status(400).json({ 
                success: false,
                message: "User already exists with this email. Please login." 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate and store OTP in Redis
        const otpResult = await redisOTPManager.generateAndStoreOTP(email);
        
        if (!otpResult.success) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate verification code. Please try again."
            });
        }

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            // Remove MongoDB OTP fields since we're using Redis
            isVerified: false
        });

        try {
            await sendEmail(
                email,
                "Verify Your Email – NextDrive Bihar",
                `Hello ${user.name},

                Thank you for registering with NextDrive Bihar.
                Your OTP for email verification is: ${otpResult.otp}
                This OTP is valid for 10 minutes.

                Best regards,
                NextDrive Bihar Team`,
                `<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px">
                    <div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:8px">
                        <h2 style="color:#1e293b; text-align:center;">Email Verification</h2>
                        <p>Hello <strong>${user.name}</strong>,</p>
                        <p>Thank you for registering with <strong>NextDrive Bihar</strong>. Please use the OTP below to verify your email address.</p>
                        <div style="text-align:center; margin:30px 0;">
                            <span style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#2563eb;">${otpResult.otp}</span>
                        </div>
                        <p style="color:#475569;">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
                        <p style="font-size:14px; color:#64748b;">If you did not request this verification, you can safely ignore this email.</p>
                        <hr />
                        <p style="font-size:12px; color:#94a3b8; text-align:center;">© ${new Date().getFullYear()} NextDrive Bihar. All rights reserved.</p>
                    </div>
                </div>`
            );
            
        } catch (emailError) {
            const userResponse = {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                authProvider: user.authProvider,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            };

            return res.status(201).json({ 
                success: true,
                message: "Registration successful! However, there was an issue sending the verification email. Please use 'Resend OTP' to get your verification code.", 
                user: userResponse,
                requiresVerification: true,
                emailIssue: true
            });
        }

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider,
            isVerified: user.isVerified,
            createdAt: user.createdAt
        };

        res.status(201).json({ 
            success: true,
            message: "Registration successful! Please check your email for verification code.", 
            user: userResponse,
            requiresVerification: true
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: "Registration failed. Please try again." 
        });
    }
}


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if user has a password (not Google OAuth only)
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: "Please login using Google"
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            console.log('⚠️ Login attempt with unverified email:', email);
            
            // Automatically send verification email if user tries to login without verification
            try {
                // Check if we can resend OTP using Redis rate limiting
                const canResend = await redisOTPManager.canResendOTP(email);
                
                let emailSent = false;
                let emailError = null;

                if (canResend.canResend) {
                    // Generate and store OTP in Redis
                    const otpResult = await redisOTPManager.generateAndStoreOTP(email);
                    
                    if (otpResult.success) {
                        // Set resend cooldown
                        await redisOTPManager.setResendCooldown(email);

                        console.log('📧 Sending verification email during login attempt...');

                        try {
                            await sendEmail(
                                email,
                                "Verify Your Email – NextDrive Bihar",
                                `Hello ${user.name},

                                You tried to login but your email is not verified yet.

                                Your OTP for email verification is: ${otpResult.otp}

                                This OTP is valid for 10 minutes.
                                Please do not share this code with anyone.

                                Best regards,
                                NextDrive Bihar Team`,
                                `
                                <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px">
                                    <div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:8px">
                                    <h2 style="color:#1e293b; text-align:center;">Email Verification Required</h2>
                                    <p>Hello <strong>${user.name}</strong>,</p>
                                    <p>You tried to login but your email is not verified yet. Please use the OTP below to verify your email address.</p>
                                    <div style="text-align:center; margin:30px 0;">
                                        <span style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#2563eb;">${otp}</span>
                                    </div>
                                    <p style="color:#475569;">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
                                    <hr />
                                    <p style="font-size:12px; color:#94a3b8; text-align:center;">© ${new Date().getFullYear()} NextDrive Bihar. All rights reserved.</p>
                                </div>
                            </div>`
                        );
                        
                                        emailSent = true;
                                        console.log('✅ Verification email sent successfully during login');
                                        
                                    } catch (emailSendError) {
                                        console.error('❌ Failed to send verification email during login:', emailSendError);
                                        emailError = emailSendError.message;
                                    }
                                } else {
                                    console.log('❌ Failed to generate OTP:', otpResult.error);
                                    emailError = 'Failed to generate verification code';
                                }
                            } else {
                                console.log(`⏳ Rate limited: ${canResend.cooldownRemaining}s remaining`);
                            }

                            return res.status(403).json({
                                success: false,
                                message: emailSent 
                                    ? "Please verify your email before logging in. We've sent a new verification code to your email."
                                    : canResend.canResend 
                                        ? "Please verify your email before logging in. Use the 'Resend OTP' button if you need a verification code."
                                        : `Please verify your email before logging in. You can request a new OTP in ${canResend.cooldownRemaining} seconds.`,
                                requiresVerification: true,
                                email: user.email,
                                emailSent,
                                emailError: emailError || undefined,
                                cooldownRemaining: canResend.cooldownRemaining || 0
                            });
                
            } catch (otpError) {
                console.error('❌ Error handling unverified login:', otpError);
                
                return res.status(403).json({
                    success: false,
                    message: "Please verify your email before logging in. Use the 'Resend OTP' button to get a verification code.",
                    requiresVerification: true,
                    email: user.email,
                    emailSent: false,
                    emailError: "Failed to send verification email automatically"
                });
            }
        }

        // Generate JWT tokens
        const tokens = generateTokenPair(user);

        // Return user data without sensitive information
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider,
            avatar: user.avatar,
            avatarPublicId: user.avatarPublicId,
            phone: user.phone,
            address: user.address,
            dateOfBirth: user.dateOfBirth,
            bio: user.bio,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            success: true,
            message: "Login successful",
            user: userResponse,
            tokens
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
}


export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: "Email is required" 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        if (user.isVerified) {
            return res.status(400).json({ 
                success: false,
                message: "User is already verified" 
            });
        }

        // Check resend cooldown using Redis
        const cooldownCheck = await redisOTPManager.canResendOTP(email);
        if (!cooldownCheck.canResend) {
            return res.status(429).json({ 
                success: false,
                message: cooldownCheck.message
            });
        }

        // Generate and store new OTP in Redis
        const otpResult = await redisOTPManager.generateAndStoreOTP(email);
        
        if (!otpResult.success) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate verification code. Please try again."
            });
        }

        // Set resend cooldown
        await redisOTPManager.setResendCooldown(email);

        // Send OTP email
        try {
            await sendEmail(
                email,
                "Verify Your Email – NextDrive Bihar",

                // ✅ TEXT VERSION (fallback)
                `Hello ${user.name},

                Thank you for registering with NextDrive Bihar.

                Your OTP for email verification is: ${otpResult.otp}

                This OTP is valid for 10 minutes.
                Please do not share this code with anyone.

                If you did not request this verification, please ignore this email.

                Best regards,
                NextDrive Bihar Team
                `,

                // ✅ HTML VERSION (rich email)
                `
                <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px">
                    <div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:8px">

                    <h2 style="color:#1e293b; text-align:center;">
                        Email Verification
                    </h2>

                    <p>Hello <strong>${user.name}</strong>,</p>

                    <p>
                        Thank you for registering with <strong>NextDrive Bihar</strong>.
                        Please use the OTP below to verify your email address.
                    </p>

                    <div style="text-align:center; margin:30px 0;">
                        <span style="
                        font-size:32px;
                        font-weight:bold;
                        letter-spacing:6px;
                        color:#2563eb;
                        ">
                        ${otpResult.otp}
                        </span>
                    </div>

                    <p style="color:#475569;">
                        This OTP is valid for <strong>10 minutes</strong>.
                        Do not share this code with anyone.
                    </p>

                    <p style="font-size:14px; color:#64748b;">
                        If you did not request this verification, you can safely ignore this email.
                    </p>

                    <hr />

                    <p style="font-size:12px; color:#94a3b8; text-align:center;">
                        © ${new Date().getFullYear()} NextDrive Bihar. All rights reserved.
                    </p>

                    </div>
                </div>
                `
                );


            res.status(200).json({ 
                success: true,
                message: "Verification code sent successfully!" 
            });
        } catch (emailError) {
            console.error('❌ Resend email failed:', emailError);
            res.status(500).json({ 
                success: false,
                message: "Failed to send verification email. Please try again.",
                emailError: emailError.message
            });
        }

    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        res.status(500).json({ 
            success: false,
            message: "Failed to resend OTP. Please try again." 
        });
    }
}




// Google OAuth with JWT implementation
export const google = (req, res, next) => {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(501).json({
            success: false,
            message: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
        });
    }
    
    // Use passport for Google OAuth
    passport.authenticate("google", { scope: ["profile", "email"]})(req, res, next);
}

export const googleCallback = (req, res, next) => {
    passport.authenticate("google", { 
        failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
        session: false // Important: disable session for JWT
    }, (err, user, info) => {
        if (err) {
            console.error('Google OAuth error:', err);
            return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
        }
        
        if (!user) {
            console.error('Google OAuth failed:', info);
            return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
        }
        
        try {
            // Generate JWT tokens for the authenticated user
            const tokens = generateTokenPair(user);
            
            // Redirect to frontend with tokens as URL parameters (temporary)
            // Frontend will extract tokens and store them properly
            const redirectUrl = `${process.env.CLIENT_URL}/auth/google/success?` +
                `accessToken=${encodeURIComponent(tokens.accessToken)}&` +
                `refreshToken=${encodeURIComponent(tokens.refreshToken)}&` +
                `user=${encodeURIComponent(JSON.stringify({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    authProvider: user.authProvider,
                    avatar: user.avatar,
                    isVerified: user.isVerified
                }))}`;
            
            res.redirect(redirectUrl);
        } catch (tokenError) {
            console.error('JWT token generation error:', tokenError);
            res.redirect(`${process.env.CLIENT_URL}/login?error=token_generation_failed`);
        }
    })(req, res, next);
}

// // Google OAuth success handler (for compatibility with route)
// export const googleSuccess = (req, res) => {
//     // This endpoint is no longer used with JWT implementation
//     // Redirect is handled in googleCallback
//     res.redirect(`${process.env.CLIENT_URL}/login?error=deprecated_endpoint`);
// }

// Token refresh endpoint
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        // Verify refresh token
        const decoded = verifyToken(refreshToken);
        
        // Get user from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isVerified) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        // Generate new token pair
        const tokens = generateTokenPair(user);

        res.json({
            success: true,
            message: "Tokens refreshed successfully",
            tokens
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token"
        });
    }
}

export const logout = (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    // Server-side logout would require token blacklisting (optional)
    res.json({ 
        success: true,
        message: "Logged out successfully" 
    });
}


export const verifyOtp = async (req, res) => {
    try {
        const { email, otp, autoLogin } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ 
                success: false,
                message: "Email and OTP are required" 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        if (user.isVerified) {
            return res.status(400).json({ 
                success: false,
                message: "User is already verified" 
            });
        }

        // Verify OTP using Redis
        const verificationResult = await redisOTPManager.verifyOTP(email, otp);

        if (!verificationResult.success) {
            const statusCode = verificationResult.code === 'OTP_NOT_FOUND' ? 400 : 
                              verificationResult.code === 'MAX_ATTEMPTS_EXCEEDED' ? 429 : 400;
            
            return res.status(statusCode).json({ 
                success: false,
                message: verificationResult.error,
                code: verificationResult.code,
                remainingAttempts: verificationResult.remainingAttempts
            });
        }

        // Mark user as verified
        user.isVerified = true;
        await user.save();

        console.log(`✅ User ${email} verified successfully`);

        // Prepare user response
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider,
            avatar: user.avatar,
            isVerified: user.isVerified,
            createdAt: user.createdAt
        };

        // If autoLogin is requested, generate JWT tokens
        if (autoLogin) {
            const tokens = generateTokenPair(user);
            
            return res.status(200).json({ 
                success: true,
                message: "Email verified and logged in successfully!",
                verified: true,
                autoLogin: true,
                user: userResponse,
                tokens
            });
        } else {
            res.status(200).json({ 
                success: true,
                message: "Email verified successfully! You can now login.",
                verified: true,
                user: userResponse
            });
        }

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ 
            success: false,
            message: "Verification failed. Please try again." 
        });
    }
}


export const getCurrentUser = (req, res) => {
    if (req.user) {
        res.json({ 
            success: true, 
            user: req.user 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: "Not authenticated" 
        });
    }
}


export const userProfile = async (req, res) => {
    try { 
        // JWT middleware ensures req.user is available
        const userId = req.user._id;
        const { name, phone, address, dateOfBirth, bio } = req.body;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Update user fields
        if (name) user.name = name;
        if (phone !== undefined) user.phone = formatPhoneNumber(phone);
        if (address !== undefined) user.address = address;
        if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
        if (bio !== undefined) user.bio = bio;

        // Handle avatar upload if file is provided
        if (req.file) {
            try {
                // Delete old avatar from Cloudinary if exists
                if (user.avatarPublicId) {
                    await cloudinaryUtils.deleteImage(user.avatarPublicId);
                    console.log('🗑️ Deleted old avatar from Cloudinary');
                }

                // Set new avatar URL and public_id from Cloudinary upload
                user.avatar = req.file.path; // Cloudinary URL
                user.avatarPublicId = req.file.filename; // Cloudinary public_id
                console.log('✅ New avatar uploaded to Cloudinary:', req.file.path);
            } catch (cloudinaryError) {
                console.error('❌ Cloudinary avatar upload error:', cloudinaryError);
                return res.status(500).json({ 
                    success: false,
                    message: "Failed to upload avatar. Please try again." 
                });
            }
        }

        await user.save();
        console.log('✅ User updated successfully');

        // Return updated user (excluding sensitive data)
        const updatedUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider,
            avatar: user.avatar,
            avatarPublicId: user.avatarPublicId,
            phone: user.phone,
            address: user.address,
            dateOfBirth: user.dateOfBirth,
            bio: user.bio,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({ 
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error('❌ Profile update error:', error);
        res.status(500).json({ 
            success: false,
            message: "Failed to update profile. Please try again." 
        });
    }
}


export const deleteAccount = async (req, res) => {
    try {
        // JWT middleware ensures req.user is available
        const userId = req.user._id;
        const { password, confirmText } = req.body;

        // Validate confirmation text
        if (confirmText !== 'DELETE MY ACCOUNT') {
            return res.status(400).json({
                success: false,
                message: 'Please type "DELETE MY ACCOUNT" to confirm account deletion'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Prevent admin from deleting their account through this route
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin accounts cannot be self-deleted. Please contact system administrator.'
            });
        }

        // Verify password for local auth users
        if (user.authProvider === 'local' && password) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid password'
                });
            }
        }

        // Get user statistics before deletion for response
        const [tourBookings, carBookings, queries, notifications] = await Promise.all([
            mongoose.model('Booking').countDocuments({ user: userId }),
            mongoose.model('CarBooking').countDocuments({ user: userId }),
            mongoose.model('Query').countDocuments({ user: userId }),
            mongoose.model('Notification').countDocuments({ 
                $or: [
                    { recipient: userId },
                    { sender: userId }
                ]
            })
        ]);

        // Delete user account (cascade delete will handle all related data)
        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'Your account and all associated data have been permanently deleted',
            deletedData: {
                tourBookings,
                carBookings,
                queries,
                notifications,
                avatar: user.avatar ? 'Yes' : 'No'
            }
        });

    } catch (error) {
        console.error('❌ Account deletion error:', error);
        res.status(500).json({ 
            success: false,
            message: "Failed to delete account. Please try again." 
        });
    }
}

// Test email endpoint for debugging
export const testEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        console.log('🧪 Testing email service for:', email);

        // Test email sending
        await sendEmail(
            email,
            "Test Email - NextDrive Bihar",
            "This is a test email to verify email service is working.",
            `
            <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px">
                <div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:8px">
                    <h2 style="color:#1e293b; text-align:center;">Email Service Test</h2>
                    <p>This is a test email to verify that the email service is working correctly.</p>
                    <p>If you received this email, the email service is functioning properly.</p>
                    <p style="color:#475569;">Timestamp: ${new Date().toISOString()}</p>
                    <hr />
                    <p style="font-size:12px; color:#94a3b8; text-align:center;">© ${new Date().getFullYear()} NextDrive Bihar. All rights reserved.</p>
                </div>
            </div>
            `
        );

        console.log('✅ Test email sent successfully');

        res.json({
            success: true,
            message: "Test email sent successfully! Check your inbox."
        });

    } catch (error) {
        console.error('❌ Test email failed:', error);
        res.status(500).json({
            success: false,
            message: "Test email failed",
            error: error.message
        });
    }
}