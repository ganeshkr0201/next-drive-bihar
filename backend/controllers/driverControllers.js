import { cloudinary } from '../config/cloudinary.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
import CarBooking from '../models/CarBooking.js';
import bcrypt from 'bcrypt';

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = 'nextdrive/drivers') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// Helper: delete from Cloudinary by publicId
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

// GET /api/drivers
export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    console.error('getAllDrivers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch drivers', error: error.message });
  }
};

// GET /api/drivers/:id
export const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('addedBy', 'name email');
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    res.status(200).json({ success: true, data: driver });
  } catch (error) {
    console.error('getDriverById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch driver', error: error.message });
  }
};

// POST /api/drivers
export const createDriver = async (req, res) => {
  try {
    const {
      name,
      phone,
      licenceType,
      drivingExperience,
      status,
      languagesKnown,
      carType,
      carModel,
      carNumber,
    } = req.body;

    // Parse languagesKnown JSON string if needed
    let parsedLanguages = [];
    if (languagesKnown) {
      try {
        parsedLanguages = typeof languagesKnown === 'string' ? JSON.parse(languagesKnown) : languagesKnown;
      } catch {
        parsedLanguages = [];
      }
    }

    const driverData = {
      name,
      phone,
      licenceType,
      drivingExperience: Number(drivingExperience),
      status: status || 'available',
      languagesKnown: parsedLanguages,
      carType,
      carModel,
      carNumber: carNumber ? carNumber.toUpperCase() : undefined,
      addedBy: req.user._id,
    };

    // Upload images if present
    const files = req.files || {};

    if (files.licenceImageFront && files.licenceImageFront[0]) {
      const result = await uploadToCloudinary(files.licenceImageFront[0].buffer);
      driverData.licenceImageFront = result.secure_url;
      driverData.licenceImageFrontPublicId = result.public_id;
    }

    if (files.licenceImageBack && files.licenceImageBack[0]) {
      const result = await uploadToCloudinary(files.licenceImageBack[0].buffer);
      driverData.licenceImageBack = result.secure_url;
      driverData.licenceImageBackPublicId = result.public_id;
    }

    if (files.driverPhoto && files.driverPhoto[0]) {
      const result = await uploadToCloudinary(files.driverPhoto[0].buffer);
      driverData.driverPhoto = result.secure_url;
      driverData.driverPhotoPublicId = result.public_id;
    }

    if (files.carFrontImage && files.carFrontImage[0]) {
      const result = await uploadToCloudinary(files.carFrontImage[0].buffer);
      driverData.carFrontImage = result.secure_url;
      driverData.carFrontImagePublicId = result.public_id;
    }

    const driver = new Driver(driverData);
    await driver.save();

    // Auto-create a User account for the driver
    // Email: <phone>@driver.nextdrive  |  Password: last 6 digits of phone
    try {
      const driverEmail = `${phone}@driver.nextdrive`;
      const rawPassword = phone.slice(-6);
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      let driverUser = await User.findOne({ email: driverEmail });
      if (!driverUser) {
        driverUser = await User.create({
          name,
          email: driverEmail,
          password: hashedPassword,
          role: 'driver',
          isVerified: true,
          phone,
        });
      } else {
        // Update name if driver was edited
        driverUser.name = name;
        await driverUser.save();
      }

      driver.userId = driverUser._id;
      await driver.save();
      console.log(`✅ Driver account: ${driverEmail} / pw: ${rawPassword}`);
    } catch (userErr) {
      console.error('⚠️ Could not auto-create driver user account:', userErr.message);
    }

    await driver.populate('addedBy', 'name email');
    res.status(201).json({ success: true, message: 'Driver created successfully', data: driver });
  } catch (error) {
    console.error('createDriver error:', error);
    res.status(500).json({ success: false, message: 'Failed to create driver', error: error.message });
  }
};

// PUT /api/drivers/:id
export const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const {
      name,
      phone,
      licenceType,
      drivingExperience,
      status,
      languagesKnown,
      carType,
      carModel,
      carNumber,
    } = req.body;

    // Update text fields if provided
    if (name !== undefined) driver.name = name;
    if (phone !== undefined) driver.phone = phone;
    if (licenceType !== undefined) driver.licenceType = licenceType;
    if (drivingExperience !== undefined) driver.drivingExperience = Number(drivingExperience);
    if (status !== undefined) driver.status = status;
    if (carType !== undefined) driver.carType = carType;
    if (carModel !== undefined) driver.carModel = carModel;
    if (carNumber !== undefined) driver.carNumber = carNumber.toUpperCase();

    if (languagesKnown !== undefined) {
      try {
        driver.languagesKnown =
          typeof languagesKnown === 'string' ? JSON.parse(languagesKnown) : languagesKnown;
      } catch {
        driver.languagesKnown = [];
      }
    }

    // Upload / replace images
    const files = req.files || {};

    if (files.licenceImageFront && files.licenceImageFront[0]) {
      await deleteFromCloudinary(driver.licenceImageFrontPublicId);
      const result = await uploadToCloudinary(files.licenceImageFront[0].buffer);
      driver.licenceImageFront = result.secure_url;
      driver.licenceImageFrontPublicId = result.public_id;
    }

    if (files.licenceImageBack && files.licenceImageBack[0]) {
      await deleteFromCloudinary(driver.licenceImageBackPublicId);
      const result = await uploadToCloudinary(files.licenceImageBack[0].buffer);
      driver.licenceImageBack = result.secure_url;
      driver.licenceImageBackPublicId = result.public_id;
    }

    if (files.driverPhoto && files.driverPhoto[0]) {
      await deleteFromCloudinary(driver.driverPhotoPublicId);
      const result = await uploadToCloudinary(files.driverPhoto[0].buffer);
      driver.driverPhoto = result.secure_url;
      driver.driverPhotoPublicId = result.public_id;
    }

    if (files.carFrontImage && files.carFrontImage[0]) {
      await deleteFromCloudinary(driver.carFrontImagePublicId);
      const result = await uploadToCloudinary(files.carFrontImage[0].buffer);
      driver.carFrontImage = result.secure_url;
      driver.carFrontImagePublicId = result.public_id;
    }

    await driver.save();
    await driver.populate('addedBy', 'name email');

    res.status(200).json({ success: true, message: 'Driver updated successfully', data: driver });
  } catch (error) {
    console.error('updateDriver error:', error);
    res.status(500).json({ success: false, message: 'Failed to update driver', error: error.message });
  }
};

