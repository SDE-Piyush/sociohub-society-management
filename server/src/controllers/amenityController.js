import Amenity from '../models/Amenity.js';
import AmenityBooking from '../models/AmenityBooking.js';
import Flat from '../models/Flat.js';

/**
 * Helper: Generate standard 1-hour time slots from opening to closing time
 */
const generateSlots = (openingTime = '06:00', closingTime = '22:00', slotDuration = 60) => {
  const slots = [];
  const [openHour] = openingTime.split(':').map(Number);
  const [closeHour] = closingTime.split(':').map(Number);

  for (let hour = openHour; hour < closeHour; hour++) {
    const startStr = `${hour.toString().padStart(2, '0')}:00`;
    const endStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push({
      startTime: startStr,
      endTime: endStr,
      label: `${startStr} - ${endStr}`,
    });
  }
  return slots;
};

/**
 * @desc    Get all active amenities in society
 * @route   GET /api/amenities
 * @access  Private
 */
export const getAmenities = async (req, res, next) => {
  try {
    const societyId = req.user.societyId._id || req.user.societyId;
    const amenities = await Amenity.find({ societyId, isActive: true }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: amenities.length,
      data: amenities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Create a new amenity
 * @route   POST /api/amenities
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const createAmenity = async (req, res, next) => {
  try {
    const societyId = req.user.societyId._id || req.user.societyId;
    const {
      name,
      code,
      description,
      category,
      capacity,
      location,
      icon,
      hourlyRate,
      rules,
      openingTime,
      closingTime,
    } = req.body;

    const amenity = await Amenity.create({
      societyId,
      name,
      code: code ? code.toUpperCase() : name.replace(/\s+/g, '_').toUpperCase(),
      description,
      category: category || 'LEISURE',
      capacity: capacity || 30,
      location: location || 'Central Complex',
      icon: icon || 'CalendarDays',
      hourlyRate: Number(hourlyRate) || 0,
      rules: Array.isArray(rules) ? rules : (rules ? rules.split('\n') : []),
      openingTime: openingTime || '06:00',
      closingTime: closingTime || '22:00',
    });

    res.status(201).json({
      success: true,
      message: `Amenity "${name}" created successfully.`,
      data: amenity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get visual slot availability for a specific amenity and date
 * @route   GET /api/amenities/:id/availability
 * @access  Private
 */
export const getAmenityAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    const bookingDate = date || new Date().toISOString().split('T')[0]; // Format 'YYYY-MM-DD'
    const amenityId = req.params.id;
    const currentUserId = req.user._id.toString();

    const amenity = await Amenity.findById(amenityId);
    if (!amenity) {
      return res.status(404).json({ success: false, message: 'Amenity not found.' });
    }

    // Find all confirmed bookings for this amenity on the selected date
    const bookings = await AmenityBooking.find({
      amenityId,
      bookingDate,
      status: 'CONFIRMED',
    })
      .populate('userId', 'name email phone')
      .populate('flatId', 'flatNumber');

    // Generate full day slots
    const allSlots = generateSlots(amenity.openingTime, amenity.closingTime, amenity.slotDurationMinutes);

    const slotGrid = allSlots.map((slot) => {
      const match = bookings.find((b) => b.startTime === slot.startTime);
      if (match) {
        const isMine = match.userId?._id?.toString() === currentUserId;
        return {
          ...slot,
          isBooked: true,
          isBookedByMe: isMine,
          bookingId: match._id,
          bookingRef: match.bookingRef,
          residentName: isMine ? 'You' : (match.userId?.name || 'Resident'),
          flatNumber: match.flatId?.flatNumber || '',
          purpose: match.purpose,
        };
      }
      return {
        ...slot,
        isBooked: false,
        isBookedByMe: false,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        amenity,
        bookingDate,
        slots: slotGrid,
        totalSlots: slotGrid.length,
        availableSlotsCount: slotGrid.filter((s) => !s.isBooked).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Book an amenity slot (Atomic Collision Prevention)
 * @route   POST /api/amenities/book
 * @access  Private (Resident, Admin)
 */
export const bookAmenitySlot = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.flatId) {
      return res.status(400).json({
        success: false,
        message: 'You must have an assigned flat to reserve society amenities.',
      });
    }

    const { amenityId, bookingDate, startTime, endTime, purpose, guestCount } = req.body;

    if (!amenityId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide amenityId, bookingDate (YYYY-MM-DD), startTime, and endTime.',
      });
    }

    const amenity = await Amenity.findById(amenityId);
    if (!amenity || !amenity.isActive) {
      return res.status(404).json({ success: false, message: 'Amenity is not available for bookings.' });
    }

    // Atomic Double-Booking Check
    const existing = await AmenityBooking.findOne({
      amenityId,
      bookingDate,
      startTime,
      status: 'CONFIRMED',
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Slot ${startTime} - ${endTime} on ${bookingDate} is already reserved by another resident!`,
      });
    }

    const totalCharges = amenity.hourlyRate || 0;

    const booking = await AmenityBooking.create({
      societyId: user.societyId._id || user.societyId,
      amenityId,
      userId: user._id,
      flatId: user.flatId._id || user.flatId,
      bookingDate,
      startTime,
      endTime,
      purpose: purpose || 'Recreation',
      guestCount: Number(guestCount) || 1,
      totalCharges,
      status: 'CONFIRMED',
    });

    const populated = await AmenityBooking.findById(booking._id)
      .populate('amenityId', 'name location hourlyRate icon')
      .populate('flatId', 'flatNumber');

    res.status(201).json({
      success: true,
      message: `Reservation confirmed for ${amenity.name} (${startTime} - ${endTime})!`,
      data: populated,
    });
  } catch (error) {
    // Catch MongoDB duplicate key error code 11000 from the compound unique index
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Double-booking collision prevented! This slot was just booked by another resident.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get current resident's bookings
 * @route   GET /api/amenities/my-bookings
 * @access  Private (Resident)
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await AmenityBooking.find({ userId: req.user._id })
      .populate('amenityId', 'name code category location icon hourlyRate')
      .populate('flatId', 'flatNumber')
      .sort({ bookingDate: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel booking
 * @route   PUT /api/amenities/bookings/:id/cancel
 * @access  Private (Resident, Admin)
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await AmenityBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isAdmin = req.user.role === 'SOCIETY_ADMIN' || req.user.role === 'SUPER_ADMIN';
    const isOwner = booking.userId.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancelReason = req.body.reason || 'Cancelled by resident';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking successfully cancelled.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Get all society amenity bookings
 * @route   GET /api/amenities/all-bookings
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const getAllSocietyBookings = async (req, res, next) => {
  try {
    const societyId = req.user.societyId._id || req.user.societyId;
    const { date, amenityId } = req.query;

    const query = { societyId };
    if (date) query.bookingDate = date;
    if (amenityId && amenityId !== 'ALL') query.amenityId = amenityId;

    const bookings = await AmenityBooking.find(query)
      .populate('amenityId', 'name code location hourlyRate')
      .populate('userId', 'name email phone')
      .populate('flatId', 'flatNumber')
      .sort({ bookingDate: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};
