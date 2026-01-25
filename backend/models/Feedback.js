import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  tourPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourPackage'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  categories: {
    service: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  adminResponse: {
    content: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
feedbackSchema.index({ user: 1 });
feedbackSchema.index({ booking: 1 });
feedbackSchema.index({ tourPackage: 1 });
feedbackSchema.index({ rating: -1 });
feedbackSchema.index({ createdAt: -1 });

// Ensure one feedback per booking
feedbackSchema.index({ booking: 1 }, { unique: true });

export default mongoose.model('Feedback', feedbackSchema);