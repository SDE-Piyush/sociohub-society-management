import Building from '../models/Building.js';
import Flat from '../models/Flat.js';
import Society from '../models/Society.js';

/**
 * @desc    Get all buildings/wings for the society with flat stats
 * @route   GET /api/buildings
 * @access  Private (All authenticated users in society)
 */
export const getBuildings = async (req, res, next) => {
  try {
    const societyId = req.user.societyId ? req.user.societyId._id || req.user.societyId : null;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'No society associated with user.',
      });
    }

    const buildings = await Building.find({ societyId }).sort({ name: 1 }).lean();

    // Fetch flat counts per building
    const buildingsWithStats = await Promise.all(
      buildings.map(async (b) => {
        const totalFlats = await Flat.countDocuments({ buildingId: b._id });
        const occupiedFlats = await Flat.countDocuments({
          buildingId: b._id,
          occupancyStatus: { $ne: 'VACANT' },
        });
        const vacantFlats = totalFlats - occupiedFlats;

        return {
          ...b,
          totalFlats,
          occupiedFlats,
          vacantFlats,
          occupancyRate: totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: buildingsWithStats.length,
      data: buildingsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new building/wing
 * @route   POST /api/buildings
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const createBuilding = async (req, res, next) => {
  try {
    const societyId = req.user.societyId ? req.user.societyId._id || req.user.societyId : null;
    const { name, code, totalFloors, flatsPerFloor, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Building/Wing name is required (e.g. Wing A).',
      });
    }

    const building = await Building.create({
      societyId,
      name,
      code: code || name.charAt(0).toUpperCase(),
      totalFloors: totalFloors || 10,
      flatsPerFloor: flatsPerFloor || 4,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: `Wing ${building.name} created successfully.`,
      data: building,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A wing with this name already exists in your society.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get single building with flats
 * @route   GET /api/buildings/:id
 * @access  Private
 */
export const getBuildingById = async (req, res, next) => {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found.',
      });
    }

    const flats = await Flat.find({ buildingId: building._id })
      .populate('ownerId', 'name email phone')
      .populate('tenantId', 'name email phone')
      .sort({ floor: 1, flatNumber: 1 });

    res.status(200).json({
      success: true,
      data: {
        building,
        flats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete building if empty
 * @route   DELETE /api/buildings/:id
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const deleteBuilding = async (req, res, next) => {
  try {
    const flatsCount = await Flat.countDocuments({ buildingId: req.params.id });
    if (flatsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete wing with ${flatsCount} registered flats. Remove flats first.`,
      });
    }

    await Building.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Building deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public list of buildings (for registration dropdown)
 * @route   GET /api/buildings/public
 * @access  Public
 */
export const getPublicBuildings = async (req, res, next) => {
  try {
    let societyId = req.query.societyId;
    if (!societyId) {
      const society = await Society.findOne();
      if (society) societyId = society._id;
    }
    const buildings = await Building.find(societyId ? { societyId } : {}).sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data: buildings });
  } catch (err) {
    next(err);
  }
};

