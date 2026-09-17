import Society from '../models/Society.js';
import Building from '../models/Building.js';
import Flat from '../models/Flat.js';
import User from '../models/User.js';

/**
 * @desc    Get current society details and dashboard overview stats
 * @route   GET /api/society
 * @access  Private
 */
export const getSociety = async (req, res, next) => {
  try {
    const societyId = req.user.societyId ? req.user.societyId._id || req.user.societyId : null;

    if (!societyId) {
      return res.status(404).json({ success: false, message: 'Society not found for this user.' });
    }

    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({ success: false, message: 'Society record not found.' });
    }

    // Calculate quick stats
    const totalWings = await Building.countDocuments({ societyId });
    const totalFlats = await Flat.countDocuments({ societyId });
    const occupiedFlats = await Flat.countDocuments({
      societyId,
      occupancyStatus: { $ne: 'VACANT' },
    });
    const vacantFlats = totalFlats - occupiedFlats;
    const totalResidents = await User.countDocuments({ societyId, role: 'RESIDENT' });
    const totalStaff = await User.countDocuments({ societyId, role: 'SECURITY' });

    res.status(200).json({
      success: true,
      data: {
        society,
        stats: {
          totalWings,
          totalFlats,
          occupiedFlats,
          vacantFlats,
          occupancyRate: totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0,
          totalResidents,
          totalStaff,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update society profile / settings
 * @route   PUT /api/society
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const updateSociety = async (req, res, next) => {
  try {
    const societyId = req.user.societyId ? req.user.societyId._id || req.user.societyId : null;

    const updated = await Society.findByIdAndUpdate(societyId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Society information updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
