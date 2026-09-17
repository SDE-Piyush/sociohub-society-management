import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Building/Wing name is required (e.g. Wing A)'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: function () {
        return this.name ? this.name.charAt(0) : 'W';
      },
    },
    totalFloors: {
      type: Number,
      default: 10,
      min: 1,
    },
    flatsPerFloor: {
      type: Number,
      default: 4,
      min: 1,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index to ensure building names are unique within a society
buildingSchema.index({ societyId: 1, name: 1 }, { unique: true });

export const Building = mongoose.model('Building', buildingSchema);
export default Building;
