import express from 'express';
import { getSociety, updateSociety } from '../controllers/societyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getSociety)
  .put(protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), updateSociety);

export default router;
