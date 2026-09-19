import express from 'express';
import {
  getAmenities,
  createAmenity,
  getAmenityAvailability,
  bookAmenitySlot,
  getMyBookings,
  cancelBooking,
  getAllSocietyBookings,
} from '../controllers/amenityController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicly accessible to authenticated residents & admins
router.get('/', protect, getAmenities);
router.get('/my-bookings', protect, getMyBookings);
router.get('/:id/availability', protect, getAmenityAvailability);
router.post('/book', protect, bookAmenitySlot);
router.put('/bookings/:id/cancel', protect, cancelBooking);

// Admin-only routes
router.post('/', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), createAmenity);
router.get('/all-bookings', protect, authorize('SOCIETY_ADMIN', 'SUPER_ADMIN'), getAllSocietyBookings);

export default router;
