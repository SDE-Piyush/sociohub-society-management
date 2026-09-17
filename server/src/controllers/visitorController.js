import Visitor from '../models/Visitor.js';
import Flat from '../models/Flat.js';

/**
 * @desc    Generate a pre-approved guest pass with 6-digit PIN & QR
 * @route   POST /api/visitors/pre-approve
 * @access  Private (Resident / Admin)
 */
export const preApproveVisitor = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const flatId = req.user.flatId?._id || req.user.flatId || req.body.flatId;
    const buildingId = req.user.buildingId?._id || req.user.buildingId || req.body.buildingId;

    if (!flatId) {
      return res.status(400).json({
        success: false,
        message: 'A flat is required to generate a guest pass.',
      });
    }

    const { visitorName, phone, purpose, vehicleNumber, expectedDate, validHours } = req.body;

    if (!visitorName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Visitor name and phone number are required.',
      });
    }

    const hours = Number(validHours) || 24;
    const expDate = expectedDate ? new Date(expectedDate) : new Date();
    const validUntil = new Date(expDate.getTime() + hours * 60 * 60 * 1000);

    const visitor = await Visitor.create({
      societyId,
      flatId,
      buildingId,
      visitorName,
      phone,
      purpose: purpose || 'GUEST',
      vehicleNumber: vehicleNumber || '',
      entryType: 'PRE_APPROVED',
      status: 'EXPECTED',
      expectedDate: expDate,
      validUntil,
      approvedBy: req.user._id,
    });

    const populated = await Visitor.findById(visitor._id)
      .populate('flatId', 'flatNumber floor')
      .populate('buildingId', 'name code');

    res.status(201).json({
      success: true,
      message: 'Guest pass generated successfully.',
      data: populated,
    });
  } catch (error) {
    console.error('Error in preApproveVisitor:', error);
    res.status(500).json({ success: false, message: 'Server error generating guest pass.' });
  }
};

/**
 * @desc    Get visitor passes for resident's flat
 * @route   GET /api/visitors/my-visitors
 * @access  Private (Resident)
 */
export const getResidentVisitors = async (req, res) => {
  try {
    const flatId = req.user.flatId?._id || req.user.flatId;
    if (!flatId) {
      return res.status(400).json({ success: false, message: 'Resident flat not linked.' });
    }

    const visitors = await Visitor.find({ flatId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('flatId', 'flatNumber floor')
      .populate('buildingId', 'name code')
      .populate('checkedInBy', 'name');

    res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    console.error('Error in getResidentVisitors:', error);
    res.status(500).json({ success: false, message: 'Server error fetching visitor passes.' });
  }
};

/**
 * @desc    Security guard registers walk-in visitor arriving at the gate
 * @route   POST /api/visitors/walk-in
 * @access  Private (Security / Admin)
 */
export const createWalkInVisitor = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const { flatId, visitorName, phone, purpose, vehicleNumber } = req.body;

    if (!flatId || !visitorName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Flat ID, visitor name, and phone number are required.',
      });
    }

    const flat = await Flat.findById(flatId).populate('buildingId', 'name code');
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Target flat not found.' });
    }

    const visitor = await Visitor.create({
      societyId,
      flatId: flat._id,
      buildingId: flat.buildingId?._id || null,
      visitorName,
      phone,
      purpose: purpose || 'GUEST',
      vehicleNumber: vehicleNumber || '',
      entryType: 'WALK_IN',
      status: 'PENDING_APPROVAL',
      checkedInBy: req.user._id,
    });

    const populated = await Visitor.findById(visitor._id)
      .populate('flatId', 'flatNumber floor')
      .populate('buildingId', 'name code');

    // Trigger instant Socket alert strictly to destination flat resident's room
    if (req.io) {
      const alertPayload = {
        visitorId: visitor._id,
        flatId: flat._id.toString(),
        visitorName: visitor.visitorName,
        phone: visitor.phone,
        purpose: visitor.purpose,
        vehicleNumber: visitor.vehicleNumber,
        flatNumber: flat.flatNumber,
        buildingName: flat.buildingId?.name || '',
        createdAt: visitor.createdAt,
      };
      req.io.to(`flat_${flat._id}`).emit('visitor_arrival_request', alertPayload);
    }

    res.status(201).json({
      success: true,
      message: 'Walk-in arrival logged. Sent real-time approval request to resident.',
      data: populated,
    });
  } catch (error) {
    console.error('Error in createWalkInVisitor:', error);
    res.status(500).json({ success: false, message: 'Server error registering walk-in.' });
  }
};