// DELETE /api/drivers/:id
export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Delete all images from Cloudinary
    await Promise.all([
      deleteFromCloudinary(driver.licenceImageFrontPublicId),
      deleteFromCloudinary(driver.licenceImageBackPublicId),
      deleteFromCloudinary(driver.driverPhotoPublicId),
      deleteFromCloudinary(driver.carFrontImagePublicId),
    ]);

    await Driver.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('deleteDriver error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete driver', error: error.message });
  }
};

// PATCH /api/drivers/:id/toggle-status
export const toggleDriverStatus = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    driver.status = driver.status === 'available' ? 'unavailable' : 'available';
    await driver.save();

    res.status(200).json({ success: true, message: 'Driver status updated', data: driver });
  } catch (error) {
    console.error('toggleDriverStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle driver status', error: error.message });
  }
};

// ─── Driver Dashboard Endpoints ───────────────────────────────────────────────

// GET /api/drivers/dashboard/me
// Returns the Driver document linked to the logged-in driver user
export const getMyDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }
    res.json({ success: true, data: driver });
  } catch (error) {
    console.error('getMyDriverProfile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch driver profile', error: error.message });
  }
};

// GET /api/drivers/dashboard/rides
// Returns all car bookings where this driver is assigned
export const getMyRides = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const rides = await CarBooking.find({ assignedDriver: driver._id })
      .populate('user', 'name email phone')
      .sort({ pickupDate: 1 });

    // Today's rides
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayRides = rides.filter(r => {
      const d = new Date(r.pickupDate);
      return d >= todayStart && d <= todayEnd;
    });

    // Stats
    const stats = {
      total:     rides.length,
      pending:   rides.filter(r => r.status === 'pending').length,
      confirmed: rides.filter(r => r.status === 'confirmed').length,
      inProgress:rides.filter(r => r.status === 'in-progress').length,
      completed: rides.filter(r => r.status === 'completed').length,
      cancelled: rides.filter(r => r.status === 'cancelled').length,
      today:     todayRides.length,
    };

    res.json({ success: true, data: { rides, todayRides, stats } });
  } catch (error) {
    console.error('getMyRides error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rides', error: error.message });
  }
};

// PATCH /api/drivers/dashboard/rides/:bookingId/complete
// Driver can mark a confirmed/in-progress booking as completed
export const markRideComplete = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const booking = await CarBooking.findOne({
      _id: req.params.bookingId,
      assignedDriver: driver._id,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or not assigned to you' });
    }

    if (!['confirmed', 'in-progress'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed or in-progress bookings can be marked as completed',
      });
    }

    booking.status = 'completed';
    await booking.save();
    await booking.populate('user', 'name email phone');

    res.json({ success: true, message: 'Ride marked as completed', data: booking });
  } catch (error) {
    console.error('markRideComplete error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete ride', error: error.message });
  }
};

// POST /api/drivers/migrate-accounts  (admin only)
// One-time migration: create User accounts for drivers that don't have one yet
export const migrateDriverAccounts = async (req, res) => {
  try {
    const drivers = await Driver.find({ userId: null });
    const results = { created: 0, skipped: 0, errors: [] };

    for (const driver of drivers) {
      try {
        const driverEmail = `${driver.phone}@driver.nextdrive`;
        const rawPassword = driver.phone.slice(-6);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        let driverUser = await User.findOne({ email: driverEmail });
        if (!driverUser) {
          driverUser = await User.create({
            name: driver.name,
            email: driverEmail,
            password: hashedPassword,
            role: 'driver',
            isVerified: true,
            phone: driver.phone,
          });
          results.created++;
        } else {
          results.skipped++;
        }

        driver.userId = driverUser._id;
        await driver.save();
      } catch (err) {
        results.errors.push({ driver: driver.name, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Migration complete: ${results.created} created, ${results.skipped} already existed`,
      results,
    });
  } catch (error) {
    console.error('migrateDriverAccounts error:', error);
    res.status(500).json({ success: false, message: 'Migration failed', error: error.message });
  }
};
