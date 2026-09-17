import express from 'express';
import {
  login,
  register,
  getRegistrationOptions,
  getMe,
  logout,
  updateProfile,
  forgotPassword,
  getPasswordResetRequests,
  approvePasswordResetRequest,
  rejectPasswordResetRequest,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/registration-options', getRegistrationOptions);
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);

// Admin Password Reset Approval Routes
router.get(
  '/password-reset-requests',
  protect,
  authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'),
  getPasswordResetRequests
);
router.patch(
  '/password-reset-requests/:id/approve',
  protect,
  authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'),
  approvePasswordResetRequest
);
router.patch(
  '/password-reset-requests/:id/reject',
  protect,
  authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'),
  rejectPasswordResetRequest
);

export default router;

