import Gallery from '../models/Gallery.js';
import { cloudinary } from '../config/cloudinary.js';

// Get all gallery images (public)
export const getAllGalleryImages = async (req, res) => {
  try {
    const { category } = req.query;
    
    const filter = { isActive: true };
    if (category && category !== 'all') {
      filter.category = category;
    }

    const images = await Gallery.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery images',
      error: error.message
    });
  }
};

// Get all gallery images for admin (includes inactive)
export const getAdminGalleryImages = async (req, res) => {
  try {
    const { category } = req.query;
    
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    const images = await Gallery.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error fetching admin gallery images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery images',
      error: error.message
    });
  }
};

// Upload new gallery image
export const uploadGalleryImage = async (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { title, description, category } = req.body;
    let imageUrl = req.body.imageUrl;

    if (!title) {
      console.log('❌ Title is missing');
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // Handle file upload if present
    if (req.file) {
      console.log('📁 File detected, uploading to Cloudinary...');
      try {
        // Upload buffer to Cloudinary
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'gallery',
              resource_type: 'image'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });

        const result = await uploadPromise;
        imageUrl = result.secure_url;
        console.log('✅ Cloudinary upload successful:', imageUrl);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to Cloudinary',
          error: uploadError.message
        });
      }
    }

    if (!imageUrl) {
      console.log('❌ No image provided');
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    console.log('💾 Creating gallery entry...');
    const newImage = new Gallery({
      title,
      description,
      imageUrl,
      category: category || 'other',
      uploadedBy: req.user._id
    });

    await newImage.save();
    await newImage.populate('uploadedBy', 'name email');

    console.log('✅ Gallery image created successfully');
    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: newImage
    });
  } catch (error) {
    console.error('❌ Error uploading gallery image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

// Update gallery image
export const updateGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, isActive } = req.body;
    let imageUrl = req.body.imageUrl;

    const image = await Gallery.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Handle file upload if present
    if (req.file) {
      try {
        // Delete old image from Cloudinary if it exists
        if (image.imageUrl && image.imageUrl.includes('cloudinary.com')) {
          try {
            const publicId = image.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`gallery/${publicId}`);
          } catch (deleteError) {
            console.error('Error deleting old image from Cloudinary:', deleteError);
          }
        }

        // Upload new image buffer to Cloudinary
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'gallery',
              resource_type: 'image'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });

        const result = await uploadPromise;
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to Cloudinary',
          error: uploadError.message
        });
      }
    }

    if (title) image.title = title;
    if (description !== undefined) image.description = description;
    if (category) image.category = category;
    if (isActive !== undefined) image.isActive = isActive;
    if (imageUrl) image.imageUrl = imageUrl;

    await image.save();
    await image.populate('uploadedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      data: image
    });
  } catch (error) {
    console.error('Error updating gallery image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update image',
      error: error.message
    });
  }
};

// Delete gallery image
export const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Gallery.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Try to delete from Cloudinary if it's a Cloudinary URL
    if (image.imageUrl.includes('cloudinary.com')) {
      try {
        const publicId = image.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`gallery/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }

    await Gallery.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};
