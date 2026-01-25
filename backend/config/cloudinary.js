import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary utility functions
export const cloudinaryUtils = {
  // Delete a single image by public_id
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`🗑️ Deleted image from Cloudinary: ${publicId}`, result);
      return result;
    } catch (error) {
      console.error(`❌ Failed to delete image from Cloudinary: ${publicId}`, error);
      throw error;
    }
  },

  // Delete multiple images by public_ids
  async deleteImages(publicIds) {
    try {
      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        return { deleted: [] };
      }

      const results = await Promise.allSettled(
        publicIds.map(publicId => this.deleteImage(publicId))
      );

      const deleted = [];
      const failed = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          deleted.push(publicIds[index]);
        } else {
          failed.push({ publicId: publicIds[index], error: result.reason });
        }
      });

      console.log(`🗑️ Deleted ${deleted.length} images from Cloudinary`);
      if (failed.length > 0) {
        console.warn(`⚠️ Failed to delete ${failed.length} images:`, failed);
      }

      return { deleted, failed };
    } catch (error) {
      console.error('❌ Failed to delete multiple images from Cloudinary:', error);
      throw error;
    }
  },

  // Delete all images in a folder
  async deleteFolder(folderPath) {
    try {
      const result = await cloudinary.api.delete_resources_by_prefix(folderPath);
      console.log(`🗑️ Deleted folder from Cloudinary: ${folderPath}`, result);
      return result;
    } catch (error) {
      console.error(`❌ Failed to delete folder from Cloudinary: ${folderPath}`, error);
      throw error;
    }
  },

  // Get image details
  async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      console.error(`❌ Failed to get image details: ${publicId}`, error);
      throw error;
    }
  }
};

// Configure Cloudinary storage for tour packages
const tourStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nextdrive/tours',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'fill', quality: 'auto' }
    ]
  },
});

// Configure Cloudinary storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nextdrive/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', quality: 'auto', gravity: 'face' }
    ]
  },
});

// Create multer instances
const tourUpload = multer({ 
  storage: tourStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10
  }
});

const avatarUpload = multer({ 
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1
  }
});

// Export cloudinary instance, utilities, and upload middlewares
export { cloudinary, tourUpload, avatarUpload };