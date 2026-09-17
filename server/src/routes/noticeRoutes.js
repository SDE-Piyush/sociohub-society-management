import express from 'express';
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  togglePinNotice,
} from '../controllers/noticeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All notice routes require login
router.use(protect);

router.route('/')
  .get(getNotices)
  .post(authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), createNotice);

router.route('/:id')
  .put(authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), updateNotice)
  .delete(authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), deleteNotice);

router.route('/:id/pin')
  .patch(authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), togglePinNotice);

export default router;
