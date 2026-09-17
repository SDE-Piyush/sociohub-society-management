import Flat from '../models/Flat.js';
import Building from '../models/Building.js';
import User from '../models/User.js';

/**
 * @desc    Get all flats in society with filters
 * @route   GET /api/flats
 * @access  Private
 */
export const getAllFlats = async (req, res, next) => {
  try {
    const societyId = req.user.societyId ? req.user.societyId._id || req.user.societyId : null;
    const { buildingId, occupancyStatus, type } = req.query;

    const query = { societyId };
    if (buildingId) query.buildingId = buildingId;
    if (occupancyStatus) query.occupancyStatus = occupancyStatus;
    if (type) query.type = type;

    const flats = await Flat.find(query)
      .populate('buildingId', 'name code')
      .populate('ownerId', 'name email phone avatar')
      .populate('tenantId', 'name email phone avatar')
      .sort({ 'buildingId.name': 1, floor: 1, flatNumber: 1 });

    res.status(200).json({
      success: true,
      count: flats.length,
      data: flats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get flats in a specific building
 * @route   GET /api/flats/building/:buildingId
 * @access  Private
 */
export const getFlatsByBuilding = async (req, res, next) => {
  try {
    const flats = await Flat.find({ buildingId: req.params.buildingId })
      .populate('buildingId', 'name code')
      .populate('ownerId', 'name email phone avatar')
      .populate('tenantId', 'name email phone avatar')
      .sort({ floor: 1, flatNumber: 1 });

    res.status(200).json({
      success: true,
      count: flats.length,
      data: flats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public flats in a specific building (for registration dropdown)
 * @route   GET /api/flats/public/:buildingId
 * @access  Public
 */
export const getPublicFlatsByBuilding = async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ status: 'PENDING', flatId: { $ne: null } }).select('flatId').lean();
    const pendingFlatIds = pendingUsers.map((u) => u.flatId.toString());

    const flats = await Flat.find({
      buildingId: req.params.buildingId,
      occupancyStatus: 'VACANT',
      ownerId: null,
      tenantId: null,
      _id: { $nin: pendingFlatIds },
    })
      .select('flatNumber floor type occupancyStatus buildingId')
      .sort({ floor: 1, flatNumber: 1 });

    res.status(200).json({
      success: true,
      count: flats.length,
      data: flats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new flat in a wing
 * @route   POST /api/flats
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const createFlat = async (req, res, next) => {
  try {
    const societyId = req.user.societyId ? req.user.societyId._id || req.user.societyId : null;
    const {
      buildingId,
      flatNumber,
      floor,
      type,
      areaSqFt,
      monthlyMaintenance,
      parkingSlot,
    } = req.body;

    if (!buildingId || !flatNumber) {
      return res.status(400).json({
        success: false,
        message: 'Building and Flat Number are required.',
      });
    }

    const flat = await Flat.create({
      societyId,
      buildingId,
      flatNumber: flatNumber.toString().trim(),
      floor: Number(floor) || Math.floor(Number(flatNumber) / 100) || 1,
      type: type || '2BHK',
      areaSqFt: areaSqFt || 1100,
      monthlyMaintenance: monthlyMaintenance || 3500,
      parkingSlot: parkingSlot || '',
      occupancyStatus: 'VACANT',
    });

    const populated = await Flat.findById(flat._id).populate('buildingId', 'name code');

    res.status(201).json({
      success: true,
      message: `Flat ${flat.flatNumber} added successfully.`,
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A flat with this number already exists in this wing.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Assign resident (owner or tenant) to a flat
 * @route   POST /api/flats/:id/assign
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const assignResident = async (req, res, next) => {
  try {
    const { userId, residentType } = req.body; // residentType: 'OWNER' or 'TENANT'

    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (residentType === 'OWNER') {
      flat.ownerId = user._id;
      if (flat.occupancyStatus === 'VACANT') {
        flat.occupancyStatus = 'OWNER_OCCUPIED';
      }
      user.residentType = 'OWNER';
    } else if (residentType === 'TENANT') {
      flat.tenantId = user._id;
      flat.occupancyStatus = 'TENANT_OCCUPIED';
      user.residentType = 'TENANT';
    }

    user.flatId = flat._id;
    user.buildingId = flat.buildingId;
    user.societyId = flat.societyId;
    user.role = 'RESIDENT';

    await user.save();
    await flat.save();

    const updatedFlat = await Flat.findById(flat._id)
      .populate('buildingId', 'name code')
      .populate('ownerId', 'name email phone avatar')
      .populate('tenantId', 'name email phone avatar');

    res.status(200).json({
      success: true,
      message: `${user.name} assigned to Flat ${flat.flatNumber} as ${residentType}.`,
      data: updatedFlat,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unassign resident from a flat
 * @route   POST /api/flats/:id/unassign
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const unassignResident = async (req, res, next) => {
  try {
    const { residentType } = req.body; // 'OWNER' or 'TENANT'
    const flat = await Flat.findById(req.params.id);

    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found.' });
    }

    if (residentType === 'TENANT') {
      if (flat.tenantId) {
        await User.findByIdAndUpdate(flat.tenantId, { flatId: null, buildingId: null });
        flat.tenantId = null;
      }
      flat.occupancyStatus = flat.ownerId ? 'OWNER_OCCUPIED' : 'VACANT';
    } else if (residentType === 'OWNER') {
      if (flat.ownerId) {
        await User.findByIdAndUpdate(flat.ownerId, { flatId: null, buildingId: null });
        flat.ownerId = null;
      }
      flat.occupancyStatus = flat.tenantId ? 'TENANT_OCCUPIED' : 'VACANT';
    }

    await flat.save();

    const updatedFlat = await Flat.findById(flat._id)
      .populate('buildingId', 'name code')
      .populate('ownerId', 'name email phone avatar')
      .populate('tenantId', 'name email phone avatar');

    res.status(200).json({
      success: true,
      message: `Resident unassigned from Flat ${flat.flatNumber}.`,
      data: updatedFlat,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update flat details
 * @route   PUT /api/flats/:id
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const updateFlat = async (req, res, next) => {
  try {
    const updatedFlat = await Flat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('buildingId', 'name code')
      .populate('ownerId', 'name email phone')
      .populate('tenantId', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Flat details updated.',
      data: updatedFlat,
    });
  } catch (error) {
    next(error);
  }
};
