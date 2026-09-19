import express from 'express';
import {
  submitPayment,
  getMyPayments,
  getAllPayments,
  verifyCashPayment,
  updateSocietyUpi,
  createRazorpayOrder,
  verifyRazorpayPayment,
  downloadReceiptPdf,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Resident payment endpoints
router.post('/submit', protect, submitPayment);
router.get('/my-payments', protect, getMyPayments);
router.patch('/settings/upi', protect, updateSocietyUpi);

// Online Payment Gateway (Razorpay)
router.post('/razorpay/order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

// PDF Receipt Download
router.get('/:id/receipt-pdf', protect, downloadReceiptPdf);

// Admin-only payment endpoints
router.get('/', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), getAllPayments);
router.put('/:id/verify-cash', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), verifyCashPayment);

export default router;
