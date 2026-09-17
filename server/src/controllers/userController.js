import User from '../models/User.js';
import Flat from '../models/Flat.js';

/**
 * @desc    Get all residents / staff for current society
 * @route   GET /api/users
 * @access  Private
 */
export const getUsers = async (req, res, next) => {
  try {
    const societyId = req.user.societyId ? req.user.societyId._id || req.user.societyId : null;
    const { role, residentType, search, status } = req.query;

    const query = { societyId };
    if (role) {
      if (role.includes(',')) {
        query.role = { $in: role.split(',').map((r) => r.trim()) };
      } else {
        query.role = role;
      }
    }
    if (residentType) query.residentType = residentType;
    if (status && status !== 'ALL') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .populate('buildingId', 'name code')
      .populate('flatId', 'flatNumber floor type')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create / Onboard a new resident or staff member
 * @route   POST /api/users
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const createUser = async (req, res, next) => {
  try {
    const societyId = req.user.societyId ? req.user.societyId._id || req.user.societyId : null;
    const { name, email, phone, password, role, residentType, flatId, buildingId } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      password: password || 'Welcome@123',
      role: role || 'RESIDENT',
      residentType: residentType || (role === 'RESIDENT' ? 'OWNER' : 'NONE'),
      societyId,
      buildingId: buildingId || null,
      flatId: flatId || null,
      status: 'ACTIVE',
    });

    // If assigned to flat directly, update flat occupancy
    if (flatId) {
      const flat = await Flat.findById(flatId);
      if (flat) {
        if (residentType === 'TENANT') {
          flat.tenantId = user._id;
          flat.occupancyStatus = 'TENANT_OCCUPIED';
        } else {
          flat.ownerId = user._id;
          flat.occupancyStatus = 'OWNER_OCCUPIED';
        }
        await flat.save();
      }
    }

    const populatedUser = await User.findById(user._id)
      .populate('buildingId', 'name code')
      .populate('flatId', 'flatNumber floor');

    res.status(201).json({
      success: true,
      message: `${role} account created successfully for ${name}.`,
      data: populatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or deactivate user
 * @route   DELETE /api/users/:id
 * @access  Private (SOCIETY_ADMIN)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.user && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account.',
      });
    }

    // Unlink from flat if linked
    if (user.flatId) {
      const flat = await Flat.findById(user.flatId);
      if (flat) {
        if (flat.ownerId && flat.ownerId.toString() === user._id.toString()) {
          flat.ownerId = null;
        }
        if (flat.tenantId && flat.tenantId.toString() === user._id.toString()) {
          flat.tenantId = null;
        }
        flat.occupancyStatus = flat.ownerId || flat.tenantId ? flat.occupancyStatus : 'VACANT';
        await flat.save();
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a pending resident registration
 * @route   PATCH /api/users/:id/approve
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const approveUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = 'ACTIVE';
    await user.save();

    // If linked to a flat, activate flat occupancy
    if (user.flatId) {
      const flat = await Flat.findById(user.flatId);
      if (flat) {
        if (user.residentType === 'TENANT') {
          flat.tenantId = user._id;
          flat.occupancyStatus = 'TENANT_OCCUPIED';
        } else {
          flat.ownerId = user._id;
          flat.occupancyStatus = 'OWNER_OCCUPIED';
        }
        await flat.save();
      }
    }

    const populatedUser = await User.findById(user._id)
      .populate('buildingId', 'name code')
      .populate('flatId', 'flatNumber floor type');

    res.status(200).json({
      success: true,
      message: `Account for ${user.name} approved successfully. Resident can now log in.`,
      data: populatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user status (ACTIVE / INACTIVE)
 * @route   PATCH /api/users/:id/toggle-status
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.user && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.',
      });
    }

    user.status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User status changed to ${user.status}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin reset user password
 * @route   PATCH /api/users/:id/reset-password
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.name}.`,
    });
  } catch (error) {
    next(error);
  }
};

