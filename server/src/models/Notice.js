import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['GENERAL', 'MAINTENANCE', 'EMERGENCY', 'EVENT', 'RULE', 'SECURITY', 'BILLING'],
      default: 'GENERAL',
      index: true,
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'URGENT', 'UPCOMING'],
      default: 'NORMAL',
      index: true,
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'OWNERS', 'TENANTS'],
      default: 'ALL',
      index: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    attachments: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;
