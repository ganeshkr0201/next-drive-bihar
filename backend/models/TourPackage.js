import mongoose from 'mongoose';

const tourPackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  summary: {
    type: String
  },
  shortDescription: {
    type: String
  },
  duration: {
    days: {
      type: Number,
      required: true,
      min: 1
    },
    nights: {
      type: Number,
      required: true,
      min: 0
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "INR"
    }
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  images: {
    featured: {
      type: String // Cloudinary URL
    },
    featuredPublicId: {
      type: String // Cloudinary public_id for deletion
    },
    gallery: [{
      url: String, // Cloudinary URL
      publicId: String, // Cloudinary public_id for deletion
      caption: String,
      alt: String
    }]
  },
  destinations: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    attractions: [String]
  }],
  highlights: [String],
  category: {
    type: String,
    required: true,
    default: 'Heritage & Culture'
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Moderate", "Challenging", "Expert"],
    default: "Easy"
  },
  maxGroupSize: {
    type: Number,
    default: 50
  },
  minGroupSize: {
    type: Number,
    default: 2
  },
  status: {
    type: String,
    enum: ["Draft", "Published", "Archived", "Sold Out"],
    default: "Draft"
  },
  featured: {
    type: Boolean,
    default: false
  },
  inclusions: [String],
  exclusions: [String],
  pickupLocations: [String],
  dropLocations: [String],
  bookingInfo: {
    cancellationPolicy: String,
    paymentTerms: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate slug
tourPackageSchema.pre('save', async function() {
  if (this.isModified('title') && !this.slug) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check for existing slugs and add counter if needed
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
});

// Indexes
tourPackageSchema.index({ slug: 1 });
tourPackageSchema.index({ category: 1 });
tourPackageSchema.index({ status: 1 });
tourPackageSchema.index({ featured: 1 });
tourPackageSchema.index({ createdAt: -1 });

// Pre-delete middleware to clean up Cloudinary images
tourPackageSchema.pre('findOneAndDelete', async function() {
  try {
    const tourPackage = await this.model.findOne(this.getQuery());
    
    if (tourPackage) {
      // Import cloudinary utils
      const { cloudinaryUtils } = await import('../config/cloudinary.js');
      
      // Collect all public IDs to delete
      const publicIdsToDelete = [];
      
      // Add featured image public ID
      if (tourPackage.images.featuredPublicId) {
        publicIdsToDelete.push(tourPackage.images.featuredPublicId);
      }
      
      // Add gallery images public IDs
      if (tourPackage.images.gallery && tourPackage.images.gallery.length > 0) {
        tourPackage.images.gallery.forEach(image => {
          if (image.publicId) {
            publicIdsToDelete.push(image.publicId);
          }
        });
      }
      
      // Delete images from Cloudinary
      if (publicIdsToDelete.length > 0) {
        try {
          await cloudinaryUtils.deleteImages(publicIdsToDelete);
          console.log(`Deleted ${publicIdsToDelete.length} images from Cloudinary for tour package: ${tourPackage.title}`);
        } catch (cloudinaryError) {
          console.error('Error deleting images from Cloudinary:', cloudinaryError);
          // Continue with deletion even if Cloudinary cleanup fails
        }
      }
    }
  } catch (error) {
    console.error('Error in tour package pre-delete middleware:', error);
    // Continue with deletion even if cleanup fails
  }
});

// Also handle direct deleteOne calls
tourPackageSchema.pre('deleteOne', { document: true }, async function() {
  try {
    // Import cloudinary utils
    const { cloudinaryUtils } = await import('../config/cloudinary.js');
    
    // Collect all public IDs to delete
    const publicIdsToDelete = [];
    
    // Add featured image public ID
    if (this.images.featuredPublicId) {
      publicIdsToDelete.push(this.images.featuredPublicId);
    }
    
    // Add gallery images public IDs
    if (this.images.gallery && this.images.gallery.length > 0) {
      this.images.gallery.forEach(image => {
        if (image.publicId) {
          publicIdsToDelete.push(image.publicId);
        }
      });
    }
    
    // Delete images from Cloudinary
    if (publicIdsToDelete.length > 0) {
      try {
        await cloudinaryUtils.deleteImages(publicIdsToDelete);
        console.log(`Deleted ${publicIdsToDelete.length} images from Cloudinary for tour package: ${this.title}`);
      } catch (cloudinaryError) {
        console.error('Error deleting images from Cloudinary:', cloudinaryError);
        // Continue with deletion even if Cloudinary cleanup fails
      }
    }
  } catch (error) {
    console.error('Error in tour package pre-delete middleware:', error);
    // Continue with deletion even if cleanup fails
  }
});

export default mongoose.model("TourPackage", tourPackageSchema);