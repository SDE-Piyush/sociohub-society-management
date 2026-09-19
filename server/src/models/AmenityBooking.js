import mongoose from 'mongoose';

const amenityBookingSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    amenityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Amenity',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
    },
    bookingDate: {
      type: String, // Stored as 'YYYY-MM-DD' for exact slot indexing
      required: true,
      index: true,
    },
    startTime: {
      type: String, // e.g. '18:00'
      required: true,
    },
    endTime: {
      type: String, // e.g. '19:00'
      required: true,
    },
    purpose: {
      type: String,
      default: 'Recreation',
    },
    guestCount: {
      type: Number,
      default: 1,
    },
    totalCharges: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'CONFIRMED',
      index: true,
    },
    bookingRef: {
      type: String,
      unique: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Atomic Double-Booking Prevention: Partial unique index on active CONFIRMED bookings
amenityBookingSchema.index(
  { amenityId: 1, bookingDate: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: 'CONFIRMED' } }
);

// Pre-save hook for booking reference
amenityBookingSchema.pre('save', function (next) {
  if (!this.bookingRef) {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.bookingRef = `BKG-${Date.now().toString().slice(-4)}-${random}`;
  }
  next();
});

export const AmenityBooking = mongoose.model('AmenityBooking', amenityBookingSchema);
export default AmenityBooking;