/**
 * @desc    Resident approves or rejects a walk-in visitor from screen
 * @route   PATCH /api/visitors/:id/respond
 * @access  Private (Resident)
 */
export const respondToVisitorArrival = async (req, res) => {
  try {
    const { decision, rejectionReason } = req.body; // decision: 'APPROVE' | 'REJECT'
    const visitor = await Visitor.findById(req.params.id)
      .populate('flatId', 'flatNumber floor')
      .populate('buildingId', 'name code');

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor entry not found.' });
    }

    if (decision === 'APPROVE') {
      visitor.status = 'APPROVED';
      visitor.approvedBy = req.user._id;
    } else {
      visitor.status = 'REJECTED';
      visitor.rejectionReason = rejectionReason || 'Resident denied entry.';
    }

    await visitor.save();

    // Broadcast response back to security terminal
    if (req.io) {
      req.io.to(`security_${visitor.societyId}`).emit('visitor_approval_response', {
        visitorId: visitor._id,
        status: visitor.status,
        visitorName: visitor.visitorName,
        flatNumber: visitor.flatId?.flatNumber,
        rejectionReason: visitor.rejectionReason,
      });
      req.io.to(`society_${visitor.societyId}`).emit('visitor_approval_response', {
        visitorId: visitor._id,
        status: visitor.status,
        visitorName: visitor.visitorName,
        flatNumber: visitor.flatId?.flatNumber,
      });
    }

    res.status(200).json({
      success: true,
      message: `Visitor entry ${decision === 'APPROVE' ? 'approved' : 'denied'}.`,
      data: visitor,
    });
  } catch (error) {
    console.error('Error in respondToVisitorArrival:', error);
    res.status(500).json({ success: false, message: 'Server error responding to visitor arrival.' });
  }
};

/**
 * @desc    Security guard verifies 6-digit PIN or QR code and checks in visitor
 * @route   POST /api/visitors/verify-pass
 * @access  Private (Security / Admin)
 */
export const verifyPass = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const { code } = req.body; // Can be 6-digit passCode or qrToken

    if (!code) {
      return res.status(400).json({ success: false, message: 'Pass code or QR token is required.' });
    }

    const trimmedCode = code.toString().trim();

    // Search by passCode OR qrToken
    const visitor = await Visitor.findOne({
      societyId,
      $or: [{ passCode: trimmedCode }, { qrToken: trimmedCode }],
    })
      .populate('flatId', 'flatNumber floor')
      .populate('buildingId', 'name code')
      .populate('approvedBy', 'name phone');

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Pass! No matching visitor pass found for this code.',
      });
    }

    if (visitor.status === 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        message: `Visitor is already inside! Checked in on ${new Date(visitor.checkInTime).toLocaleTimeString()}.`,
        data: visitor,
      });
    }

    if (visitor.status === 'CHECKED_OUT') {
      return res.status(400).json({
        success: false,
        message: 'This pass has already been used and checked out.',
        data: visitor,
      });
    }

    if (visitor.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        message: `Entry Denied! Reason: ${visitor.rejectionReason || 'Rejected by resident.'}`,
        data: visitor,
      });
    }

    // Check expiry
    if (visitor.validUntil && new Date() > new Date(visitor.validUntil)) {
      visitor.status = 'EXPIRED';
      await visitor.save();
      return res.status(400).json({
        success: false,
        message: 'Pass has expired.',
        data: visitor,
      });
    }

    // Mark as Checked In
    visitor.status = 'CHECKED_IN';
    visitor.checkInTime = new Date();
    visitor.checkedInBy = req.user._id;
    await visitor.save();

    // Notify resident
    if (req.io) {
      req.io.to(`flat_${visitor.flatId._id}`).emit('visitor_checked_in', {
        visitorId: visitor._id,
        visitorName: visitor.visitorName,
        purpose: visitor.purpose,
        checkInTime: visitor.checkInTime,
      });
    }

    res.status(200).json({
      success: true,
      message: `Verified! Entry granted for ${visitor.visitorName} to Flat ${visitor.flatId.flatNumber}.`,
      data: visitor,
    });
  } catch (error) {
    console.error('Error in verifyPass:', error);
    res.status(500).json({ success: false, message: 'Server error verifying pass.' });
  }
};

