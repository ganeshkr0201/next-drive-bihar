import { cloudinary } from '../config/cloudinary.js';
import Driver from '../models/Driver.js';

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
