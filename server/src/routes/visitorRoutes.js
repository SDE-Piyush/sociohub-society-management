import express from 'express';
import {
  preApproveVisitor,
  getResidentVisitors,
  createWalkInVisitor,
  respondToVisitorArrival,
  verifyPass,
  checkOutVisitor,
  getGateLogs,
  getPendingApproval,
} from '../controllers/visitorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Resident visitor passes
router.post('/pre-approve', preApproveVisitor);
router.get('/my-visitors', getResidentVisitors);
router.get('/pending-approval', getPendingApproval);
router.patch('/:id/respond', respondToVisitorArrival);

// Security gatekeeper routes
router.post('/walk-in', authorize('SECURITY', 'SOCIETY_ADMIN', 'SUPER_ADMIN'), createWalkInVisitor);
router.post('/verify-pass', authorize('SECURITY', 'SOCIETY_ADMIN', 'SUPER_ADMIN'), verifyPass);
router.patch('/:id/checkout', authorize('SECURITY', 'SOCIETY_ADMIN', 'SUPER_ADMIN'), checkOutVisitor);
router.get('/gate-logs', authorize('SECURITY', 'SOCIETY_ADMIN', 'SUPER_ADMIN'), getGateLogs);

export default router;
