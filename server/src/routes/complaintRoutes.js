import express from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createComplaint)
  .get(getComplaints);

router.route('/:id')
  .get(getComplaintById);

router.route('/:id/status')
  .patch(authorize('SOCIETY_ADMIN', 'SUPER_ADMIN', 'SECURITY'), updateComplaintStatus);

export default router;
