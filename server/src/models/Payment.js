import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
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
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String,
      required: true,
      default: 'October 2026',
    },
    year: {
      type: Number,
      default: 2026,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'CASH'],
      required: true,
    },
    upiId: {
      type: String,
      default: 'piyush09@ptaxis',
    },
    transactionRef: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING_CASH_VERIFICATION', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED',
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    receiptNumber: {
      type: String,
      unique: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate receipt number if completed
paymentSchema.pre('save', function (next) {
  if (!this.receiptNumber) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.receiptNumber = `RCP-${this.year || 2026}-${randomSuffix}`;
  }
  next();
});

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
