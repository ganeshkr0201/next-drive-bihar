import mongoose from 'mongoose';

const querySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
  whatsapp: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\d{10}$/.test(v);
      },
      message: 'WhatsApp number must be exactly 10 digits'
    }
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['car-booking', 'tour-package', 'others'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  response: {
    type: String,
    trim: true
  },
  respondedAt: {
    type: Date
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    type: String,
    enum: ['satisfied', 'unsatisfied'],
    default: null
  },
  ratedAt: {
    type: Date
  },
  feedback: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // For non-registered users
  },
  tags: [String],
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
querySchema.index({ email: 1 });
querySchema.index({ phone: 1 });
querySchema.index({ status: 1 });
querySchema.index({ category: 1 });
querySchema.index({ priority: 1 });
querySchema.index({ createdAt: -1 });
querySchema.index({ user: 1 });

// Middleware to automatically close query after feedback
querySchema.pre('save', function() {
  // If rating is being set and status is resolved, change to closed
  if (this.isModified('rating') && this.rating && this.status === 'resolved') {
    this.status = 'closed';
  }
});

// Virtual for display category
querySchema.virtual('displayCategory').get(function() {
  const categoryMap = {
    'car-booking': 'Car Booking',
    'tour-package': 'Tour Package',
    'others': 'Others'
  };
  return categoryMap[this.category] || this.category;
});

// Virtual for status display
querySchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Pending',
    'resolved': 'Resolved',
    'closed': 'Closed'
  };
  return statusMap[this.status] || this.status;
});

// Static method to get queries by status
querySchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('user', 'name email')
    .populate('respondedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get queries by category
querySchema.statics.getByCategory = function(category) {
  return this.find({ category })
    .populate('user', 'name email')
    .populate('respondedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get active queries (pending + resolved)
querySchema.statics.getActiveQueries = function() {
  return this.find({ status: { $in: ['pending', 'resolved'] } })
    .populate('user', 'name email')
    .populate('respondedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get closed queries
querySchema.statics.getClosedQueries = function() {
  return this.find({ status: 'closed' })
    .populate('user', 'name email')
    .populate('respondedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Ensure virtual fields are serialized
querySchema.set('toJSON', { virtuals: true });

export default mongoose.model('Query', querySchema);