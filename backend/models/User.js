import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    role: { 
        type: String, 
        enum: ["user", "admin", "driver"], 
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
        default: true // make this false for the otp verification
    },
    
}, {timestamps: true})

// Create indexes for better query performance
// Note: email has unique:true on the field — no separate index needed
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ googleId: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ authProvider: 1 });

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
                const { default: Feedback } = await import('./Feedback.js');

                // Get all tour packages created by this user to delete their images
                const userTourPackages = await TourPackage.find({ createdBy: userId });
                
                // Delete images from Cloudinary for all tour packages created by this user
                if (userTourPackages.length > 0) {
                    const { cloudinaryUtils } = await import('../config/cloudinary.js');
                    let totalImagesDeleted = 0;
                    
                    for (const tourPackage of userTourPackages) {
                        const imagesToDelete = [];
                        
                        if (tourPackage.images?.featuredPublicId) {
                            imagesToDelete.push(tourPackage.images.featuredPublicId);
                        }
                        
                        if (tourPackage.images?.gallery && tourPackage.images.gallery.length > 0) {
                            tourPackage.images.gallery.forEach(image => {
                                if (image.publicId) {
                                    imagesToDelete.push(image.publicId);
                                }
                            });
                        }
                        
                        if (imagesToDelete.length > 0) {
                            await cloudinaryUtils.deleteImages(imagesToDelete);
                            totalImagesDeleted += imagesToDelete.length;
                        }
                    }
                    
                    if (totalImagesDeleted > 0) {
                        console.log(`🗑️ Deleted ${totalImagesDeleted} tour package images from Cloudinary`);
                    }
                }

                // Delete all user's bookings
                const deletedBookings = await Booking.deleteMany({ user: userId });

                // Delete all user's car bookings
                const deletedCarBookings = await CarBooking.deleteMany({ user: userId });

                // Delete all user's queries
                const deletedQueries = await Query.deleteMany({ user: userId });

                // Delete all user's feedback/ratings
                const deletedFeedback = await Feedback.deleteMany({ user: userId });

                // Delete all notifications sent to this user
                const deletedReceivedNotifications = await Notification.deleteMany({ recipient: userId });

                // Delete all notifications sent by this user (if admin)
                const deletedSentNotifications = await Notification.deleteMany({ sender: userId });

                // Delete tour packages created by this user (images already deleted above)
                const deletedTourPackages = await TourPackage.deleteMany({ createdBy: userId });

                // Clean up any orphaned queries that reference this user by email
                const deletedEmailQueries = await Query.deleteMany({ email: user.email, user: { $exists: false } });

                console.log(`🗑️ Cascade delete completed for user ${user.name}:`, {
                    bookings: deletedBookings.deletedCount,
                    carBookings: deletedCarBookings.deletedCount,
                    queries: deletedQueries.deletedCount,
                    feedback: deletedFeedback.deletedCount,
                    receivedNotifications: deletedReceivedNotifications.deletedCount,
                    sentNotifications: deletedSentNotifications.deletedCount,
                    tourPackages: deletedTourPackages.deletedCount,
                    emailQueries: deletedEmailQueries.deletedCount
                });

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
            const { default: Feedback } = await import('./Feedback.js');

            // Get all tour packages created by this user to delete their images
            const userTourPackages = await TourPackage.find({ createdBy: userId });
            
            // Delete images from Cloudinary for all tour packages created by this user
            if (userTourPackages.length > 0) {
                const { cloudinaryUtils } = await import('../config/cloudinary.js');
                let totalImagesDeleted = 0;
                
                for (const tourPackage of userTourPackages) {
                    const imagesToDelete = [];
                    
                    if (tourPackage.images?.featuredPublicId) {
                        imagesToDelete.push(tourPackage.images.featuredPublicId);
                    }
                    
                    if (tourPackage.images?.gallery && tourPackage.images.gallery.length > 0) {
                        tourPackage.images.gallery.forEach(image => {
                            if (image.publicId) {
                                imagesToDelete.push(image.publicId);
                            }
                        });
                    }
                    
                    if (imagesToDelete.length > 0) {
                        await cloudinaryUtils.deleteImages(imagesToDelete);
                        totalImagesDeleted += imagesToDelete.length;
                    }
                }
                
                if (totalImagesDeleted > 0) {
                    console.log(`🗑️ Deleted ${totalImagesDeleted} tour package images from Cloudinary`);
                }
            }

            // Delete all user's bookings
            const deletedBookings = await Booking.deleteMany({ user: userId });

            // Delete all user's car bookings
            const deletedCarBookings = await CarBooking.deleteMany({ user: userId });

            // Delete all user's queries
            const deletedQueries = await Query.deleteMany({ user: userId });

            // Delete all user's feedback/ratings
            const deletedFeedback = await Feedback.deleteMany({ user: userId });

            // Delete all notifications sent to this user
            const deletedReceivedNotifications = await Notification.deleteMany({ recipient: userId });

            // Delete all notifications sent by this user (if admin)
            const deletedSentNotifications = await Notification.deleteMany({ sender: userId });

            // Delete tour packages created by this user (images already deleted above)
            const deletedTourPackages = await TourPackage.deleteMany({ createdBy: userId });

            // Clean up any orphaned queries that reference this user by email
            const deletedEmailQueries = await Query.deleteMany({ email: this.email, user: { $exists: false } });

            console.log(`🗑️ Cascade delete completed for user ${this.name}:`, {
                bookings: deletedBookings.deletedCount,
                carBookings: deletedCarBookings.deletedCount,
                queries: deletedQueries.deletedCount,
                feedback: deletedFeedback.deletedCount,
                receivedNotifications: deletedReceivedNotifications.deletedCount,
                sentNotifications: deletedSentNotifications.deletedCount,
                tourPackages: deletedTourPackages.deletedCount,
                emailQueries: deletedEmailQueries.deletedCount
            });

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