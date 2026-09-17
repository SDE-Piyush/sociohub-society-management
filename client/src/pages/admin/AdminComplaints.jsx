import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  CheckCircle2,
  Clock,
  User,
  Wrench,
  AlertTriangle,
  Phone,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Check,
  Shield,
  Building,
} from 'lucide-react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import { StatCard } from '../../components/common/StatCard';
import { useSocket } from '../../context/SocketContext';

export const AdminComplaints = () => {
  const { socket } = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Modals
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  // Form states for assignment
  const [techName, setTechName] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techRole, setTechRole] = useState('');
  const [assignNote, setAssignNote] = useState('');

  // Form states for resolution
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints', {
        params: {
          status: filterStatus,
          category: filterCategory,
          search: search || undefined,
        },
      });
      setComplaints(res.data?.data || []);
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filterStatus, filterCategory, search]);

  // Real-time socket updates
  useEffect(() => {
    if (socket) {
      const handleComplaintUpdate = () => {
        fetchComplaints();
      };
      socket.on('new_complaint', handleComplaintUpdate);
      socket.on('complaint_updated', handleComplaintUpdate);
      return () => {
        socket.off('new_complaint', handleComplaintUpdate);
        socket.off('complaint_updated', handleComplaintUpdate);
      };
    }
  }, [socket]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setSubmitting(true);
      await api.patch(`/complaints/${selectedTicket._id}/status`, {
        status: 'ASSIGNED',
        assignedTo: {
          name: techName,
          phone: techPhone,
          role: techRole || 'Service Technician',
        },
        note: assignNote || `Assigned to ${techName} (${techRole || 'Technician'})`,
      });

      setFeedback('Technician assigned successfully!');
      setTimeout(() => setFeedback(null), 4000);
      setIsAssignModalOpen(false);
      setSelectedTicket(null);
      setTechName('');
      setTechPhone('');
      setTechRole('');
      setAssignNote('');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign technician');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticket, nextStatus) => {
    try {
      await api.patch(`/complaints/${ticket._id}/status`, {
        status: nextStatus,
      });
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setSubmitting(true);
      await api.patch(`/complaints/${selectedTicket._id}/status`, {
        status: 'RESOLVED',
        resolutionNotes,
      });

      setFeedback(`Ticket ${selectedTicket.ticketNumber} marked resolved!`);
      setTimeout(() => setFeedback(null), 4000);
      setIsResolveModalOpen(false);
      setSelectedTicket(null);
      setResolutionNotes('');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Helpdesk & Service Desk</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-800/40">
              Operations
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Track resident issues through the full lifecycle: Pending ➔ Assigned ➔ In Progress ➔ Resolved.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {feedback}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquareWarning}
          label="Total Tickets"
          value={stats.total}
          color="cyan"
          trend="All reported incidents"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Triage"
          value={stats.pending}
          color="amber"
          trend="Awaiting technician assignment"
        />
        <StatCard
          icon={Wrench}
          label="Assigned / Active"
          value={stats.assigned + stats.inProgress}
          color="purple"
          trend="Technicians dispatched"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved / Closed"
          value={stats.resolved}
          color="emerald"
          trend="Successfully completed"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-thin">
          {['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-glow-fuchsia'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/40'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Category & Search */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="ELEVATOR">Elevator</option>
            <option value="SECURITY">Security</option>
            <option value="CARPENTRY">Carpentry</option>
            <option value="PARKING">Parking</option>
            <option value="OTHER">Other</option>
          </select>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/30 border border-slate-800/60 p-8">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">No complaints found</p>
          <p className="text-xs text-slate-500 mt-1">Great job! All reported issues are addressed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((ticket) => (
            <div
              key={ticket._id}
              className="p-5 md:p-6 rounded-3xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Left Details */}
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded-md border border-cyan-800/40">
                    {ticket.ticketNumber}
                  </span>

                  {/* Priority */}
                  <span
                    className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${
                      ticket.priority === 'EMERGENCY'
                        ? 'bg-rose-950/90 text-rose-400 border-rose-700/60 animate-pulse'
                        : ticket.priority === 'HIGH'
                        ? 'bg-orange-950/90 text-orange-400 border-orange-700/60'
                        : ticket.priority === 'MEDIUM'
                        ? 'bg-amber-950/90 text-amber-400 border-amber-700/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    {ticket.priority}
                  </span>

                  {/* Category */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/40">
                    {ticket.category}
                  </span>

                  {/* Status Pill */}
                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                      ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/50'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'bg-blue-950/80 text-blue-400 border-blue-700/50'
                        : ticket.status === 'ASSIGNED'
                        ? 'bg-purple-950/80 text-purple-400 border-purple-700/50'
                        : 'bg-amber-950/80 text-amber-400 border-amber-700/50'
                    }`}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                  {ticket.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {ticket.description}
                </p>

                {/* Flat & Submitter */}
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Building className="w-3.5 h-3.5 text-cyan-400" />
                    Flat {ticket.flatId?.flatNumber || 'N/A'} ({ticket.buildingId?.name || 'Main'})
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {ticket.raisedBy?.name} ({ticket.raisedBy?.phone || 'No phone'})
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                {/* Technician Assignment Info */}
                {ticket.assignedTo?.name && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-slate-300 font-medium">Assigned: {ticket.assignedTo.name}</span>
                      <span className="text-slate-500 font-mono">({ticket.assignedTo.phone})</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      {ticket.assignedTo.role}
                    </span>
                  </div>
                )}

                {/* Resolution Notes */}
                {ticket.resolutionNotes && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
                    <strong>Resolution:</strong> {ticket.resolutionNotes}
                  </div>
                )}
              </div>

              {/* Right Action Controls */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0">
                {ticket.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsAssignModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-purple flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Assign Technician
                  </button>
                )}

                {ticket.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleStatusChange(ticket, 'IN_PROGRESS')}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Start Work (In-Progress)
                  </button>
                )}

                {ticket.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsResolveModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-glow-emerald flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Resolved
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setIsTimelineModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Clock className="w-3 h-3" />
                  View History ({ticket.activityLog?.length || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Assign Technician */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Technician — ${selectedTicket?.ticketNumber}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Technician Name *</label>
            <input
              type="text"
              required
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
              placeholder="e.g., Raju Mistri"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone *</label>
              <input
                type="text"
                required
                value={techPhone}
                onChange={(e) => setTechPhone(e.target.value)}
                placeholder="+91 98221 11223"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Specialization / Vendor</label>
              <input
                type="text"
                value={techRole}
                onChange={(e) => setTechRole(e.target.value)}
                placeholder="e.g., Senior Plumber / Urban Co"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Instructions / Note for Log</label>
            <input
              type="text"
              value={assignNote}
              onChange={(e) => setAssignNote(e.target.value)}
              placeholder="e.g., Inspect Flat ceiling dampness and repair CPVC valve"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-glow-purple transition-all"
            >
              {submitting ? 'Dispatching...' : 'Dispatch & Notify Resident'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Mark Resolved */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Resolve Ticket — ${selectedTicket?.ticketNumber}`}
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution Summary *</label>
            <textarea
              required
              rows={4}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe what repair was conducted, parts replaced, or actions taken..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsResolveModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow-emerald transition-all"
            >
              {submitting ? 'Resolving...' : 'Close Ticket as Resolved'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Ticket History Timeline */}
      <Modal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        title={`Activity Log — ${selectedTicket?.ticketNumber}`}
      >
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {selectedTicket?.activityLog?.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3 relative pb-4 border-l border-slate-800 pl-4 ml-2 last:border-l-0">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 border-2 border-cyan-500" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase">{log.status.replace('_', ' ')}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{log.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
