// Cloudinary configuration for image storage
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for profile avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nextdrive/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      // Use user ID for consistent naming
      return `avatar_${req.user.id}_${Date.now()}`;
    },
  },
});

// Storage configuration for tour package images
const tourStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nextdrive/tours',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      // Use timestamp and original name for uniqueness
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0];
      return `tour_${timestamp}_${originalName}`;
    },
  },
});

// Multer configurations
const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

const tourUpload = multer({
  storage: tourStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Utility functions for image management
const cloudinaryUtils = {
  // Delete image by public_id
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('Image deleted from Cloudinary:', result);
      return result;
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  },

  // Delete multiple images
  async deleteImages(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      console.log('Multiple images deleted from Cloudinary:', result);
      return result;
    } catch (error) {
      console.error('Error deleting multiple images from Cloudinary:', error);
      throw error;
    }
  },

  // Extract public_id from Cloudinary URL
  extractPublicId(cloudinaryUrl) {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
      return null;
    }
    
    try {
      // Extract public_id from URL
      // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/nextdrive/avatars/avatar_123_1234567890.jpg
      const urlParts = cloudinaryUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) return null;
      
      // Get everything after version (v1234567890)
      const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
      
      // Remove file extension
      const publicId = pathAfterVersion.replace(/\.[^/.]+$/, '');
      
      return publicId;
    } catch (error) {
      console.error('Error extracting public_id:', error);
      return null;
    }
  },

  // Get optimized URL for different sizes
  getOptimizedUrl(publicId, options = {}) {
    const {
      width = 'auto',
      height = 'auto',
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: format,
    });
  },

  // Generate thumbnail URL
  getThumbnailUrl(publicId, size = 150) {
    return this.getOptimizedUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill'
    });
  },

  // Validate Cloudinary URL
  isCloudinaryUrl(url) {
    return url && url.includes('cloudinary.com');
  }
};

export {
  cloudinary,
  avatarUpload,
  tourUpload,
  cloudinaryUtils,
  avatarStorage,
  tourStorage
};