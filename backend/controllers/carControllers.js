import Car from '../models/Car.js';

// Get all cars
export const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find()
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      cars
    });
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cars'
    });
  }
};

// Get available cars
export const getAvailableCars = async (req, res) => {
  try {
    const cars = await Car.find({ 
      isAvailable: true, 
      status: 'Active' 
    }).sort({ name: 1 });

    res.json({
      success: true,
      cars
    });
  } catch (error) {
    console.error('Get available cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available cars'
    });
  }
};

// Get car by ID
export const getCarById = async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findById(id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    res.json({
      success: true,
      car
    });
  } catch (error) {
    console.error('Get car by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch car'
    });
  }
};

// Create new car
export const createCar = async (req, res) => {
  try {
    console.log('📝 Creating car with data:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      carType,
      numberOfSeats,
      image,
      pricing,
      features,
      isAvailable,
      status
    } = req.body;

    // Validation
    if (!name || !carType || !numberOfSeats || !pricing) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, car type, number of seats, and pricing are required'
      });
    }

    // Validate pricing structure
    if (!pricing.oneWay?.perKm || !pricing.roundTrip?.perKm || 
        !pricing.outstation?.perKm || !pricing.marriage?.perDay || 
        !pricing.monthly?.price) {
      console.log('❌ Validation failed: Incomplete pricing structure');
      return res.status(400).json({
        success: false,
        message: 'All pricing fields are required'
      });
    }

    const car = new Car({
      name,
      carType,
      numberOfSeats,
      image: image || '',
      pricing: {
        oneWay: {
          perKm: pricing.oneWay.perKm,
          extraAmount: pricing.oneWay.extraAmount || 0
        },
        roundTrip: {
          perKm: pricing.roundTrip.perKm,
          extraAmount: pricing.roundTrip.extraAmount || 0
        },
        outstation: {
          perKm: pricing.outstation.perKm,
          extraAmount: pricing.outstation.extraAmount || 0
        },
        marriage: {
          perDay: pricing.marriage.perDay,
          extraAmount: pricing.marriage.extraAmount || 0
        },
        monthly: {
          price: pricing.monthly.price,
          extraAmount: pricing.monthly.extraAmount || 0
        }
      },
      features: features || [],
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      status: status || 'Active',
      createdBy: req.user._id
    });

    await car.save();
    console.log('✅ Car created successfully:', car._id);

    res.status(201).json({
      success: true,
      message: 'Car created successfully',
      car
    });
  } catch (error) {
    console.error('❌ Create car error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create car',
      error: error.message
    });
  }
};

// Update car
export const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      carType,
      numberOfSeats,
      image,
      pricing,
      features,
      isAvailable,
      status
    } = req.body;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Update fields
    if (name) car.name = name;
    if (carType) car.carType = carType;
    if (numberOfSeats) car.numberOfSeats = numberOfSeats;
    if (image !== undefined) car.image = image;
    if (features) car.features = features;
    if (isAvailable !== undefined) car.isAvailable = isAvailable;
    if (status) car.status = status;

    // Update pricing
    if (pricing) {
      if (pricing.oneWay) {
        car.pricing.oneWay.perKm = pricing.oneWay.perKm || car.pricing.oneWay.perKm;
        car.pricing.oneWay.extraAmount = pricing.oneWay.extraAmount !== undefined 
          ? pricing.oneWay.extraAmount 
          : car.pricing.oneWay.extraAmount;
      }
      if (pricing.roundTrip) {
        car.pricing.roundTrip.perKm = pricing.roundTrip.perKm || car.pricing.roundTrip.perKm;
        car.pricing.roundTrip.extraAmount = pricing.roundTrip.extraAmount !== undefined 
          ? pricing.roundTrip.extraAmount 
          : car.pricing.roundTrip.extraAmount;
      }
      if (pricing.outstation) {
        car.pricing.outstation.perKm = pricing.outstation.perKm || car.pricing.outstation.perKm;
        car.pricing.outstation.extraAmount = pricing.outstation.extraAmount !== undefined 
          ? pricing.outstation.extraAmount 
          : car.pricing.outstation.extraAmount;
      }
      if (pricing.marriage) {
        car.pricing.marriage.perDay = pricing.marriage.perDay || car.pricing.marriage.perDay;
        car.pricing.marriage.extraAmount = pricing.marriage.extraAmount !== undefined 
          ? pricing.marriage.extraAmount 
          : car.pricing.marriage.extraAmount;
      }
      if (pricing.monthly) {
        car.pricing.monthly.price = pricing.monthly.price || car.pricing.monthly.price;
        car.pricing.monthly.extraAmount = pricing.monthly.extraAmount !== undefined 
          ? pricing.monthly.extraAmount 
          : car.pricing.monthly.extraAmount;
      }
    }

    car.lastModifiedBy = req.user._id;
    await car.save();

    res.json({
      success: true,
      message: 'Car updated successfully',
      car
    });
  } catch (error) {
    console.error('Update car error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update car',
      error: error.message
    });
  }
};

// Delete car
export const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    await Car.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    console.error('Delete car error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete car'
    });
  }
};

// Toggle car availability
export const toggleCarAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    car.isAvailable = !car.isAvailable;
    car.lastModifiedBy = req.user._id;
    await car.save();

    res.json({
      success: true,
      message: `Car ${car.isAvailable ? 'enabled' : 'disabled'} successfully`,
      car
    });
  } catch (error) {
    console.error('Toggle car availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle car availability'
    });
  }
};
