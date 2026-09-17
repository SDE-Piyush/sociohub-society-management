import mongoose from 'mongoose';

const flatSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      required: [true, 'Building/Wing ID is required'],
      index: true,
    },
    flatNumber: {
      type: String,
      required: [true, 'Flat number is required (e.g. 101, 204)'],
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      default: 1,
    },
    type: {
      type: String,
      enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'PENTHOUSE', 'STUDIO'],
      default: '2BHK',
    },
    areaSqFt: {
      type: Number,
      default: 1100,
    },
    occupancyStatus: {
      type: String,
      enum: ['VACANT', 'OWNER_OCCUPIED', 'TENANT_OCCUPIED'],
      default: 'VACANT',
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    monthlyMaintenance: {
      type: Number,
      default: 3500,
    },
    parkingSlot: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound unique index: Flat numbers must be unique within a wing/building
flatSchema.index({ buildingId: 1, flatNumber: 1 }, { unique: true });

export const Flat = mongoose.model('Flat', flatSchema);
export default Flat;