/**
 * @desc    Security guard logs visitor exit (Check-out)
 * @route   PATCH /api/visitors/:id/checkout
 * @access  Private (Security / Admin)
 */
export const checkOutVisitor = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const visitor = await Visitor.findOne({ _id: req.params.id, societyId })
      .populate('flatId', 'flatNumber floor')
      .populate('buildingId', 'name code');

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found.' });
    }

    visitor.status = 'CHECKED_OUT';
    visitor.checkOutTime = new Date();
    visitor.checkedOutBy = req.user._id;
    await visitor.save();

    res.status(200).json({
      success: true,
      message: `${visitor.visitorName} checked out successfully.`,
      data: visitor,
    });
  } catch (error) {
    console.error('Error in checkOutVisitor:', error);
    res.status(500).json({ success: false, message: 'Server error checking out visitor.' });
  }
};

/**
 * @desc    Get real-time gate activity logs
 * @route   GET /api/visitors/gate-logs
 * @access  Private (Security / Admin)
 */
export const getGateLogs = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const { status, search } = req.query;

    const filter = { societyId };
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { visitorName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { passCode: { $regex: search, $options: 'i' } },
      ];
    }

    const visitors = await Visitor.find(filter)
      .sort({ updatedAt: -1 })
      .limit(100)
      .populate('flatId', 'flatNumber floor')
      .populate('buildingId', 'name code')
      .populate('approvedBy', 'name phone')
      .populate('checkedInBy', 'name');

    // Calculate gate stats
    const allVisitors = await Visitor.find({ societyId }).select('status entryType createdAt checkInTime');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      insideNow: allVisitors.filter((v) => v.status === 'CHECKED_IN').length,
      expectedToday: allVisitors.filter((v) => v.status === 'EXPECTED').length,
      walkInsToday: allVisitors.filter((v) => v.entryType === 'WALK_IN' && new Date(v.createdAt) >= today).length,
      totalToday: allVisitors.filter((v) => new Date(v.createdAt) >= today).length,
    };

    res.status(200).json({
      success: true,
      count: visitors.length,
      stats,
      data: visitors,
    });
  } catch (error) {
    console.error('Error in getGateLogs:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving gate logs.' });
  }
};

/**
 * @desc    Get any visitor in PENDING_APPROVAL for caller's flat
 * @route   GET /api/visitors/pending-approval
 * @access  Private (Resident)
 */
export const getPendingApproval = async (req, res) => {
  try {
    if (req.user?.role !== 'RESIDENT') {
      return res.status(200).json({ success: true, data: null });
    }

    const flatId = req.user.flatId?._id || req.user.flatId;
    if (!flatId) {
      return res.status(200).json({ success: true, data: null });
    }

    const pending = await Visitor.findOne({
      flatId,
      status: 'PENDING_APPROVAL',
    })
      .sort({ createdAt: -1 })
      .populate('flatId', 'flatNumber floor')
      .populate('buildingId', 'name code');

    res.status(200).json({
      success: true,
      data: pending || null,
    });
  } catch (error) {
    console.error('Error in getPendingApproval:', error);
    res.status(500).json({ success: false, message: 'Server error checking pending approval.' });
  }
};
