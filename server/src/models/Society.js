import mongoose from 'mongoose';

const societySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Society name is required'],
      trim: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: 'Pune' },
      state: { type: String, default: 'Maharashtra' },
      pincode: { type: String, default: '411045' },
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    gateCount: {
      type: Number,
      default: 2,
    },
    settings: {
      currency: { type: String, default: 'INR' },
      maintenanceDueDay: { type: Number, default: 5 },
      latePenaltyPercentage: { type: Number, default: 5 },
      upiId: { type: String, default: 'emeraldheights@upi' },
      accountName: { type: String, default: 'Emerald Heights Residency' },
    },
  },
  { timestamps: true }
);

export const Society = mongoose.model('Society', societySchema);
export default Society;
