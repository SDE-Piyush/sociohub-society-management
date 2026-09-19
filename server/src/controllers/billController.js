import Bill from '../models/Bill.js';
import Flat from '../models/Flat.js';
import Building from '../models/Building.js';
import Society from '../models/Society.js';
import Payment from '../models/Payment.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

/**
 * @desc    Generate monthly maintenance bills only for allotted flats in society (1-Click Batch)
 * @route   POST /api/bills/generate-batch
 * @access  Private (Admin)
 */
export const generateBatchBills = async (req, res, next) => {
  try {
    const {
      month,
      utilityCharges,
      dueDate,
      notes,
      overwriteExisting = true,
      billType = 'FULL', // 'FULL' or 'UTILITY_ONLY'
    } = req.body;
    const user = req.user;

    if (!month || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both the billing month (e.g. September 2026) and due date.',
      });
    }

    const societyId = user.societyId?._id || user.societyId;

    // Only query flats that are allotted to an owner or tenant (exclude empty/vacant flats)
    const flats = await Flat.find({
      societyId,
      $or: [
        { occupancyStatus: { $ne: 'VACANT' } },
        { ownerId: { $ne: null } },
        { tenantId: { $ne: null } },
      ],
    }).populate('buildingId');

    const totalSocietyFlats = await Flat.countDocuments({ societyId });
    const emptyFlatsSkipped = Math.max(0, totalSocietyFlats - flats.length);

    if (!flats || flats.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No allotted or occupied flats found in this society. Bills cannot be generated for empty flats.',
      });
    }

    // Automatically purge any orphan UNPAID bills for vacant flats for this month
    const vacantFlats = await Flat.find({
      societyId,
      occupancyStatus: 'VACANT',
      ownerId: null,
      tenantId: null,
    }).select('_id');
    const vacantFlatIds = vacantFlats.map((f) => f._id);
    if (vacantFlatIds.length > 0) {
      await Bill.deleteMany({
        societyId,
        flatId: { $in: vacantFlatIds },
        month,
        status: 'UNPAID',
        paymentId: null,
      });
    }

    // Set end-of-day for due date so today's due bills remain valid all day
    const parsedDueDate = new Date(dueDate);
    parsedDueDate.setHours(23, 59, 59, 999);
    const parsedYear = parsedDueDate.getFullYear() || 2026;
    const extraCharges = Math.max(0, Number(utilityCharges) || 0);

    const monthParts = month.trim().split(' ');
    const monthShort = monthParts[0].slice(0, 3).toUpperCase();
    const yearShort = monthParts[1] || parsedYear;

    let createdCount = 0;
    let updatedCount = 0;

    for (const flat of flats) {
      // If UTILITY_ONLY, base maintenance is 0 so only the extra charge is billed (e.g. ₹250)
      const base = billType === 'UTILITY_ONLY' ? 0 : (flat.monthlyMaintenance || 4200);
      const total = base + extraCharges;
      const buildingCode = flat.buildingId?.code || (flat.buildingId?.name ? flat.buildingId.name.slice(0, 4).replace(/[^a-zA-Z0-9]/g, '') : 'W');
      const billNum = `INV-${yearShort}-${monthShort}-${buildingCode}-${flat.flatNumber}`;

      const existingBill = await Bill.findOne({ flatId: flat._id, month });

      if (existingBill) {
        if (overwriteExisting) {
          existingBill.baseAmount = base;
          existingBill.utilityCharges = extraCharges;
          existingBill.totalAmount = total;
          existingBill.dueDate = parsedDueDate;
          existingBill.status = 'UNPAID';
          existingBill.paymentId = null;
          existingBill.paidAt = null;
          existingBill.paidAmount = 0;
          existingBill.paymentMethod = '';
          if (notes) existingBill.notes = notes;
          await existingBill.save();
          updatedCount++;
        }
      } else {
        await Bill.create({
          societyId,
          flatId: flat._id,
          buildingId: flat.buildingId?._id || flat.buildingId,
          month,
          year: Number(yearShort) || parsedYear,
          billNumber: billNum,
          baseAmount: base,
          utilityCharges: extraCharges,
          totalAmount: total,
          dueDate: parsedDueDate,
          status: 'UNPAID',
          notes: notes || '',
        });
        createdCount++;
      }
    }

    res.status(201).json({
      success: true,
      message: `Batch generation complete for ${month}! Generated ${createdCount} new bills, updated ${updatedCount} existing bills for ${flats.length} allotted flats (${emptyFlatsSkipped} empty flat${emptyFlatsSkipped === 1 ? '' : 's'} safely excluded).`,
      data: {
        totalFlats: flats.length,
        allottedCount: flats.length,
        emptyFlatsSkipped,
        createdCount,
        updatedCount,
        month,
        utilityCharges: extraCharges,
        dueDate: parsedDueDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current resident's flat maintenance bills & active due bill
 * @route   GET /api/bills/my-bills
 * @access  Private (Resident)
 */
export const getMyBills = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.flatId) {
      return res.status(200).json({
        success: true,
        data: {
          bills: [],
          activeBill: null,
          totalDues: 0,
        },
      });
    }

    const flatId = user.flatId._id || user.flatId;
    const bills = await Bill.find({ flatId })
      .populate('buildingId', 'name code')
      .populate('paymentId', 'receiptNumber status paymentMethod transactionRef createdAt')
      .sort({ dueDate: -1, createdAt: -1 });

    // Check overdue status on-the-fly (after end of due day has elapsed)
    const now = new Date();
    for (const b of bills) {
      const endOfDue = new Date(b.dueDate);
      endOfDue.setHours(23, 59, 59, 999);
      if (b.status === 'UNPAID' && endOfDue < now) {
        b.status = 'OVERDUE';
        await b.save();
      }
    }

    // Active bill resolution:
    // 1. First UNPAID or OVERDUE bill (earliest due date)
    const unpaidBills = bills.filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE');
    // Sort unpaid by dueDate ascending (oldest due first)
    unpaidBills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const pendingCashBill = bills.find((b) => b.status === 'PENDING_VERIFICATION');
    const latestPaidBill = bills.find((b) => b.status === 'PAID');

    const activeBill = unpaidBills.length > 0 ? unpaidBills[0] : pendingCashBill || latestPaidBill || null;

    const totalDues = unpaidBills.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        bills,
        activeBill,
        totalDues,
        unpaidCount: unpaidBills.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all society bills with filters
 * @route   GET /api/bills
 * @access  Private (Admin)
 */
export const getAllBills = async (req, res, next) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const { month, status, buildingId } = req.query;

    const filter = { societyId };
    if (month && month !== 'ALL') filter.month = month;
    if (status && status !== 'ALL') filter.status = status;
    if (buildingId && buildingId !== 'ALL') filter.buildingId = buildingId;

    const bills = await Bill.find(filter)
      .populate({
        path: 'flatId',
        select: 'flatNumber floor type monthlyMaintenance occupancyStatus ownerId tenantId',
        populate: [
          { path: 'ownerId', select: 'name email phone' },
          { path: 'tenantId', select: 'name email phone' },
        ],
      })
      .populate('buildingId', 'name code')
      .populate('paymentId', 'receiptNumber status paymentMethod createdAt')
      .sort({ createdAt: -1 });

    // Compute stats
    const totalBilled = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalCollected = bills
      .filter((b) => b.status === 'PAID')
      .reduce((sum, b) => sum + (b.paidAmount || b.totalAmount || 0), 0);
    const totalPending = bills
      .filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalOverdue = bills
      .filter((b) => b.status === 'OVERDUE')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Society flat stats for admin billing visibility
    const totalFlats = await Flat.countDocuments({ societyId });
    const allottedFlats = await Flat.countDocuments({
      societyId,
      $or: [
        { occupancyStatus: { $ne: 'VACANT' } },
        { ownerId: { $ne: null } },
        { tenantId: { $ne: null } },
      ],
    });
    const vacantFlats = Math.max(0, totalFlats - allottedFlats);

    res.status(200).json({
      success: true,
      data: {
        bills,
        stats: {
          totalBilled,
          totalCollected,
          totalPending,
          totalOverdue,
          count: bills.length,
          totalFlats,
          allottedFlats,
          vacantFlats,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download high-resolution branded Maintenance Invoice PDF
 * @route   GET /api/bills/:id/invoice-pdf
 * @access  Private
 */
export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate({
        path: 'flatId',
        select: 'flatNumber floor type monthlyMaintenance occupancyStatus ownerId tenantId',
        populate: [
          { path: 'ownerId', select: 'name email phone' },
          { path: 'tenantId', select: 'name email phone' },
        ],
      })
      .populate('buildingId', 'name code')
      .populate('paymentId', 'receiptNumber paymentMethod createdAt');

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Maintenance invoice not found.' });
    }

    const society = await Society.findById(bill.societyId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice-${bill.billNumber}.pdf`);

    generateInvoicePDF(bill, society, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an unpaid maintenance bill
 * @route   DELETE /api/bills/:id
 * @access  Private (Admin)
 */
export const deleteBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Maintenance invoice not found.' });
    }
    if (bill.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an already settled or paid maintenance invoice.',
      });
    }

    await Bill.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Invoice ${bill.billNumber} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Purge all unpaid bills that were generated for empty/unallotted flats
 * @route   POST /api/bills/cleanup-vacant
 * @access  Private (Admin)
 */
export const cleanVacantBills = async (req, res, next) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const vacantFlats = await Flat.find({
      societyId,
      occupancyStatus: 'VACANT',
      ownerId: null,
      tenantId: null,
    }).select('_id');

    const vacantFlatIds = vacantFlats.map((f) => f._id);
    const result = await Bill.deleteMany({
      societyId,
      flatId: { $in: vacantFlatIds },
      status: 'UNPAID',
      paymentId: null,
    });

    res.status(200).json({
      success: true,
      message: `Successfully cleaned up ${result.deletedCount} unpaid invoice(s) for empty/unallotted flats.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
