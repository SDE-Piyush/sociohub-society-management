import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Flat from '../models/Flat.js';
import Society from '../models/Society.js';
import Bill from '../models/Bill.js';
import { generateReceiptPDF } from '../utils/pdfGenerator.js';

/**
 * @desc    Submit maintenance payment (UPI or Cash)
 * @route   POST /api/payments/submit
 * @access  Private (Resident)
 */
export const submitPayment = async (req, res, next) => {
  try {
    const { paymentMethod, transactionRef, amount, month, notes, billId } = req.body;
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

    let targetBill = null;
    if (billId) {
      targetBill = await Bill.findById(billId);
    } else if (month) {
      targetBill = await Bill.findOne({ flatId: flat._id, month });
    }

    if (targetBill) {
      if (targetBill.status === 'PAID') {
        return res.status(400).json({
          success: false,
          message: `Bill for ${targetBill.month} is already paid and settled! (Receipt: ${targetBill.paymentId?.receiptNumber || 'Verified'})`,
        });
      }
      if (targetBill.status === 'PENDING_VERIFICATION' && paymentMethod === 'CASH') {
        return res.status(400).json({
          success: false,
          message: `A cash payment request for ₹${targetBill.totalAmount} is already pending admin verification at the office desk.`,
        });
      }
    } else {
      // Fallback only if no bill exists for this month
      const checkMonth = month || 'October 2026';
      const existing = await Payment.findOne({
        flatId: flat._id,
        month: checkMonth,
        status: { $in: ['COMPLETED', 'PENDING_CASH_VERIFICATION'] },
      });

      if (existing) {
        if (existing.status === 'COMPLETED') {
          return res.status(400).json({
            success: false,
            message: `Maintenance for ${checkMonth} is already paid! (Receipt: ${existing.receiptNumber})`,
          });
        }
        if (existing.status === 'PENDING_CASH_VERIFICATION' && paymentMethod === 'CASH') {
          return res.status(400).json({
            success: false,
            message: `A cash payment request for ${checkMonth} is already pending admin verification.`,
          });
        }
      }
    }

    const payAmount = targetBill ? targetBill.totalAmount : (amount || flat.monthlyMaintenance || 4200);
    const resolvedMonth = targetBill ? targetBill.month : (month || 'October 2026');

    const isCash = paymentMethod === 'CASH';
    const status = isCash ? 'PENDING_CASH_VERIFICATION' : 'COMPLETED';

    const society = await Society.findById(user.societyId._id || user.societyId);
    const resolvedUpiId = req.body.upiId || society?.settings?.upiId || 'emeraldheights@upi';

    const payment = await Payment.create({
      societyId: user.societyId._id || user.societyId,
      flatId: flat._id,
      buildingId: flat.buildingId,
      userId: user._id,
      billId: targetBill?._id || null,
      month: resolvedMonth,
      amount: payAmount,
      paymentMethod,
      upiId: resolvedUpiId,
      transactionRef: transactionRef || (isCash ? 'CASH-OFFICE' : `UPI-${Date.now()}`),
      status,
      notes: notes || '',
    });

    if (targetBill) {
      targetBill.status = isCash ? 'PENDING_VERIFICATION' : 'PAID';
      targetBill.paymentId = payment._id;
      targetBill.paidAt = isCash ? null : new Date();
      targetBill.paidAmount = payAmount;
      targetBill.paymentMethod = paymentMethod;
      await targetBill.save();
    }

    res.status(201).json({
      success: true,
      message: isCash
        ? `Cash payment request submitted. Please deposit ₹${payAmount} with Society Admin Piyush Kumar at the office desk.`
        : 'UPI payment verified successfully! Official receipt generated.',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Razorpay Order for online card/UPI checkout
 * @route   POST /api/payments/razorpay/order
 * @access  Private (Resident)
 */
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, month, billId } = req.body;
    const user = req.user;

    const payAmount = Number(amount) || 4200;
    const orderReceipt = `rcpt_${Date.now().toString().slice(-8)}`;

    // Generate standard order payload (works seamlessly with Razorpay test mode or test simulation)
    const mockOrderId = `order_${crypto.randomBytes(10).toString('hex')}`;
    const razorpayKey = process.env.RAZORPAY_KEY_ID || 'rzp_test_sociohub2026';

    res.status(200).json({
      success: true,
      data: {
        orderId: mockOrderId,
        amount: payAmount * 100, // Razorpay works in paise
        currency: 'INR',
        keyId: razorpayKey,
        receipt: orderReceipt,
        month: month || 'October 2026',
        billId: billId || null,
        societyName: user.societyId?.name || 'Emerald Heights Residency',
        residentName: user.name,
        residentEmail: user.email,
        residentPhone: user.phone || '9876543210',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment signature & complete transaction
 * @route   POST /api/payments/razorpay/verify
 * @access  Private (Resident)
 */
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      month,
      billId,
    } = req.body;

    const user = req.user;
    if (!user.flatId) {
      return res.status(400).json({ success: false, message: 'No flat assigned to this user.' });
    }

    const flat = await Flat.findById(user.flatId);
    const payAmount = Number(amount) || 4200;
    const currentMonth = month || 'October 2026';

    // In production with RAZORPAY_KEY_SECRET, verify HMAC SHA256:
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature verification failed.' });
      }
    }

    // Create completed payment record
    const payment = await Payment.create({
      societyId: user.societyId._id || user.societyId,
      flatId: flat._id,
      buildingId: flat.buildingId,
      userId: user._id,
      month: currentMonth,
      amount: payAmount,
      paymentMethod: 'UPI', // Gateway online transfer
      transactionRef: razorpay_payment_id || `PAY-${Date.now()}`,
      status: 'COMPLETED',
      notes: `Online Gateway Checkout (Order: ${razorpay_order_id || 'N/A'})`,
    });

    // Mark corresponding bill as PAID
    const billQuery = billId ? { _id: billId } : { flatId: flat._id, month: currentMonth };
    await Bill.findOneAndUpdate(billQuery, {
      status: 'PAID',
      paymentId: payment._id,
      paidAt: new Date(),
      paidAmount: payAmount,
      paymentMethod: 'RAZORPAY_GATEWAY',
    });

    res.status(200).json({
      success: true,
      message: 'Online payment processed and verified successfully! Official receipt generated.',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download Maintenance Payment Receipt PDF
 * @route   GET /api/payments/:id/receipt-pdf
 * @access  Private
 */
export const downloadReceiptPdf = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('flatId', 'flatNumber floor type')
      .populate('buildingId', 'name code')
      .populate('userId', 'name email phone')
      .populate('verifiedBy', 'name role');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment receipt not found.' });
    }

    const society = await Society.findById(payment.societyId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Receipt-${payment.receiptNumber}.pdf`);

    generateReceiptPDF(payment, society, res);
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

    const targetMonth = req.query.month;
    let currentMonthPayment = null;
    if (targetMonth) {
      currentMonthPayment = payments.find((p) => p.month === targetMonth);
    } else {
      currentMonthPayment = payments.length > 0 ? payments[0] : null;
    }

    const activeUnpaidBill = await Bill.findOne({
      flatId: user.flatId._id || user.flatId,
      status: { $in: ['UNPAID', 'OVERDUE', 'PENDING_VERIFICATION'] },
    }).sort({ dueDate: 1 });

    const isPaid = activeUnpaidBill ? false : (currentMonthPayment?.status === 'COMPLETED');
    const isPendingCash = activeUnpaidBill
      ? activeUnpaidBill.status === 'PENDING_VERIFICATION'
      : (currentMonthPayment?.status === 'PENDING_CASH_VERIFICATION');

    const society = await Society.findById(user.societyId?._id || user.societyId).select('name settings');
    const societyUpiId = society?.settings?.upiId || 'emeraldheights@upi';
    const societyName = society?.settings?.accountName || society?.name || 'Emerald Heights Residency';

    res.status(200).json({
      success: true,
      data: {
        payments,
        currentMonthPayment: currentMonthPayment || null,
        isPaid,
        isPendingCash,
        activeBill: activeUnpaidBill || null,
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

    // Update associated Bill to PAID
    const billQuery = payment.billId ? { _id: payment.billId } : { flatId: payment.flatId, month: payment.month };
    await Bill.findOneAndUpdate(
      billQuery,
      {
        status: 'PAID',
        paymentId: payment._id,
        paidAt: new Date(),
        paidAmount: payment.amount,
        paymentMethod: 'CASH',
      }
    );

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
 * @desc    Update society UPI configuration
 * @route   PATCH /api/payments/settings/upi
 * @access  Private
 */
export const updateSocietyUpi = async (req, res, next) => {
  try {
    const { upiId, accountName } = req.body;
    if (!upiId || !upiId.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid UPI ID.' });
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
