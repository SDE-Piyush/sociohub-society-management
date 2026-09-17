import jwt from 'jsonwebtoken';

/**
 * Generate JWT Token
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'sociohub_jwt_super_secret_key_2026_modern_residency',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Send Token via Secure HTTP-Only Cookie and JSON response
 */
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  // Strip password if present
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;

  res
    .status(statusCode)
    .cookie('sociohub_token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      data: {
        user: userObj,
      },
    });
};
