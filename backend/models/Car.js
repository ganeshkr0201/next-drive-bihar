import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  carType: {
    type: String,
    required: true,
    enum: ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Tempo Traveller', 'Other'],
    default: 'Sedan'
  },
  numberOfSeats: {
    type: Number,
    required: true,
    min: 2,
    max: 20
  },
  image: {
    type: String,
    default: ''
  },
  // Pricing for different trip types
  pricing: {
    oneWay: {
      perKm: {
        type: Number,
        required: true,
        min: 0
      },
      extraAmount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    roundTrip: {
      perKm: {
        type: Number,
        required: true,
        min: 0
      },
      extraAmount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    outstation: {
      perKm: {
        type: Number,
        required: true,
        min: 0
      },
      extraAmount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    marriage: {
      perHour: {
        type: Number,
        required: true,
        min: 0
      },
      extraAmount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    monthly: {
      price: {
        type: Number,
        required: true,
        min: 0
      },
      extraAmount: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  features: [{
    type: String,
    trim: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
carSchema.index({ name: 1 });
carSchema.index({ carType: 1 });
carSchema.index({ isAvailable: 1 });
carSchema.index({ status: 1 });

export default mongoose.model('Car', carSchema);
