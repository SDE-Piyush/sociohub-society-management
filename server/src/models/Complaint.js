import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },
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
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'PLUMBING',
        'ELECTRICAL',
        'ELEVATOR',
        'SECURITY',
        'CARPENTRY',
        'CLEANLINESS',
        'NOISE',
        'PARKING',
        'OTHER',
      ],
      default: 'OTHER',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'PENDING',
      index: true,
    },
    images: [
      {
        type: String,
      },
    ],
    assignedTo: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      role: { type: String, default: '' },
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    activityLog: [activityLogSchema],
  },
  { timestamps: true }
);

// Auto-generate unique ticket number
complaintSchema.pre('save', function (next) {
  if (!this.ticketNumber) {
    const year = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    this.ticketNumber = `TKT-${year}-${randomCode}`;
  }
  next();
});

export const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
