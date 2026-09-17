import express from 'express';
import {
  getAllFlats,
  getFlatsByBuilding,
  getPublicFlatsByBuilding,
  createFlat,
  assignResident,
  unassignResident,
  updateFlat,
} from '../controllers/flatController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/public/:buildingId', getPublicFlatsByBuilding);

router
  .route('/')
  .get(protect, getAllFlats)
  .post(protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), createFlat);

router.get('/building/:buildingId', protect, getFlatsByBuilding);

router.post('/:id/assign', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), assignResident);
router.post('/:id/unassign', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), unassignResident);
router.put('/:id', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), updateFlat);

export default router;
