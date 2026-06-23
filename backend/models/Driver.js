import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, 'Phone number must be 10 digits'],
    },
    licenceType: {
      type: String,
      required: true,
      enum: ['LMV', 'HMV', 'HPMV', 'PSV', 'LMV-TR', 'MCWG'],
    },
    drivingExperience: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['available', 'unavailable'],
      default: 'available',
    },
    languagesKnown: [
      {
        type: String,
      },
    ],
    carType: {
      type: String,
      enum: ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Tempo Traveller', 'Bus', 'Other'],
    },
    carModel: {
      type: String,
      trim: true,
    },
    carNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    licenceImageFront: {
      type: String, // Cloudinary URL
    },
    licenceImageFrontPublicId: {
      type: String,
    },
    licenceImageBack: {
      type: String, // Cloudinary URL
    },
    licenceImageBackPublicId: {
      type: String,
    },
    driverPhoto: {
      type: String, // Cloudinary URL
    },
    driverPhotoPublicId: {
      type: String,
    },
    carFrontImage: {
      type: String, // Cloudinary URL
    },
    carFrontImagePublicId: {
      type: String,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Reference to the auto-created User account for this driver
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
driverSchema.index({ status: 1 });
driverSchema.index({ addedBy: 1 });
driverSchema.index({ createdAt: -1 });

export default mongoose.model('Driver', driverSchema);
