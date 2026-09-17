import User from '../models/User.js';
import Society from '../models/Society.js';
import Building from '../models/Building.js';
import Flat from '../models/Flat.js';
import PasswordResetRequest from '../models/PasswordResetRequest.js';
import { sendTokenResponse } from '../utils/tokenUtils.js';

/**
 * @desc    Login user & get token with cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user by email and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('societyId', 'name address contactPhone gateCount')
      .populate('buildingId', 'name code totalFloors')
      .populate('flatId', 'flatNumber floor type occupancyStatus monthlyMaintenance');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.',
      });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Your registration is pending verification and approval by the society administrator. Please contact the management office.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact the society administrator.',
      });
    }

    sendTokenResponse(user, 200, res, `Welcome back, ${user.name}!`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new resident (Pending Admin Approval)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, societyId, role, residentType, buildingId, flatId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Default to first society if not provided
    let targetSocietyId = societyId;
    if (!targetSocietyId) {
      const defaultSociety = await Society.findOne();
      if (defaultSociety) {
        targetSocietyId = defaultSociety._id;
      }
    }

    // Validate that chosen flat is unoccupied and vacant
    if (flatId) {
      const targetFlat = await Flat.findById(flatId);
      if (!targetFlat) {
        return res.status(404).json({
          success: false,
          message: 'Selected flat was not found.',
        });
      }

      if (targetFlat.occupancyStatus !== 'VACANT' || targetFlat.ownerId || targetFlat.tenantId) {
        return res.status(400).json({
          success: false,
          message: `Flat ${targetFlat.flatNumber} is already occupied. Only unoccupied flats can be registered.`,
        });
      }

      const pendingUser = await User.findOne({ flatId, status: 'PENDING' });
      if (pendingUser) {
        return res.status(400).json({
          success: false,
          message: `Flat ${targetFlat.flatNumber} already has a pending registration awaiting admin approval.`,
        });
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      phone: phone || '',
      societyId: targetSocietyId,
      role: role || 'RESIDENT',
      residentType: residentType || 'OWNER',
      buildingId: buildingId || null,
      flatId: flatId || null,
      status: 'PENDING', // Awaiting Admin Approval
    });

    const populatedUser = await User.findById(user._id)
      .populate('societyId', 'name address contactPhone gateCount')
      .populate('buildingId', 'name code totalFloors')
      .populate('flatId', 'flatNumber floor type');

    res.status(201).json({
      success: true,
      pendingApproval: true,
      message: 'Registration submitted successfully! Your account is pending verification and approval by the society administrator.',
      data: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        status: populatedUser.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = (req, res) => {
  res.cookie('sociohub_token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
    data: {},
  });
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, emergencyContact, avatar } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (phone) fieldsToUpdate.phone = phone;
    if (avatar) fieldsToUpdate.avatar = avatar;
    if (emergencyContact) fieldsToUpdate.emergencyContact = emergencyContact;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    )
      .populate('societyId', 'name address contactPhone gateCount')
      .populate('buildingId', 'name code totalFloors')
      .populate('flatId', 'flatNumber floor type occupancyStatus monthlyMaintenance');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public registration options (Society, Buildings, and available Flats)
 * @route   GET /api/auth/registration-options
 * @access  Public
 */
export const getRegistrationOptions = async (req, res, next) => {
  try {
    const society = await Society.findOne().select('name address registrationNumber gateCount');
    if (!society) {
      return res.status(200).json({
        success: true,
        data: { society: null, buildings: [], flats: [] },
      });
    }

    const buildings = await Building.find({ societyId: society._id })
      .select('name code totalFloors')
      .sort({ name: 1 })
      .lean();

    // Fetch flat IDs with pending registrations so we don't offer duplicate pending flats
    const pendingUsers = await User.find({ status: 'PENDING', flatId: { $ne: null } }).select('flatId').lean();
    const pendingFlatIds = pendingUsers.map((u) => u.flatId.toString());

    // Only select unoccupied flats (VACANT with no owner or tenant assigned)
    const flats = await Flat.find({
      societyId: society._id,
      occupancyStatus: 'VACANT',
      ownerId: null,
      tenantId: null,
      _id: { $nin: pendingFlatIds },
    })
      .select('flatNumber floor type occupancyStatus buildingId')
      .sort({ floor: 1, flatNumber: 1 })
      .lean();

    // Attach flats list directly to each building for convenient client-side grouping
    const buildingsWithFlats = buildings.map((b) => ({
      ...b,
      flats: flats.filter((f) => f.buildingId.toString() === b._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data: {
        society,
        buildings: buildingsWithFlats,
        flats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit a forgot password request (Pending Admin Approval)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email and the desired new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.',
      });
    }

    // Check if there's already a pending request for this user
    let resetRequest = await PasswordResetRequest.findOne({
      userId: user._id,
      status: 'PENDING',
    });

    if (resetRequest) {
      resetRequest.newPassword = newPassword;
      await resetRequest.save();
    } else {
      resetRequest = await PasswordResetRequest.create({
        userId: user._id,
        societyId: user.societyId,
        email: user.email,
        newPassword,
        status: 'PENDING',
      });
    }

    res.status(200).json({
      success: true,
      message:
        'Password change request submitted successfully to the society administrator. Once approved, your new password will be activated.',
      data: resetRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all password reset requests
 * @route   GET /api/auth/password-reset-requests
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const getPasswordResetRequests = async (req, res, next) => {
  try {
    const societyId = req.user.societyId ? req.user.societyId._id || req.user.societyId : null;
    const { status } = req.query;

    const query = { societyId };
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const requests = await PasswordResetRequest.find(query)
      .populate({
        path: 'userId',
        select: 'name email phone role residentType buildingId flatId status',
        populate: [
          { path: 'buildingId', select: 'name code' },
          { path: 'flatId', select: 'flatNumber floor' },
        ],
      })
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a password reset request
 * @route   PATCH /api/auth/password-reset-requests/:id/approve
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const approvePasswordResetRequest = async (req, res, next) => {
  try {
    const resetRequest = await PasswordResetRequest.findById(req.params.id);
    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found.',
      });
    }

    if (resetRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${resetRequest.status.toLowerCase()}.`,
      });
    }

    // Find the user and update their password
    const user = await User.findById(resetRequest.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User associated with this reset request was not found.',
      });
    }

    user.password = resetRequest.newPassword;
    await user.save(); // User pre('save') hook will hash the new password

    resetRequest.status = 'APPROVED';
    resetRequest.reviewedBy = req.user._id;
    resetRequest.reviewedAt = new Date();
    await resetRequest.save();

    res.status(200).json({
      success: true,
      message: `Password reset request approved for ${user.name}. The new password is now active.`,
      data: resetRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a password reset request
 * @route   PATCH /api/auth/password-reset-requests/:id/reject
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const rejectPasswordResetRequest = async (req, res, next) => {
  try {
    const resetRequest = await PasswordResetRequest.findById(req.params.id);
    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found.',
      });
    }

    if (resetRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${resetRequest.status.toLowerCase()}.`,
      });
    }

    resetRequest.status = 'REJECTED';
    resetRequest.reviewedBy = req.user._id;
    resetRequest.reviewedAt = new Date();
    await resetRequest.save();

    res.status(200).json({
      success: true,
      message: 'Password reset request has been rejected.',
      data: resetRequest,
    });
  } catch (error) {
    next(error);
  }
};


