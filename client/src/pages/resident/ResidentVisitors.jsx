import React, { useState, useEffect } from 'react';
import {
  QrCode,
  PlusCircle,
  Clock,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Shield,
  Phone,
  Car,
  User,
  ExternalLink,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const ResidentVisitors = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [generatedPass, setGeneratedPass] = useState(null);
  const [copied, setCopied] = useState(false);

  // Pass Form
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('GUEST');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [validHours, setValidHours] = useState('24');
  const [submitting, setSubmitting] = useState(false);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/visitors/my-visitors');
      setVisitors(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();

    if (socket) {
      const handleVisitorUpdate = () => {
        fetchVisitors();
      };
      socket.on('visitor_checked_in', handleVisitorUpdate);
      socket.on('visitor_approval_response', handleVisitorUpdate);
      return () => {
        socket.off('visitor_checked_in', handleVisitorUpdate);
        socket.off('visitor_approval_response', handleVisitorUpdate);
      };
    }
  }, [socket]);

  const handleGeneratePass = async (e) => {
    e.preventDefault();
    if (!visitorName.trim() || !phone.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post('/visitors/pre-approve', {
        visitorName,
        phone,
        purpose,
        vehicleNumber,
        validHours,
      });

      const pass = res.data?.data;
      setGeneratedPass(pass);
      setIsCreateModalOpen(false);

      // Reset form
      setVisitorName('');
      setPhone('');
      setPurpose('GUEST');
      setVehicleNumber('');
      fetchVisitors();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate guest pass');
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppShareLink = (pass) => {
    const flatNum = user?.flatId?.flatNumber || 'Flat';
    const societyName = user?.societyId?.name || 'Emerald Heights Residency';
    const message = `Namaste ${pass.visitorName}! Here is your Digital Guest Entry Pass for ${societyName}, Flat ${flatNum}.\n\n` +
      `🎟️ 6-Digit Gate PIN: ${pass.passCode}\n` +
      `🕒 Valid Until: ${new Date(pass.validUntil).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}\n` +
      `Show this PIN or QR code to the security guard at Gate 1 for express entry.`;

    return `https://wa.me/${pass.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const handleCopyPass = (pass) => {
    const flatNum = user?.flatId?.flatNumber || 'Flat';
    const text = `Guest Pass for Flat ${flatNum} | PIN: ${pass.passCode} | Valid Until: ${new Date(pass.validUntil).toLocaleString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expectedPasses = visitors.filter((v) => v.status === 'EXPECTED');
  const pastVisitors = visitors.filter((v) => v.status !== 'EXPECTED');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Guest Passes & Visitors</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              Gatekeeper
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Pre-approve guests, delivery agents, and cabs with 6-digit PINs & express QR passes.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow-cyan transition-all transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Invite Guest (New Pass)
        </button>
      </div>

      {/* Active Pre-Approved Passes */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-cyan-400" />
          Active Pre-Approved Passes ({expectedPasses.length})
        </h2>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : expectedPasses.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/70 text-center">
            <QrCode className="w-12 h-12 text-cyan-500/40 mx-auto mb-2" />
            <p className="text-slate-300 font-semibold text-sm">No Active Guest Passes</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Expecting a delivery or friend? Tap "Invite Guest" to generate an express pass!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {expectedPasses.map((pass) => (
              <div
                key={pass._id}
                className="relative rounded-3xl p-6 bg-gradient-to-b from-slate-900/90 to-slate-950 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.12)] space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                    {pass.purpose}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Valid till {new Date(pass.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Visitor Info */}
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{pass.visitorName}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-500" />
                    {pass.phone}
                  </p>
                </div>

                {/* Pass Code & QR Container */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      6-Digit Gate PIN
                    </span>
                    <p className="text-2xl font-black text-cyan-400 tracking-widest font-mono mt-0.5">
                      {pass.passCode}
                    </p>
                  </div>

                  <div className="p-2 bg-white rounded-xl shadow-md">
                    <QRCodeSVG value={pass.qrToken || pass.passCode} size={64} level="M" />
                  </div>
                </div>

                {/* Share Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={getWhatsAppShareLink(pass)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-glow-emerald"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>

                  <button
                    onClick={() => handleCopyPass(pass)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visitor Log History */}
      {pastVisitors.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-base font-bold text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Visitor Gate Logs ({pastVisitors.length})
          </h2>

          <div className="space-y-3">
            {pastVisitors.map((v) => (
              <div
                key={v._id}
                className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between flex-wrap gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{v.visitorName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.status === 'CHECKED_IN'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                            : v.status === 'CHECKED_OUT'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-rose-950/80 text-rose-400'
                        }`}
                      >
                        {v.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">{v.purpose}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {v.checkInTime
                        ? `Checked in: ${new Date(v.checkInTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`
                        : `Logged: ${new Date(v.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 font-mono">
                  PIN: {v.passCode}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Generate Pass Form */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate Pre-Approved Guest Pass"
      >
        <form onSubmit={handleGeneratePass} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Guest Full Name *</label>
            <input
              type="text"
              required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g., Vikram Mehta / Urban Co Tech"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Guest Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98220 11223"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Visit Purpose</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="GUEST">Guest / Family</option>
                <option value="DELIVERY">Delivery (Amazon/Swiggy)</option>
                <option value="CAB">Cab (Uber/Ola)</option>
                <option value="SERVICE">Service / Technician</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vehicle Number (Optional)</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="MH 12 AB 1234"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pass Validity</label>
              <select
                value={validHours}
                onChange={(e) => setValidHours(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="6">6 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours (Full Day)</option>
                <option value="48">48 Hours (Weekend)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-cyan transition-all"
            >
              {submitting ? 'Generating...' : 'Generate 6-Digit PIN Pass'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Show Newly Generated Pass */}
      <Modal
        isOpen={!!generatedPass}
        onClose={() => setGeneratedPass(null)}
        title="Guest Pass Ready for Gate Entry"
      >
        {generatedPass && (
          <div className="text-center space-y-5">
            <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-glow-cyan inline-block mx-auto">
              <QRCodeSVG value={generatedPass.qrToken || generatedPass.passCode} size={160} level="H" />
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                6-Digit Security PIN
              </span>
              <p className="text-3xl font-black text-cyan-400 tracking-widest font-mono mt-1">
                {generatedPass.passCode}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Issued for <strong>{generatedPass.visitorName}</strong> ({generatedPass.purpose})
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={getWhatsAppShareLink(generatedPass)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-emerald transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </a>

              <button
                onClick={() => setGeneratedPass(null)}
                className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
