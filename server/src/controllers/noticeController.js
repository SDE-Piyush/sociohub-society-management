import Notice from '../models/Notice.js';

/**
 * @desc    Get all notices for the user's society with audience & category filtering
 * @route   GET /api/notices
 * @access  Private (All authenticated roles)
 */
export const getNotices = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'User is not linked to any society.' });
    }

    const { category, priority, search } = req.query;
    const filter = { societyId };

    // Audience filtering based on user role
    const isAdmin = req.user.role === 'SOCIETY_ADMIN' || req.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      if (req.user.residentType === 'OWNER') {
        filter.targetAudience = { $in: ['ALL', 'OWNERS'] };
      } else if (req.user.residentType === 'TENANT') {
        filter.targetAudience = { $in: ['ALL', 'TENANTS'] };
      } else {
        filter.targetAudience = 'ALL';
      }
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const notices = await Notice.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .populate('postedBy', 'name role email');

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    console.error('Error in getNotices:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving notices.' });
  }
};

/**
 * @desc    Create a new society notice
 * @route   POST /api/notices
 * @access  Private (Admin only)
 */
export const createNotice = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const { title, content, category, priority, targetAudience, isPinned, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const notice = await Notice.create({
      societyId,
      title,
      content,
      category: category || 'GENERAL',
      priority: priority || 'NORMAL',
      targetAudience: targetAudience || 'ALL',
      isPinned: isPinned || false,
      expiresAt: expiresAt || null,
      postedBy: req.user._id,
    });

    const populatedNotice = await notice.populate('postedBy', 'name role');

    // Real-time broadcast to society
    if (req.io) {
      req.io.to(`society_${societyId}`).emit('new_notice', populatedNotice);
    }

    res.status(201).json({
      success: true,
      message: 'Notice published successfully.',
      data: populatedNotice,
    });
  } catch (error) {
    console.error('Error in createNotice:', error);
    res.status(500).json({ success: false, message: 'Server error publishing notice.' });
  }
};

/**
 * @desc    Update a notice
 * @route   PUT /api/notices/:id
 * @access  Private (Admin only)
 */
export const updateNotice = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const notice = await Notice.findOne({ _id: req.params.id, societyId });

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    const { title, content, category, priority, targetAudience, isPinned, expiresAt } = req.body;
    if (title) notice.title = title;
    if (content) notice.content = content;
    if (category) notice.category = category;
    if (priority) notice.priority = priority;
    if (targetAudience) notice.targetAudience = targetAudience;
    if (typeof isPinned === 'boolean') notice.isPinned = isPinned;
    if (expiresAt !== undefined) notice.expiresAt = expiresAt;

    await notice.save();
    const updated = await notice.populate('postedBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Error in updateNotice:', error);
    res.status(500).json({ success: false, message: 'Server error updating notice.' });
  }
};

/**
 * @desc    Toggle pin status of a notice
 * @route   PATCH /api/notices/:id/pin
 * @access  Private (Admin only)
 */
export const togglePinNotice = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const notice = await Notice.findOne({ _id: req.params.id, societyId });

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    notice.isPinned = !notice.isPinned;
    await notice.save();

    res.status(200).json({
      success: true,
      message: `Notice ${notice.isPinned ? 'pinned' : 'unpinned'} successfully.`,
      data: notice,
    });
  } catch (error) {
    console.error('Error in togglePinNotice:', error);
    res.status(500).json({ success: false, message: 'Server error toggling pin status.' });
  }
};

/**
 * @desc    Delete a notice
 * @route   DELETE /api/notices/:id
 * @access  Private (Admin only)
 */
export const deleteNotice = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const notice = await Notice.findOneAndDelete({ _id: req.params.id, societyId });

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Notice removed successfully.',
    });
  } catch (error) {
    console.error('Error in deleteNotice:', error);
    res.status(500).json({ success: false, message: 'Server error deleting notice.' });
  }
};
