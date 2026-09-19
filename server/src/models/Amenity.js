import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['CLUBHOUSE', 'SPORTS', 'FITNESS', 'LEISURE', 'OTHER'],
      default: 'LEISURE',
    },
    capacity: {
      type: Number,
      default: 50,
    },
    location: {
      type: String,
      default: 'Central Complex',
    },
    icon: {
      type: String,
      default: 'CalendarDays',
    },
    hourlyRate: {
      type: Number,
      default: 0, // 0 = Free for residents
    },
    rules: {
      type: [String],
      default: [
        'Booking must be made at least 1 hour in advance.',
        'Please keep the facility clean and tidy after use.',
        'No loud music past 10:00 PM.',
      ],
    },
    openingTime: {
      type: String,
      default: '06:00',
    },
    closingTime: {
      type: String,
      default: '22:00',
    },
    slotDurationMinutes: {
      type: Number,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Amenity = mongoose.model('Amenity', amenitySchema);
export default Amenity;
