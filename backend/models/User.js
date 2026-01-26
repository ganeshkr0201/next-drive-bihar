import mongoose from "mongoose";
import fs from 'fs';
import path from 'path';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    role: { 
        type: String, 
        enum: ["user", "admin"], 
        default: "user"
    },

    password: { type: String },

    googleId: { type: String },

    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },

    avatar: { 
        type: String // Cloudinary URL
    },
    avatarPublicId: { 
        type: String // Cloudinary public_id for deletion
    },

    // Additional profile fields
    phone: { 
        type: String,
        validate: {
            validator: function(v) {
                // Allow empty or exactly 10 digits
                return !v || /^[0-9]{10}$/.test(v);
            },
            message: 'Phone number must be exactly 10 digits'
        }
    },
    address: { type: String },
    dateOfBirth: { type: Date },
    bio: { type: String, maxlength: 500 },

    isVerified : {
        type: Boolean,
        default: false
    },

    otpHash: {
        type: String
    },
    otpExpireAt: {
        type: Date
    },
    otpResendCount: {
        type: Number,
        default: 0
    },
    otpLastSentAt: {
        type: Date
    },
    
}, {timestamps: true})

// Create indexes for better query performance
userSchema.index({ email: 1 }); // Already unique, but explicit index
userSchema.index({ role: 1, createdAt: -1 }); // For admin user listing
userSchema.index({ googleId: 1 }); // For Google OAuth
userSchema.index({ isVerified: 1 }); // For filtering verified users
userSchema.index({ authProvider: 1 }); // For filtering by auth provider

// Cascade delete middleware - Remove all user-related data when user is deleted
userSchema.pre('findOneAndDelete', async function() {
    try {
        const userId = this.getQuery()._id;

        // Get user data before deletion to access file paths
        const user = await this.model.findById(userId);
        
        if (user) {
            // Delete user's avatar from Cloudinary if exists
            if (user.avatarPublicId) {
                try {
                    const { cloudinaryUtils } = await import('../config/cloudinary.js');
                    await cloudinaryUtils.deleteImage(user.avatarPublicId);
                    console.log(`🗑️ Deleted avatar from Cloudinary for user: ${user.name}`);
                } catch (cloudinaryError) {
                    console.error('Error deleting avatar from Cloudinary:', cloudinaryError);
                    // Continue with deletion even if Cloudinary cleanup fails
                }
            }

            try {
                // Import models dynamically to avoid circular dependencies
                const { default: Booking } = await import('./Booking.js');
                const { default: CarBooking } = await import('./CarBooking.js');
                const { default: Query } = await import('./Query.js');
                const { default: Notification } = await import('./Notification.js');
                const { default: TourPackage } = await import('./TourPackage.js');

                // Delete all user's bookings
                const deletedBookings = await Booking.deleteMany({ user: userId });

                // Delete all user's car bookings
                const deletedCarBookings = await CarBooking.deleteMany({ user: userId });

                // Delete all user's queries
                const deletedQueries = await Query.deleteMany({ user: userId });

                // Delete all notifications sent to this user
                const deletedReceivedNotifications = await Notification.deleteMany({ recipient: userId });

                // Delete all notifications sent by this user (if admin)
                const deletedSentNotifications = await Notification.deleteMany({ sender: userId });

                // Update tour packages created by this user (set createdBy to null instead of deleting)
                const updatedTourPackages = await TourPackage.updateMany(
                    { createdBy: userId },
                    { $unset: { createdBy: 1 } }
                );

                // Clean up any orphaned queries that reference this user by email
                const deletedEmailQueries = await Query.deleteMany({ email: user.email, user: { $exists: false } });

            } catch (cascadeError) {
                console.error('Error in cascade delete operations:', cascadeError);
                // Continue with user deletion even if cascade operations fail
                // This ensures the user is still deleted even if related data cleanup fails
            }
        }
    } catch (error) {
        console.error('Cascade delete middleware error:', error);
        // Don't block the deletion - continue even if cascade fails
        throw error; // Re-throw to let caller handle
    }
});

// Also handle direct deleteOne calls
userSchema.pre('deleteOne', { document: true }, async function() {
    try {
        const userId = this._id;

        // Delete user's avatar from Cloudinary if exists
        if (this.avatarPublicId) {
            try {
                const { cloudinaryUtils } = await import('../config/cloudinary.js');
                await cloudinaryUtils.deleteImage(this.avatarPublicId);
                console.log(`🗑️ Deleted avatar from Cloudinary for user: ${this.name}`);
            } catch (cloudinaryError) {
                console.error('Error deleting avatar from Cloudinary:', cloudinaryError);
                // Continue with deletion even if Cloudinary cleanup fails
            }
        }

        try {
            // Import models dynamically to avoid circular dependencies
            const { default: Booking } = await import('./Booking.js');
            const { default: CarBooking } = await import('./CarBooking.js');
            const { default: Query } = await import('./Query.js');
            const { default: Notification } = await import('./Notification.js');
            const { default: TourPackage } = await import('./TourPackage.js');

            // Delete all user's bookings
            const deletedBookings = await Booking.deleteMany({ user: userId });

            // Delete all user's car bookings
            const deletedCarBookings = await CarBooking.deleteMany({ user: userId });

            // Delete all user's queries
            const deletedQueries = await Query.deleteMany({ user: userId });

            // Delete all notifications sent to this user
            const deletedReceivedNotifications = await Notification.deleteMany({ recipient: userId });

            // Delete all notifications sent by this user (if admin)
            const deletedSentNotifications = await Notification.deleteMany({ sender: userId });

            // Update tour packages created by this user (set createdBy to null instead of deleting)
            const updatedTourPackages = await TourPackage.updateMany(
                { createdBy: userId },
                { $unset: { createdBy: 1 } }
            );

            // Clean up any orphaned queries that reference this user by email
            const deletedEmailQueries = await Query.deleteMany({ email: this.email, user: { $exists: false } });

        } catch (cascadeError) {
            console.error('Error in cascade delete operations:', cascadeError);
            // Continue with user deletion even if cascade operations fail
        }
    } catch (error) {
        console.error('Cascade delete middleware error:', error);
        // Don't block the deletion - continue even if cascade fails
        throw error; // Re-throw to let caller handle
    }
});

export default mongoose.model("User", userSchema);