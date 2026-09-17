import Complaint from '../models/Complaint.js';

/**
 * @desc    Create a new service desk / helpdesk ticket
 * @route   POST /api/complaints
 * @access  Private (Resident / Admin)
 */
export const createComplaint = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const flatId = req.user.flatId?._id || req.user.flatId || req.body.flatId;
    const buildingId = req.user.buildingId?._id || req.user.buildingId || req.body.buildingId;

    if (!flatId) {
      return res.status(400).json({
        success: false,
        message: 'A registered flat is required to raise a ticket.',
      });
    }

    const { title, description, category, priority, images } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required.',
      });
    }

    const complaint = await Complaint.create({
      societyId,
      flatId,
      buildingId,
      raisedBy: req.user._id,
      title,
      description,
      category: category || 'OTHER',
      priority: priority || 'MEDIUM',
      status: 'PENDING',
      images: images || [],
      activityLog: [
        {
          status: 'PENDING',
          note: 'Ticket logged and submitted to facility management.',
          updatedBy: req.user._id,
          timestamp: new Date(),
        },
      ],
    });

    const populated = await Complaint.findById(complaint._id)
      .populate('raisedBy', 'name phone email')
      .populate('flatId', 'flatNumber floor type')
      .populate('buildingId', 'name code');

    // Notify admins via Socket
    if (req.io) {
      req.io.to(`society_${societyId}`).emit('new_complaint', populated);
    }

    res.status(201).json({
      success: true,
      message: 'Ticket raised successfully.',
      data: populated,
    });
  } catch (error) {
    console.error('Error in createComplaint:', error);
    res.status(500).json({ success: false, message: 'Server error creating complaint.' });
  }
};

/**
 * @desc    Get complaints (Admin gets all with filters; Resident gets their flat's tickets)
 * @route   GET /api/complaints
 * @access  Private
 */
export const getComplaints = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const isAdmin = req.user.role === 'SOCIETY_ADMIN' || req.user.role === 'SUPER_ADMIN';

    const { status, category, priority, search } = req.query;
    const filter = { societyId };

    if (!isAdmin) {
      // Resident only views their flat's tickets
      const flatId = req.user.flatId?._id || req.user.flatId;
      filter.$or = [{ flatId }, { raisedBy: req.user._id }];
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (category && category !== 'ALL') {
      filter.category = category;
    }
    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate('raisedBy', 'name phone email')
      .populate('flatId', 'flatNumber floor type')
      .populate('buildingId', 'name code')
      .populate('activityLog.updatedBy', 'name role');

    // Calculate quick stats
    const statsQuery = { societyId };
    if (!isAdmin) {
      statsQuery.$or = [{ flatId: req.user.flatId?._id || req.user.flatId }, { raisedBy: req.user._id }];
    }

    const allSocietyTickets = await Complaint.find(statsQuery).select('status priority');
    const stats = {
      total: allSocietyTickets.length,
      pending: allSocietyTickets.filter((t) => t.status === 'PENDING').length,
      assigned: allSocietyTickets.filter((t) => t.status === 'ASSIGNED').length,
      inProgress: allSocietyTickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: allSocietyTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    };

    res.status(200).json({
      success: true,
      count: complaints.length,
      stats,
      data: complaints,
    });
  } catch (error) {
    console.error('Error in getComplaints:', error);
    res.status(500).json({ success: false, message: 'Server error fetching complaints.' });
  }
};

/**
 * @desc    Get complaint details by ID with full timeline
 * @route   GET /api/complaints/:id
 * @access  Private
 */
export const getComplaintById = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const complaint = await Complaint.findOne({ _id: req.params.id, societyId })
      .populate('raisedBy', 'name phone email')
      .populate('flatId', 'flatNumber floor type')
      .populate('buildingId', 'name code')
      .populate('activityLog.updatedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error('Error in getComplaintById:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving complaint.' });
  }
};

/**
 * @desc    Update complaint status, assign technician, or resolve ticket
 * @route   PATCH /api/complaints/:id/status
 * @access  Private (Admin / Staff)
 */
export const updateComplaintStatus = async (req, res) => {
  try {
    const societyId = req.user.societyId?._id || req.user.societyId;
    const complaint = await Complaint.findOne({ _id: req.params.id, societyId });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const { status, assignedTo, resolutionNotes, note } = req.body;

    if (status) complaint.status = status;
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;
    if (status === 'RESOLVED') {
      complaint.resolvedAt = new Date();
    }

    // Activity note
    let logNote = note;
    if (!logNote) {
      if (status === 'ASSIGNED' && assignedTo?.name) {
        logNote = `Technician assigned: ${assignedTo.name} (${assignedTo.phone || 'No phone'}).`;
      } else if (status === 'RESOLVED') {
        logNote = resolutionNotes ? `Resolved: ${resolutionNotes}` : 'Issue marked resolved by administration.';
      } else {
        logNote = `Status changed to ${status}.`;
      }
    }

    complaint.activityLog.push({
      status: status || complaint.status,
      note: logNote,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('raisedBy', 'name phone email')
      .populate('flatId', 'flatNumber floor type')
      .populate('buildingId', 'name code')
      .populate('activityLog.updatedBy', 'name role');

    // Notify resident directly & broadcast to society
    if (req.io) {
      req.io.to(`flat_${complaint.flatId}`).emit('complaint_updated', updated);
      req.io.to(`society_${societyId}`).emit('complaint_updated', updated);
    }

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Error in updateComplaintStatus:', error);
    res.status(500).json({ success: false, message: 'Server error updating ticket status.' });
  }
};
