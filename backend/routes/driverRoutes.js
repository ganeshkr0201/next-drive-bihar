import express from 'express';
import multer from 'multer';
import { authenticateJWT, requireAdmin } from '../middlewares/auth.js';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  toggleDriverStatus,
} from '../controllers/driverControllers.js';

const router = express.Router();

// Multer with memory storage (for Cloudinary stream upload)
const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
}).fields([
  { name: 'licenceImageFront', maxCount: 1 },
  { name: 'licenceImageBack', maxCount: 1 },
  { name: 'driverPhoto', maxCount: 1 },
  { name: 'carFrontImage', maxCount: 1 },
]);

// All routes require JWT + admin
router.get('/', authenticateJWT, requireAdmin, getAllDrivers);
router.get('/:id', authenticateJWT, requireAdmin, getDriverById);
router.post('/', authenticateJWT, requireAdmin, multerUpload, createDriver);
router.put('/:id', authenticateJWT, requireAdmin, multerUpload, updateDriver);
router.delete('/:id', authenticateJWT, requireAdmin, deleteDriver);
router.patch('/:id/toggle-status', authenticateJWT, requireAdmin, toggleDriverStatus);

export default router;
