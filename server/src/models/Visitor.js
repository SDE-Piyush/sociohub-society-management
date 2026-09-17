import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
      index: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      default: null,
    },
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Visitor phone number is required'],
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['GUEST', 'DELIVERY', 'CAB', 'SERVICE', 'MAINTENANCE', 'OTHER'],
      default: 'GUEST',
      index: true,
    },
    vehicleNumber: {
      type: String,
      default: '',
      trim: true,
    },
    entryType: {
      type: String,
      enum: ['PRE_APPROVED', 'WALK_IN'],
      default: 'PRE_APPROVED',
      index: true,
    },
    passCode: {
      type: String,
      index: true,
    },
    qrToken: {
      type: String,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'EXPECTED',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'CHECKED_IN',
        'CHECKED_OUT',
        'EXPIRED',
      ],
      default: 'EXPECTED',
      index: true,
    },
    expectedDate: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours validity default
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    checkedOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Pre-save to ensure 6-digit PIN and unique QR token
visitorSchema.pre('save', function (next) {
  if (!this.passCode) {
    this.passCode = Math.floor(100000 + Math.random() * 900000).toString();
  }
  if (!this.qrToken) {
    this.qrToken = `PASS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  next();
});

export const Visitor = mongoose.model('Visitor', visitorSchema);
export default Visitor;
