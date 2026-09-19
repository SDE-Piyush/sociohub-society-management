import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  generateBatchBills,
  getMyBills,
  getAllBills,
  downloadInvoicePdf,
  deleteBill,
  cleanVacantBills,
} from '../controllers/billController.js';

const router = express.Router();

router.use(protect);

router.post('/generate-batch', authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), generateBatchBills);
router.post('/cleanup-vacant', authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), cleanVacantBills);
router.get('/my-bills', authorize('RESIDENT'), getMyBills);
router.get('/', authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), getAllBills);
router.get('/:id/invoice-pdf', downloadInvoicePdf);
router.delete('/:id', authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), deleteBill);

export default router;
