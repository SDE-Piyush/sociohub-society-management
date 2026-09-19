import express from 'express';
import {
  getPolls,
  createPoll,
  voteOnPoll,
  closePoll,
} from '../controllers/pollController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getPolls);
router.post('/:id/vote', protect, voteOnPoll);

// Admin-only poll management
router.post('/', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), createPoll);
router.patch('/:id/close', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), closePoll);

export default router;
