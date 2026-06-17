import mongoose from 'mongoose';

const carBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for offline/walk-in bookings
  },
  // Offline booking customer details (used when no user account)
  offlineCustomer: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true }
  },
  isOfflineBooking: {
    type: Boolean,
    default: false
  },
  carType: {
    type: String,
    required: true,
    enum: ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Tempo Traveller', 'Bus', 'Multiple']
  },
  pickupLocation: {
    type: String,
    required: true,
    trim: true
  },
  dropoffLocation: {
    type: String,
    required: true,
    trim: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  dropoffDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String
  },
  dropoffTime: {
    type: String
  },
  numberOfPassengers: {
    type: Number,
    required: true,
    min: 0
  },
  tripType: {
    type: String,
    enum: ['one-way', 'round-trip', 'multi-city', 'outstation', 'marriage', 'monthly'],
    default: 'one-way'
  },
  // Marriage booking specific fields
  numberOfCars: {
    type: Number,
    min: 1,
    default: 1
  },
  selectedCars: [{
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car'
    },
    carName: String,
    carType: String,
    quantity: { type: Number, default: 1, min: 1 },
    pricePerDay: Number
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  driverDetails: {
    name: String,
    phone: String,
    licenseNumber: String
  },
  vehicleDetails: {
    make: String,
    model: String,
    year: Number,
    plateNumber: String,
    color: String
  },
  specialRequests: {
    type: String,
    trim: true
  },
  bookingReference: {
    type: String,
    unique: true
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
  }],
  // Cancellation fields
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
  }
}, {
  timestamps: true
});

// Generate booking reference before saving
carBookingSchema.pre('save', async function() {
  if (!this.bookingReference) {
    this.bookingReference = 'CAR' + Date.now() + Math.floor(Math.random() * 1000);
  }
  
  // Auto-update payment status based on paid amount
  const dueAmount = this.totalAmount - this.discount - this.paidAmount;
  if (this.paidAmount === 0) {
    this.paymentStatus = 'pending';
  } else if (dueAmount <= 0) {
    this.paymentStatus = 'paid';
  } else {
    this.paymentStatus = 'partial';
  }
});

// Virtual field for due amount
carBookingSchema.virtual('dueAmount').get(function() {
  return Math.max(0, this.totalAmount - this.discount - this.paidAmount);
});

// Ensure virtuals are included in JSON
carBookingSchema.set('toJSON', { virtuals: true });
carBookingSchema.set('toObject', { virtuals: true });

// Indexes
carBookingSchema.index({ user: 1 });
carBookingSchema.index({ status: 1 });
carBookingSchema.index({ pickupDate: 1 });
carBookingSchema.index({ bookingReference: 1 });
carBookingSchema.index({ createdAt: -1 });

export default mongoose.model('CarBooking', carBookingSchema);