import express from 'express';
import {
  getAllGalleryImages,
  getAdminGalleryImages,
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
} from '../controllers/galleryControllers.js';
import { authenticateJWT, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/public', getAllGalleryImages);

// Admin routes
router.get('/admin', authenticateJWT, requireAdmin, getAdminGalleryImages);
router.post('/', authenticateJWT, requireAdmin, uploadGalleryImage);
router.put('/:id', authenticateJWT, requireAdmin, updateGalleryImage);
router.delete('/:id', authenticateJWT, requireAdmin, deleteGalleryImage);

export default router;
