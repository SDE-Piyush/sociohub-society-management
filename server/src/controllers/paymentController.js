import Payment from '../models/Payment.js';
import Flat from '../models/Flat.js';
import Society from '../models/Society.js';

/**
 * @desc    Submit maintenance payment (UPI or Cash)
 * @route   POST /api/payments/submit
 * @access  Private (Resident)
 */
export const submitPayment = async (req, res, next) => {
  try {
    const { paymentMethod, transactionRef, amount, month, notes } = req.body;
    const user = req.user;

    if (!user.flatId) {
      return res.status(400).json({
        success: false,
        message: 'You do not have a flat assigned to make maintenance payments.',
      });
    }

    const flat = await Flat.findById(user.flatId);
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat record not found.' });
    }

    const payAmount = amount || flat.monthlyMaintenance || 4200;
    const currentMonth = month || 'October 2026';

    // Check if an existing payment is already completed or pending
    const existing = await Payment.findOne({
      flatId: flat._id,
      month: currentMonth,
      status: { $in: ['COMPLETED', 'PENDING_CASH_VERIFICATION'] },
    });

    if (existing) {
      if (existing.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: `Maintenance for ${currentMonth} is already paid! (Receipt: ${existing.receiptNumber})`,
        });
      }
      if (existing.status === 'PENDING_CASH_VERIFICATION' && paymentMethod === 'CASH') {
        return res.status(400).json({
          success: false,
          message: `A cash payment request for ${currentMonth} is already pending admin verification.`,
        });
      }
    }

    const isCash = paymentMethod === 'CASH';
    const status = isCash ? 'PENDING_CASH_VERIFICATION' : 'COMPLETED';

    const society = await Society.findById(user.societyId._id || user.societyId);
    const resolvedUpiId = req.body.upiId || society?.settings?.upiId || 'emeraldheights@upi';

    const payment = await Payment.create({
      societyId: user.societyId._id || user.societyId,
      flatId: flat._id,
      buildingId: flat.buildingId,
      userId: user._id,
      month: currentMonth,
      amount: payAmount,
      paymentMethod,
      upiId: resolvedUpiId,
      transactionRef: transactionRef || (isCash ? 'CASH-OFFICE' : `UPI-${Date.now()}`),
      status,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: isCash
        ? 'Cash payment request submitted. Please deposit ₹' + payAmount + ' with Society Admin Piyush Kumar at the office.'
        : 'UPI payment verified successfully! Receipt generated.',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current resident flat's payments & active status
 * @route   GET /api/payments/my-payments
 * @access  Private (Resident)
 */
export const getMyPayments = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.flatId) {
      return res.status(200).json({
        success: true,
        data: {
          payments: [],
          currentStatus: 'NO_FLAT',
        },
      });
    }

    const payments = await Payment.find({ flatId: user.flatId._id || user.flatId })
      .populate('verifiedBy', 'name role')
      .sort({ createdAt: -1 });

    // Check October 2026 status
    const currentMonthPayment = payments.find((p) => p.month === 'October 2026');

    const society = await Society.findById(user.societyId?._id || user.societyId).select('name settings');
    const societyUpiId = society?.settings?.upiId || 'emeraldheights@upi';
    const societyName = society?.settings?.accountName || society?.name || 'Emerald Heights Residency';

    res.status(200).json({
      success: true,
      data: {
        payments,
        currentMonthPayment: currentMonthPayment || null,
        isPaid: currentMonthPayment?.status === 'COMPLETED',
        isPendingCash: currentMonthPayment?.status === 'PENDING_CASH_VERIFICATION',
        societyUpiId,
        societyName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Get all society payments
 * @route   GET /api/payments
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const getAllPayments = async (req, res, next) => {
  try {
    const societyId = req.user.societyId._id || req.user.societyId;
    const { status, month } = req.query;

    const query = { societyId };
    if (status && status !== 'ALL') query.status = status;
    if (month) query.month = month;

    const payments = await Payment.find(query)
      .populate('flatId', 'flatNumber floor type')
      .populate('buildingId', 'name code')
      .populate('userId', 'name email phone')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });

    // Compute summary statistics
    const totalCollected = payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingCashCount = payments.filter(
      (p) => p.status === 'PENDING_CASH_VERIFICATION'
    ).length;

    const pendingCashAmount = payments
      .filter((p) => p.status === 'PENDING_CASH_VERIFICATION')
      .reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        payments,
        stats: {
          totalCollected,
          pendingCashCount,
          pendingCashAmount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Verify and approve Cash payment
 * @route   PUT /api/payments/:id/verify-cash
 * @access  Private (SOCIETY_ADMIN, SUPER_ADMIN)
 */
export const verifyCashPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('flatId', 'flatNumber')
      .populate('userId', 'name');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'This payment has already been verified and marked as completed.',
      });
    }

    payment.status = 'COMPLETED';
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();
    payment.notes = `Cash payment of ₹${payment.amount} collected and verified by Admin ${req.user.name}.`;

    await payment.save();

    const updated = await Payment.findById(payment._id)
      .populate('flatId', 'flatNumber')
      .populate('buildingId', 'name code')
      .populate('userId', 'name email phone')
      .populate('verifiedBy', 'name');

    res.status(200).json({
      success: true,
      message: `Cash payment of ₹${payment.amount} for Flat ${payment.flatId?.flatNumber || ''} verified successfully. Receipt: ${payment.receiptNumber}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update society UPI configuration (UPI ID & Account Name)
 * @route   PATCH /api/payments/settings/upi
 * @access  Private (SOCIETY_ADMIN, RESIDENT)
 */
export const updateSocietyUpi = async (req, res, next) => {
  try {
    const { upiId, accountName } = req.body;
    if (!upiId || !upiId.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid UPI ID (e.g. yourname@okhdfcbank).' });
    }

    const societyId = req.user.societyId?._id || req.user.societyId;
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({ success: false, message: 'Society record not found.' });
    }

    if (!society.settings) society.settings = {};
    society.settings.upiId = upiId.trim();
    if (accountName && accountName.trim()) {
      society.settings.accountName = accountName.trim();
    }

    await society.save();

    res.status(200).json({
      success: true,
      message: `Society UPI ID successfully updated to ${society.settings.upiId}`,
      data: {
        upiId: society.settings.upiId,
        accountName: society.settings.accountName || society.name,
      },
    });
  } catch (error) {
    next(error);
  }
};
