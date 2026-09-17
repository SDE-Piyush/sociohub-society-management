import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - Verify JWT token from HTTP-only cookie or Authorization header
 */
export const protect = async (req, res, next) => {
  let token = null;

  // Check cookie first
  if (req.cookies && req.cookies.sociohub_token) {
    token = req.cookies.sociohub_token;
  }
  // Fallback to Bearer token in header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'sociohub_jwt_super_secret_key_2026_modern_residency'
    );

    const user = await User.findById(decoded.id)
      .populate('societyId', 'name address contactPhone gateCount')
      .populate('buildingId', 'name code totalFloors')
      .populate('flatId', 'flatNumber floor type occupancyStatus monthlyMaintenance');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive or pending approval. Contact the society administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication session. Please log in again.',
    });
  }
};

/**
 * Authorize specific roles (RBAC)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role [${req.user ? req.user.role : 'GUEST'}] is not authorized to perform this action.`,
      });
    }
    next();
  };
};
