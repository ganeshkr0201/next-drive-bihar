import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['tour', 'car'],
    required: true
  },
  // For tour bookings
  tourPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourPackage'
  },
  numberOfTravelers: {
    type: Number,
    min: 1
  },
  travelDate: {
    type: Date
  },
  // For car bookings (legacy - use CarBooking model instead)
  carType: String,
  pickupLocation: String,
  dropoffLocation: String,
  pickupDate: Date,
  dropoffDate: Date,
  
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  bookingReference: {
    type: String,
    unique: true
  },
  specialRequests: String,
  contactNumber: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    trim: true
  },
  pickupLocation: {
    type: String,
    trim: true
  },
  dropLocation: {
    type: String,
    trim: true
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledByType: {
    type: String,
    enum: ['user', 'admin'],
    trim: true
  },
  cancelledAt: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
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

// Generate booking reference before saving
bookingSchema.pre('save', async function() {
  if (!this.bookingReference) {
    const prefix = this.type === 'tour' ? 'TOUR' : 'CAR';
    this.bookingReference = prefix + Date.now() + Math.floor(Math.random() * 1000);
  }
});

// Indexes
bookingSchema.index({ user: 1 });
bookingSchema.index({ type: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);