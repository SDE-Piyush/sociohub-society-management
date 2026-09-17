import express from 'express';
import {
  getBuildings,
  getPublicBuildings,
  createBuilding,
  getBuildingById,
  deleteBuilding,
} from '../controllers/buildingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/public', getPublicBuildings);

router
  .route('/')
  .get(protect, getBuildings)
  .post(protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), createBuilding);

router
  .route('/:id')
  .get(protect, getBuildingById)
  .delete(protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), deleteBuilding);

export default router;
