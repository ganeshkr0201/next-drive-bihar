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
    const tourPackageId = this.getQuery()._id;
    const tourPackage = await this.model.findById(tourPackageId);
    
    if (tourPackage && tourPackage.images) {
      const { cloudinaryUtils } = await import('../config/cloudinary.js');
      const imagesToDelete = [];
      
      // Add featured image public_id if exists
      if (tourPackage.images.featuredPublicId) {
        imagesToDelete.push(tourPackage.images.featuredPublicId);
      }
      
      // Add gallery images public_ids if exist
      if (tourPackage.images.gallery && tourPackage.images.gallery.length > 0) {
        tourPackage.images.gallery.forEach(image => {
          if (image.publicId) {
            imagesToDelete.push(image.publicId);
          }
        });
      }
      
      // Delete all images from Cloudinary
      if (imagesToDelete.length > 0) {
        await cloudinaryUtils.deleteImages(imagesToDelete);
        console.log(`🗑️ Deleted ${imagesToDelete.length} images from Cloudinary for tour package: ${tourPackage.title}`);
      }
    }
  } catch (error) {
    console.error('Error deleting tour package images from Cloudinary:', error);
    // Continue with deletion even if Cloudinary cleanup fails
  }
});

// Also handle direct deleteOne calls
tourPackageSchema.pre('deleteOne', { document: true }, async function() {
  try {
    if (this.images) {
      const { cloudinaryUtils } = await import('../config/cloudinary.js');
      const imagesToDelete = [];
      
      // Add featured image public_id if exists
      if (this.images.featuredPublicId) {
        imagesToDelete.push(this.images.featuredPublicId);
      }
      
      // Add gallery images public_ids if exist
      if (this.images.gallery && this.images.gallery.length > 0) {
        this.images.gallery.forEach(image => {
          if (image.publicId) {
            imagesToDelete.push(image.publicId);
          }
        });
      }
      
      // Delete all images from Cloudinary
      if (imagesToDelete.length > 0) {
        await cloudinaryUtils.deleteImages(imagesToDelete);
        console.log(`🗑️ Deleted ${imagesToDelete.length} images from Cloudinary for tour package: ${this.title}`);
      }
    }
  } catch (error) {
    console.error('Error deleting tour package images from Cloudinary:', error);
    // Continue with deletion even if Cloudinary cleanup fails
  }
});

export default mongoose.model("TourPackage", tourPackageSchema);