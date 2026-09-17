import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  PlusCircle,
  Clock,
  CheckCircle2,
  Wrench,
  Phone,
  AlertTriangle,
  FileText,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import { useSocket } from '../../context/SocketContext';

export const ResidentHelpdesk = () => {
  const { socket } = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('PLUMBING');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints');
      setComplaints(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();

    if (socket) {
      const handleUpdate = () => {
        fetchMyTickets();
      };
      socket.on('complaint_updated', handleUpdate);
      return () => {
        socket.off('complaint_updated', handleUpdate);
      };
    }
  }, [socket]);

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post('/complaints', {
        title,
        description,
        category,
        priority,
      });

      setSuccessMsg(`Ticket ${res.data?.data?.ticketNumber} logged! Staff notified.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setIsRaiseModalOpen(false);

      setTitle('');
      setDescription('');
      setCategory('PLUMBING');
      setPriority('MEDIUM');
      fetchMyTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for 4-stage stepper
  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'ASSIGNED':
        return 1;
      case 'IN_PROGRESS':
        return 2;
      case 'RESOLVED':
      case 'CLOSED':
        return 3;
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'Submitted', desc: 'Logged & queued' },
    { label: 'Assigned', desc: 'Technician assigned' },
    { label: 'In-Progress', desc: 'Work underway' },
    { label: 'Resolved', desc: 'Work completed' },
  ];

  const activeTickets = complaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const pastTickets = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Helpdesk & Service Desk</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              Assistance
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Report maintenance issues, plumbing leaks, or electrical failures with real-time technician dispatch.
          </p>
        </div>

        <button
          onClick={() => setIsRaiseModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow-fuchsia transition-all transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Raise Service Ticket
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* Active Tickets with 4-Step Lifecycles */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-cyan-400" />
          Active Service Requests ({activeTickets.length})
        </h2>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTickets.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/70 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-2" />
            <p className="text-slate-300 font-semibold text-sm">No Active Tickets</p>
            <p className="text-xs text-slate-500 mt-0.5">Everything in your flat is running smoothly!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {activeTickets.map((ticket) => {
              const currentStep = getStepIndex(ticket.status);
              return (
                <div
                  key={ticket._id}
                  className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 hover:border-slate-700/80 transition-all space-y-5"
                >
                  {/* Top Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/70 px-2.5 py-0.5 rounded-md border border-cyan-800/40">
                        {ticket.ticketNumber}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                          ticket.priority === 'EMERGENCY'
                            ? 'bg-rose-950/90 text-rose-400 border-rose-700/60 animate-pulse'
                            : ticket.priority === 'HIGH'
                            ? 'bg-orange-950/90 text-orange-400 border-orange-700/60'
                            : ticket.priority === 'MEDIUM'
                            ? 'bg-amber-950/90 text-amber-400 border-amber-700/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700/60'
                        }`}
                      >
                        {ticket.priority} Priority
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/40">
                        {ticket.category}
                      </span>
                    </div>

                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Raised on {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{ticket.title}</h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">{ticket.description}</p>
                  </div>

                  {/* 4-Step Interactive Lifecycle Stepper */}
                  <div className="pt-2">
                    <div className="relative flex items-center justify-between">
                      {/* Connecting Line */}
                      <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-slate-800 z-0">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${(currentStep / 3) * 100}%` }}
                        />
                      </div>

                      {steps.map((step, idx) => {
                        const isCompleted = idx < currentStep;
                        const isCurrent = idx === currentStep;
                        return (
                          <div key={step.label} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                isCompleted
                                  ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald'
                                  : isCurrent
                                  ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-glow-cyan animate-pulse'
                                  : 'bg-slate-900 border-2 border-slate-700 text-slate-500'
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span
                              className={`mt-2 text-xs font-semibold ${
                                isCurrent ? 'text-cyan-400' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="text-[10px] text-slate-500 hidden sm:block">{step.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assigned Technician Banner */}
                  {ticket.assignedTo?.name ? (
                    <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">
                            Assigned Technician: {ticket.assignedTo.name}
                          </p>
                          <p className="text-[11px] text-cyan-400">{ticket.assignedTo.role}</p>
                        </div>
                      </div>

                      {ticket.assignedTo.phone && (
                        <a
                          href={`tel:${ticket.assignedTo.phone}`}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 border border-cyan-500/40 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call {ticket.assignedTo.phone}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                      <span>Awaiting administration assignment of campus technician...</span>
                      <span className="text-amber-400 text-[11px] font-semibold">Priority Queued</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                    >
                      View Ticket History ({ticket.activityLog?.length || 0} updates)
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past / Resolved Tickets */}
      {pastTickets.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-base font-bold text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Resolved Tickets ({pastTickets.length})
          </h2>

          <div className="space-y-3">
            {pastTickets.map((ticket) => (
              <div
                key={ticket._id}
                className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{ticket.ticketNumber}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                      RESOLVED
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">{ticket.title}</span>
                  </div>
                  {ticket.resolutionNotes && (
                    <p className="text-xs text-slate-400 mt-1">
                      <strong className="text-emerald-300">Resolution:</strong> {ticket.resolutionNotes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800/60 shrink-0"
                >
                  Logs
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raise Ticket Modal */}
      <Modal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        title="Raise Service / Helpdesk Ticket"
      >
        <form onSubmit={handleRaiseTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Problem Summary *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Water leakage in master bathroom shower"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="PLUMBING">Plumbing (Water / Pipes)</option>
                <option value="ELECTRICAL">Electrical (Lights / Choke)</option>
                <option value="ELEVATOR">Elevator / Lift</option>
                <option value="SECURITY">Security / Intercom</option>
                <option value="CARPENTRY">Carpentry & Doors</option>
                <option value="CLEANLINESS">Cleanliness / Garbage</option>
                <option value="PARKING">Parking Dispute</option>
                <option value="OTHER">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="LOW">Low (Routine)</option>
                <option value="MEDIUM">Medium (Normal)</option>
                <option value="HIGH">High (Within 6h)</option>
                <option value="EMERGENCY">Emergency (Immediate)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Detailed Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide exact location, severity, when it started, and if flat access is available..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRaiseModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-fuchsia transition-all"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Ticket Timeline Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Ticket Progress — ${selectedTicket?.ticketNumber}`}
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
