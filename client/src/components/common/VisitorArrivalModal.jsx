import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, User, Phone, Car, Clock, Sparkles } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const VisitorArrivalModal = () => {
  const { user } = useAuth();
  const { incomingVisitor, respondToArrival, dismissArrival } = useSocket();
  const [loading, setLoading] = useState(false);
  const [showDenyReason, setShowDenyReason] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  // Absolutely never display for security guards or admins
  if (user?.role !== 'RESIDENT' || !incomingVisitor) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);
      await respondToArrival(incomingVisitor.visitorId, 'APPROVE');
    } catch (err) {
      alert('Error approving visitor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    try {
      setLoading(true);
      await respondToArrival(incomingVisitor.visitorId, 'REJECT', denyReason || 'Resident denied entry.');
    } catch (err) {
      alert('Error denying visitor.');
    } finally {
      setLoading(false);
      setShowDenyReason(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0F172A] border-2 border-cyan-500/60 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-white overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header with Pulsing Gatekeeper Badge */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
                Gate 1 Live Arrival
              </span>
              <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
                Visitor at Society Gate
              </h3>
            </div>
          </div>
          <button
            onClick={dismissArrival}
            className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 transition-colors"
          >
            Dismiss
          </button>
        </div>

        {/* Visitor Details Card */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white leading-tight">
                  {incomingVisitor.visitorName}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-500" />
                  {incomingVisitor.phone}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
              {incomingVisitor.purpose}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            {incomingVisitor.vehicleNumber && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Car className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{incomingVisitor.vehicleNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Just now ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Security guard at Main Gate has logged this guest for your Flat{' '}
          <strong className="text-cyan-400">{incomingVisitor.flatNumber}</strong>. Please grant or deny entry.
        </p>

        {/* Deny reason input if expanded */}
        {showDenyReason && (
          <div className="mt-4 space-y-2 animate-fadeIn">
            <label className="text-xs font-semibold text-rose-400">Reason for Denying Entry (Optional):</label>
            <input
              type="text"
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="e.g., Wrong flat, Not expecting delivery, Person unknown..."
              className="w-full bg-slate-900 border border-rose-900/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          {!showDenyReason ? (
            <>
              <button
                disabled={loading}
                onClick={() => setShowDenyReason(true)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 flex items-center justify-center gap-2 transition-all"
              >
                <XCircle className="w-4 h-4" />
                Deny Entry
              </button>

              <button
                disabled={loading}
                onClick={handleApprove}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-glow-emerald flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Entry
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                disabled={loading}
                onClick={() => setShowDenyReason(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                disabled={loading}
                onClick={handleDeny}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 transition-all shadow-glow-rose"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Confirm Rejection
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
