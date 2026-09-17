import express from 'express';
import {
  submitPayment,
  getMyPayments,
  getAllPayments,
  verifyCashPayment,
  updateSocietyUpi,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/submit', protect, submitPayment);
router.get('/my-payments', protect, getMyPayments);
router.patch('/settings/upi', protect, updateSocietyUpi);

// Admin-only payment endpoints
router.get('/', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), getAllPayments);
router.put('/:id/verify-cash', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), verifyCashPayment);

export default router;
