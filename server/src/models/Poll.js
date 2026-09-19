import mongoose from 'mongoose';

const pollOptionSchema = new mongoose.Schema({
  optionId: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  votesCount: {
    type: Number,
    default: 0,
  },
});

const pollVoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  flatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: true,
  },
  optionId: {
    type: String,
    required: true,
  },
  votedAt: {
    type: Date,
    default: Date.now,
  },
});

const pollSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['GENERAL', 'AMENITIES', 'MAINTENANCE', 'FESTIVAL', 'SECURITY', 'RULES'],
      default: 'GENERAL',
    },
    options: {
      type: [pollOptionSchema],
      validate: [
        (val) => val.length >= 2,
        'A poll must have at least 2 options to choose from.',
      ],
    },
    votes: [pollVoteSchema],
    targetAudience: {
      type: String,
      enum: ['ALL', 'OWNERS', 'TENANTS'],
      default: 'ALL',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

export const Poll = mongoose.model('Poll', pollSchema);
export default Poll;
