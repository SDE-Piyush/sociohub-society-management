import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      required: true,
    },
    month: {
      type: String,
      required: true, // e.g. "September 2026", "October 2026"
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    billNumber: {
      type: String,
      required: true,
      unique: true, // e.g. "INV-2026-09-A101"
    },
    baseAmount: {
      type: Number,
      required: true, // e.g. 4200 from flat.monthlyMaintenance
    },
    utilityCharges: {
      type: Number,
      default: 0, // e.g. 250 for water, DG diesel, sinking fund
    },
    lateFine: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true, // baseAmount + utilityCharges + lateFine
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PENDING_VERIFICATION', 'PAID', 'OVERDUE'],
      default: 'UNPAID',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: '', // 'UPI' | 'CASH' | 'CARD'
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure 1 bill per flat per month
billSchema.index({ flatId: 1, month: 1 }, { unique: true });

const Bill = mongoose.model('Bill', billSchema);
export default Bill;
