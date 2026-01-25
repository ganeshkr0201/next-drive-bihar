import mongoose from 'mongoose';

const carBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  carType: {
    type: String,
    required: true,
    enum: ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Tempo Traveller', 'Bus']
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
    type: String,
    required: true
  },
  numberOfPassengers: {
    type: Number,
    required: true,
    min: 1
  },
  tripType: {
    type: String,
    enum: ['one-way', 'round-trip', 'multi-city'],
    default: 'one-way'
  },
  totalAmount: {
    type: Number,
    required: true,
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
  }]
}, {
  timestamps: true
});

// Generate booking reference before saving
carBookingSchema.pre('save', async function() {
  if (!this.bookingReference) {
    this.bookingReference = 'CAR' + Date.now() + Math.floor(Math.random() * 1000);
  }
});

// Indexes
carBookingSchema.index({ user: 1 });
carBookingSchema.index({ status: 1 });
carBookingSchema.index({ pickupDate: 1 });
carBookingSchema.index({ bookingReference: 1 });
carBookingSchema.index({ createdAt: -1 });

export default mongoose.model('CarBooking', carBookingSchema);