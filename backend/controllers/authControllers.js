import passport from 'passport';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';
import { generateOTP } from '../utils/generateOtp.js';



export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: "Name, email, and password are required" 
            });
        }

        const userExist = await User.findOne({email});
        if(userExist) {
            return res.status(400).json({ 
                message: "User already exists with this email" 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otpHash: hashedOtp,
            otpExpireAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            otpLastSentAt: new Date()
        });

        // Send OTP email with better formatting
        try {
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
        } catch (emailError) {
            // Delete user if email fails
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({ 
                message: "Failed to send verification email. Please try again." 
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
            message: "Registration successful! Please check your email for verification code.", 
            user: userResponse,
            requiresVerification: true
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Registration failed. Please try again." 
        });
    }
}



export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "User is already verified" });
        }

        // Check if user can resend OTP (limit to prevent spam)
        const now = new Date();
        const lastSent = user.otpLastSentAt;
        const timeDiff = now - lastSent;
        const oneMinute = 60 * 1000;

        if (timeDiff < oneMinute) {
            return res.status(429).json({ 
                message: `Please wait ${oneMinute-timeDiff} seconds before requesting another OTP`
            });
        }

        // Check resend count (max 5 per hour)
        if (user.otpResendCount >= 5) {
            const oneHour = 60 * 60 * 1000;
            if (timeDiff < oneHour) {
                return res.status(429).json({ 
                    message: "Maximum OTP requests reached. Please try again later." 
                });
            } else {
                // Reset count after an hour
                user.otpResendCount = 0;
            }
        }

        // Generate new OTP
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.otpHash = hashedOtp;
        user.otpExpireAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        user.otpLastSentAt = now;
        user.otpResendCount += 1;

        await user.save();

        // Send OTP email
        try {
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


            res.status(200).json({ 
                message: "Verification code sent successfully!" 
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            res.status(500).json({ 
                message: "Failed to send verification email. Please try again." 
            });
        }

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ 
            message: "Failed to resend OTP. Please try again." 
        });
    }
}



export const login = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: "Internal server error" });
        }
        
        if (!user) {
            // Check if the error is due to unverified email
            if (info?.message === "Please verify your email before logging in") {
                // Find the user to get their email for verification redirect
                User.findOne({ email: req.body.email })
                .then(foundUser => {
                    if (foundUser && !foundUser.isVerified) {
                        return res.status(403).json({ 
                            message: info.message,
                            requiresVerification: true,
                            email: foundUser.email
                        });
                    }
                    return res.status(401).json({ 
                        message: info?.message || "Invalid email or password" 
                    });
                })
                .catch(() => {
                    return res.status(401).json({ 
                        message: info?.message || "Invalid email or password" 
                    });
                });
                return;
            }
            
            return res.status(401).json({ 
                message: info?.message || "Invalid email or password" 
            });
        }
        
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ message: "Login session error" });
            }
            
            res.json({ 
                message: "Login Successful", 
                user: req.user 
            });
        });
    })(req, res, next);
}


export const google = (req, res, next) => {
    passport.authenticate("google", { scope: ["profile", "email"]})(req, res, next);
}

export const googleCallback = (req, res, next) => {
    passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` })(req, res, next);
}

export const googleSuccess = (req, res) => {
    console.log('🔍 Google OAuth Success Handler:');
    console.log('- User authenticated:', req.isAuthenticated());
    console.log('- User object:', req.user ? { id: req.user._id, name: req.user.name, email: req.user.email } : 'null');
    console.log('- Session ID:', req.sessionID);
    console.log('- Redirecting to:', `${process.env.CLIENT_URL}/auth/google/success`);
    
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success`);
}

export const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ 
                message: "Logout failed" 
            });
        }
        res.json({ 
            message: "Logged out successfully" 
        });
    });
}


export const verifyOtp = async (req, res) => {
    try {
        const { email, otp, autoLogin } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "User is already verified" });
        }

        // Check if OTP has expired
        if (Date.now() > user.otpExpireAt) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        // Verify OTP
        const isOtpValid = await bcrypt.compare(otp, user.otpHash);

        if (!isOtpValid) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }

        // Mark user as verified and clear OTP data
        user.isVerified = true;
        user.otpHash = undefined;
        user.otpExpireAt = undefined;
        user.otpLastSentAt = undefined;
        user.otpResendCount = undefined;

        await user.save();

        // If autoLogin is requested, log the user in
        if (autoLogin) {
            req.logIn(user, (err) => {
                if (err) {
                    return res.status(500).json({ 
                        message: "Email verified successfully, but login failed. Please try logging in manually.",
                        verified: true,
                        autoLoginFailed: true
                    });
                }
                
                return res.status(200).json({ 
                    message: "Email verified and logged in successfully!",
                    verified: true,
                    autoLogin: true,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        authProvider: user.authProvider,
                        isVerified: user.isVerified,
                        createdAt: user.createdAt
                    }
                });
            });
        } else {
            res.status(200).json({ 
                message: "Email verified successfully! You can now login.",
                verified: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    authProvider: user.authProvider,
                    isVerified: user.isVerified,
                    createdAt: user.createdAt
                }
            });
        }

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ 
            message: "Verification failed. Please try again." 
        });
    }
}


export const getCurrentUser = (req, res) => {
    console.log('🔍 getCurrentUser called:');
    console.log('- Authenticated:', req.isAuthenticated());
    console.log('- Session ID:', req.sessionID);
    console.log('- User:', req.user ? { id: req.user._id, name: req.user.name, email: req.user.email } : 'null');
    console.log('- Cookies:', req.headers.cookie);
    
    if (req.isAuthenticated()) {
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
        // Check if user is authenticated
        if (!req.isAuthenticated()) {
            console.log('❌ User not authenticated');
            return res.status(401).json({ 
                success: false,
                message: "Authentication required" 
            });
        }

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

        // Handle avatar upload if file is provided (Cloudinary)
        if (req.file) {
            // Delete old avatar from Cloudinary if exists
            if (user.avatarPublicId) {
                try {
                    const { cloudinaryUtils } = await import('../config/cloudinary.js');
                    await cloudinaryUtils.deleteImage(user.avatarPublicId);
                    console.log('🗑️ Deleted old avatar from Cloudinary');
                } catch (cloudinaryError) {
                    console.error('Error deleting old avatar from Cloudinary:', cloudinaryError);
                    // Continue with update even if deletion fails
                }
            }
            
            // Set new avatar URL and public_id from Cloudinary
            user.avatar = req.file.path; // Cloudinary URL
            user.avatarPublicId = req.file.filename; // Cloudinary public_id
            console.log('📸 New avatar uploaded to Cloudinary:', req.file.path);
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
        // Check if user is authenticated
        if (!req.isAuthenticated()) {
            return res.status(401).json({ 
                success: false,
                message: "Authentication required" 
            });
        }

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
            const bcrypt = await import('bcrypt');
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

        // Logout user first
        req.logout((err) => {
            if (err) {
                console.error('Logout error during account deletion:', err);
            }
        });

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