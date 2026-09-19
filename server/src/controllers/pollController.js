import Poll from '../models/Poll.js';

/**
 * Helper: Compute poll statistics (vote totals, percentages) and user vote status
 */
const formatPollForUser = (poll, user) => {
  const pollObj = poll.toObject ? poll.toObject() : poll;
  const totalVotes = pollObj.options.reduce((sum, opt) => sum + (opt.votesCount || 0), 0);

  const flatIdStr = user?.flatId?._id?.toString() || user?.flatId?.toString();
  const userIdStr = user?._id?.toString();

  const userVote = (pollObj.votes || []).find(
    (v) => (flatIdStr && v.flatId?.toString() === flatIdStr) || v.userId?.toString() === userIdStr
  );

  const optionsWithPercentages = pollObj.options.map((opt) => ({
    optionId: opt.optionId,
    text: opt.text,
    votesCount: opt.votesCount || 0,
    percentage: totalVotes > 0 ? Math.round(((opt.votesCount || 0) / totalVotes) * 100) : 0,
    isSelectedByMe: userVote?.optionId === opt.optionId,
  }));

  return {
    _id: pollObj._id,
    question: pollObj.question,
    description: pollObj.description,
    category: pollObj.category,
    status: pollObj.status,
    targetAudience: pollObj.targetAudience,
    startDate: pollObj.startDate,
    endDate: pollObj.endDate,
    createdBy: pollObj.createdBy,
    createdAt: pollObj.createdAt,
    totalVotes,
    hasVoted: !!userVote,
    myVotedOptionId: userVote?.optionId || null,
    options: optionsWithPercentages,
    isExpired: new Date(pollObj.endDate) < new Date(),
  };
};

/**
 * @desc    Get all society community polls with live percentage calculations
 * @route   GET /api/polls
 * @access  Private
 */
export const getPolls = async (req, res, next) => {
  try {
    const societyId = req.user.societyId._id || req.user.societyId;
    const { status } = req.query;

    const query = { societyId };
    if (status && status !== 'ALL') query.status = status;

    const polls = await Poll.find(query)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    const formatted = polls.map((p) => formatPollForUser(p, req.user));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Create new community poll
 * @route   POST /api/polls
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const createPoll = async (req, res, next) => {
  try {
    const societyId = req.user.societyId._id || req.user.societyId;
    const { question, description, category, options, endDate, targetAudience } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A poll requires a question and at least 2 options.',
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a voting expiration date.',
      });
    }

    const formattedOptions = options.map((opt, idx) => ({
      optionId: `opt-${idx + 1}`,
      text: typeof opt === 'string' ? opt.trim() : opt.text.trim(),
      votesCount: 0,
    }));

    const poll = await Poll.create({
      societyId,
      createdBy: req.user._id,
      question: question.trim(),
      description: description || '',
      category: category || 'GENERAL',
      options: formattedOptions,
      votes: [],
      targetAudience: targetAudience || 'ALL',
      endDate: new Date(endDate),
      status: 'ACTIVE',
    });

    const populated = await Poll.findById(poll._id).populate('createdBy', 'name role');

    // Notify connected residents via Socket.IO
    if (req.io) {
      req.io.to(`society_${societyId}`).emit('new_poll_created', {
        pollId: poll._id,
        question: poll.question,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Community poll published successfully!',
      data: formatPollForUser(populated, req.user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cast vote on a poll (Enforces 1 vote per flat)
 * @route   POST /api/polls/:id/vote
 * @access  Private (Resident, Admin)
 */
export const voteOnPoll = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.flatId && user.role === 'RESIDENT') {
      return res.status(400).json({
        success: false,
        message: 'You must have an assigned flat to cast a vote.',
      });
    }

    const { optionId } = req.body;
    if (!optionId) {
      return res.status(400).json({ success: false, message: 'Please select an option to vote.' });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found.' });
    }

    if (poll.status === 'CLOSED' || new Date(poll.endDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Voting on this poll has concluded.' });
    }

    const flatIdStr = user.flatId?._id?.toString() || user.flatId?.toString();
    const userIdStr = user._id.toString();

    // Enforce 1 vote per flat (or 1 per user)
    const existingVote = poll.votes.find(
      (v) => (flatIdStr && v.flatId?.toString() === flatIdStr) || v.userId?.toString() === userIdStr
    );

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'Your flat has already cast a vote in this community poll.',
      });
    }

    const targetOption = poll.options.find((opt) => opt.optionId === optionId);
    if (!targetOption) {
      return res.status(400).json({ success: false, message: 'Invalid option selected.' });
    }

    // Record vote
    poll.votes.push({
      userId: user._id,
      flatId: user.flatId?._id || user.flatId || user._id,
      optionId,
      votedAt: new Date(),
    });

    targetOption.votesCount = (targetOption.votesCount || 0) + 1;
    await poll.save();

    const formatted = formatPollForUser(poll, user);

    // Broadcast updated percentages live to all connected society members
    if (req.io) {
      req.io.to(`society_${poll.societyId}`).emit('poll_vote_update', {
        pollId: poll._id,
        totalVotes: formatted.totalVotes,
        options: formatted.options,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Your vote has been recorded successfully!',
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Close poll
 * @route   PATCH /api/polls/:id/close
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const closePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found.' });
    }

    poll.status = 'CLOSED';
    await poll.save();

    res.status(200).json({
      success: true,
      message: 'Poll has been closed.',
      data: formatPollForUser(poll, req.user),
    });
  } catch (error) {
    next(error);
  }
};
