import express from 'express';
import {
  getAllGalleryImages,
  getAdminGalleryImages,
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
} from '../controllers/galleryControllers.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/public', getAllGalleryImages);

// Admin routes
router.get('/admin', protect, adminOnly, getAdminGalleryImages);
router.post('/', protect, adminOnly, uploadGalleryImage);
router.put('/:id', protect, adminOnly, updateGalleryImage);
router.delete('/:id', protect, adminOnly, deleteGalleryImage);

export default router;
