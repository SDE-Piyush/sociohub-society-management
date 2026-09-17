import express from 'express';
import {
  getUsers,
  createUser,
  deleteUser,
  approveUser,
  toggleUserStatus,
  resetUserPassword,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getUsers)
  .post(protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), createUser);

router
  .route('/:id')
  .delete(protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), deleteUser);

router
  .route('/:id/approve')
  .patch(protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), approveUser);

router
  .route('/:id/toggle-status')
  .patch(protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), toggleUserStatus);

router
  .route('/:id/reset-password')
  .patch(protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), resetUserPassword);

export default router;

