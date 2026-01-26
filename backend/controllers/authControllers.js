import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import passport from 'passport';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';
import { generateOTP } from '../utils/generateOtp.js';
import { cloudinaryUtils } from '../config/cloudinary.js';
import { generateTokenPair, verifyToken } from '../utils/jwt.js';



export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        console.log('📝 Registration attempt for:', email);

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Name, email, and password are required" 
            });
        }

        const userExist = await User.findOne({email});
        if(userExist) {
            console.log('⚠️ User already exists:', email, 'Verified:', userExist.isVerified);
            
            // If user exists but is not verified, allow them to resend OTP
            if (!userExist.isVerified) {
                return res.status(400).json({ 
                    success: false,
                    message: "User already exists but email is not verified. Please check your email for verification code or request a new one.",
                    requiresVerification: true,
                    email: userExist.email
                });
            }
            
            return res.status(400).json({ 
                success: false,
                message: "User already exists with this email. Please login instead." 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        console.log('🔐 Creating user with OTP...');

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otpHash: hashedOtp,
            otpExpireAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            otpLastSentAt: new Date(),
            otpResendCount: 1 // Initialize count
        });

        console.log('✅ User created successfully:', user._id);

        // Send OTP email with better error handling
        try {
            console.log('📧 Sending verification email...');
            
            await sendEmail(
                email,
                "Verify Your Email – NextDrive Bihar",

                // ✅ TEXT VERSION (fallback)
                `Hello ${user.name},

                Thank you for registering with NextDrive Bihar.

                Your OTP for email verification is: ${otp}

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
                        ${otp}
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
            
            console.log('✅ Verification email sent successfully');
            
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            
            // Don't delete user, just inform about email issue
            // User can still verify later by requesting new OTP
            console.log('⚠️ User created but email failed. User can request new OTP.');
            
            // Return success but indicate email issue
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

        // Remove password from response
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
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: "Registration failed. Please try again." 
        });
    }
}



export const resendOtp = async (req, res) => {
    const requestId = `resend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        const { email } = req.body;

        console.log(`[${requestId}] 🔄 Resend OTP request initiated for:`, email);
        console.log(`[${requestId}] Request details:`, {
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            timestamp: new Date().toISOString()
        });

        if (!email) {
            console.log(`[${requestId}] ❌ Email validation failed: Email is required`);
            return res.status(400).json({ 
                success: false,
                message: "Email is required" 
            });
        }

        console.log(`[${requestId}] 🔍 Looking up user in database...`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`[${requestId}] ❌ User not found for email:`, email);
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        console.log(`[${requestId}] ✅ User found:`, {
            userId: user._id,
            name: user.name,
            isVerified: user.isVerified,
            otpResendCount: user.otpResendCount,
            lastOtpSent: user.otpLastSentAt
        });

        if (user.isVerified) {
            console.log(`[${requestId}] ⚠️ User is already verified`);
            return res.status(400).json({ 
                success: false,
                message: "User is already verified" 
            });
        }

        // Check if user can resend OTP (limit to prevent spam)
        const now = new Date();
        const lastSent = user.otpLastSentAt;
        const timeDiff = now - lastSent;
        const thirtySeconds = 30 * 1000; // Reduced from 1 minute to 30 seconds

        console.log(`[${requestId}] ⏱️ Rate limiting check:`, {
            now: now.toISOString(),
            lastSent: lastSent ? lastSent.toISOString() : 'never',
            timeDiffMs: timeDiff,
            requiredWaitMs: thirtySeconds,
            canResend: timeDiff >= thirtySeconds
        });

        if (timeDiff < thirtySeconds) {
            const waitTime = Math.ceil((thirtySeconds - timeDiff) / 1000);
            console.log(`[${requestId}] ❌ Rate limit exceeded. Wait time: ${waitTime}s`);
            return res.status(429).json({ 
                success: false,
                message: `Please wait ${waitTime} seconds before requesting another OTP`
            });
        }

        // Check resend count (max 10 per hour - increased from 5)
        console.log(`[${requestId}] 📊 Resend count check:`, {
            currentCount: user.otpResendCount,
            maxAllowed: 10,
            timeSinceLastSent: `${Math.floor(timeDiff / 1000)}s`
        });

        if (user.otpResendCount >= 10) {
            const oneHour = 60 * 60 * 1000;
            if (timeDiff < oneHour) {
                console.log(`[${requestId}] ❌ Maximum OTP requests reached. Count: ${user.otpResendCount}`);
                return res.status(429).json({ 
                    success: false,
                    message: "Maximum OTP requests reached. Please try again after an hour." 
                });
            } else {
                // Reset count after an hour
                console.log(`[${requestId}] 🔄 Resetting OTP count after 1 hour`);
                user.otpResendCount = 0;
            }
        }

        // Generate new OTP
        console.log(`[${requestId}] 🔐 Generating new OTP...`);
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        const oldOtpExpiry = user.otpExpireAt;
        user.otpHash = hashedOtp;
        user.otpExpireAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        user.otpLastSentAt = now;
        user.otpResendCount += 1;

        console.log(`[${requestId}] 💾 Updating user record:`, {
            oldExpiry: oldOtpExpiry ? new Date(oldOtpExpiry).toISOString() : 'none',
            newExpiry: new Date(user.otpExpireAt).toISOString(),
            newResendCount: user.otpResendCount
        });

        await user.save();
        console.log(`[${requestId}] ✅ User record updated successfully`);

        // Send OTP email with enhanced debugging
        try {
            console.log(`[${requestId}] 📧 Initiating email send...`);
            
            const emailResult = await sendEmail(
                email,
                "Verify Your Email – NextDrive Bihar",

                // ✅ TEXT VERSION (fallback)
                `Hello ${user.name},

                Thank you for registering with NextDrive Bihar.

                Your OTP for email verification is: ${otp}

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
                        ${otp}
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
            
            console.log(`[${requestId}] ✅ Email sent successfully:`, {
                messageId: emailResult.messageId,
                duration: emailResult.duration,
                success: emailResult.success
            });

            res.status(200).json({ 
                success: true,
                message: "OTP sent successfully! Please check your email.",
                debug: process.env.NODE_ENV === 'development' ? {
                    requestId: requestId,
                    emailResult: emailResult,
                    otpExpiry: new Date(user.otpExpireAt).toISOString()
                } : undefined
            });
            
        } catch (emailError) {
            console.error(`[${requestId}] ❌ Email sending failed:`, {
                error: emailError.message,
                category: emailError.category,
                originalError: emailError.originalError,
                duration: emailError.duration,
                stack: process.env.NODE_ENV === 'development' ? emailError.stack : 'Hidden in production'
            });

            // Return detailed error information
            res.status(500).json({ 
                success: false,
                message: "Failed to send OTP email. Please try again.",
                error: emailError.message,
                category: emailError.category,
                debug: process.env.NODE_ENV === 'development' ? {
                    requestId: requestId,
                    originalError: emailError.originalError,
                    duration: emailError.duration
                } : undefined
            });
        }
        
    } catch (error) {
        console.error(`[${requestId}] ❌ Resend OTP error:`, {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : 'Hidden in production'
        });
        
        res.status(500).json({ 
            success: false,
            message: "Failed to resend OTP. Please try again.",
            debug: process.env.NODE_ENV === 'development' ? {
                requestId: requestId,
                error: error.message
            } : undefined
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

        // Check if email is verified - TEMPORARILY COMMENTED OUT FOR TESTING
        /*
        if (!user.isVerified) {
            console.log('⚠️ Login attempt with unverified email:', email);
            
            // Automatically send verification email if user tries to login without verification
            try {
                // Check if we can send OTP (rate limiting)
                const now = new Date();
                const lastSent = user.otpLastSentAt;
                const timeDiff = lastSent ? now - lastSent : Infinity;
                const thirtySeconds = 30 * 1000;

                let emailSent = false;
                let emailError = null;

                // Only send email if enough time has passed or no OTP was sent before
                if (!lastSent || timeDiff >= thirtySeconds) {
                    // Generate new OTP
                    const otp = generateOTP();
                    const hashedOtp = await bcrypt.hash(otp, 10);

                    // Update user with new OTP
                    user.otpHash = hashedOtp;
                    user.otpExpireAt = Date.now() + 10 * 60 * 1000; // 10 minutes
                    user.otpLastSentAt = now;
                    user.otpResendCount = (user.otpResendCount || 0) + 1;

                    await user.save();

                    console.log('📧 Sending verification email during login attempt...');

                    try {
                        await sendEmail(
                            email,
                            "Verify Your Email – NextDrive Bihar",
                            `Hello ${user.name},

                            You tried to login but your email is not verified yet.

                            Your OTP for email verification is: ${otp}

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
                    const waitTime = Math.ceil((thirtySeconds - timeDiff) / 1000);
                    console.log(`⏳ Rate limited: ${waitTime}s remaining`);
                }

                return res.status(403).json({
                    success: false,
                    message: emailSent 
                        ? "Please verify your email before logging in. We've sent a new verification code to your email."
                        : "Please verify your email before logging in. Use the 'Resend OTP' button if you need a new verification code.",
                    requiresVerification: true,
                    email: user.email,
                    emailSent,
                    emailError: emailError || undefined
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
        */

        console.log('⚠️ EMAIL VERIFICATION TEMPORARILY DISABLED - Users can login without verification');
        if (!user.isVerified) {
            console.log('⚠️ User logging in without email verification:', email);
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

export const googleSuccess = (req, res) => {
    // This endpoint is no longer used with JWT implementation
    // Redirect is handled in googleCallback
    res.redirect(`${process.env.CLIENT_URL}/login?error=deprecated_endpoint`);
}

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
        const user = await User.findById(decoded.id).select('-password -otpHash');
        
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

        // Check if OTP has expired
        if (Date.now() > user.otpExpireAt) {
            return res.status(400).json({ 
                success: false,
                message: "OTP has expired. Please request a new one." 
            });
        }

        // Verify OTP
        const isOtpValid = await bcrypt.compare(otp, user.otpHash);

        if (!isOtpValid) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid OTP. Please try again." 
            });
        }

        // Mark user as verified and clear OTP data
        user.isVerified = true;
        user.otpHash = undefined;
        user.otpExpireAt = undefined;
        user.otpLastSentAt = undefined;
        user.otpResendCount = undefined;

        await user.save();

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
    // This endpoint now requires JWT authentication middleware
    // The user will be available in req.user if token is valid
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
        if (phone !== undefined) user.phone = phone;
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
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        console.log(`[${testId}] 🧪 Email test endpoint called`);
        
        const { email, testType = 'basic' } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required for testing"
            });
        }
        
        console.log(`[${testId}] Test parameters:`, {
            email: email,
            testType: testType,
            timestamp: new Date().toISOString(),
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress
        });
        
        // Environment check
        console.log(`[${testId}] 🔍 Environment check:`, {
            NODE_ENV: process.env.NODE_ENV,
            hasEmailUser: !!process.env.EMAIL_USER,
            hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            hasGoogleRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
            emailUserLength: process.env.EMAIL_USER ? process.env.EMAIL_USER.length : 0
        });
        
        let subject, text, html;
        
        if (testType === 'verification') {
            // Test with actual verification email format
            const testOtp = '123456';
            subject = "Test Verification Email – NextDrive Bihar";
            text = `Test verification email. OTP: ${testOtp}`;
            html = `
                <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px">
                    <div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:8px">
                        <h2 style="color:#1e293b; text-align:center;">Test Email Verification</h2>
                        <p>This is a test email from NextDrive Bihar.</p>
                        <div style="text-align:center; margin:30px 0;">
                            <span style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#2563eb;">
                                ${testOtp}
                            </span>
                        </div>
                        <p>Test ID: ${testId}</p>
                        <p>Timestamp: ${new Date().toISOString()}</p>
                    </div>
                </div>
            `;
        } else {
            // Basic test email
            subject = "Test Email – NextDrive Bihar";
            text = `This is a test email from NextDrive Bihar. Test ID: ${testId}`;
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Test Email from NextDrive Bihar</h2>
                    <p>This is a test email to verify email functionality.</p>
                    <p><strong>Test ID:</strong> ${testId}</p>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                    <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
                </div>
            `;
        }
        
        console.log(`[${testId}] 📧 Sending test email...`);
        
        const startTime = Date.now();
        const emailResult = await sendEmail(email, subject, text, html);
        const endTime = Date.now();
        
        console.log(`[${testId}] ✅ Test email sent successfully:`, {
            messageId: emailResult.messageId,
            duration: `${endTime - startTime}ms`,
            success: emailResult.success
        });
        
        res.status(200).json({
            success: true,
            message: "Test email sent successfully!",
            testId: testId,
            emailResult: {
                messageId: emailResult.messageId,
                duration: emailResult.duration || `${endTime - startTime}ms`,
                success: emailResult.success
            },
            debug: {
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV,
                testType: testType,
                recipient: email
            }
        });
        
    } catch (error) {
        console.error(`[${testId}] ❌ Test email failed:`, {
            message: error.message,
            category: error.category,
            originalError: error.originalError,
            duration: error.duration,
            stack: process.env.NODE_ENV === 'development' ? error.stack : 'Hidden in production'
        });
        
        res.status(500).json({
            success: false,
            message: "Test email failed",
            testId: testId,
            error: {
                message: error.message,
                category: error.category,
                originalError: error.originalError,
                duration: error.duration
            },
            debug: {
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV
            }
        });
    }
};