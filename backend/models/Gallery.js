import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['car', 'marriage', 'tour', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
gallerySchema.index({ category: 1 });
gallerySchema.index({ isActive: 1 });
gallerySchema.index({ createdAt: -1 });

export default mongoose.model('Gallery', gallerySchema);
