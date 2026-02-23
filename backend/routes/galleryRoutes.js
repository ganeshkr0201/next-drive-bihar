import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getAllGalleryImages,
  getAdminGalleryImages,
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
} from '../controllers/galleryControllers.js';
import { authenticateJWT, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Configure multer for memory storage (better for Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Public routes
router.get('/public', getAllGalleryImages);

// Admin routes
router.get('/admin', authenticateJWT, requireAdmin, getAdminGalleryImages);
router.post('/', authenticateJWT, requireAdmin, upload.single('image'), uploadGalleryImage);
router.put('/:id', authenticateJWT, requireAdmin, upload.single('image'), updateGalleryImage);
router.delete('/:id', authenticateJWT, requireAdmin, deleteGalleryImage);

export default router;
