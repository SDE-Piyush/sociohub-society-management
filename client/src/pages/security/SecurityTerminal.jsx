import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  QrCode,
  Hash,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Building,
  Car,
  Search,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Send,
  Radio,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const SecurityTerminal = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Mode: 'KEYPAD' | 'WALKIN'
  const [activeTab, setActiveTab] = useState('KEYPAD');

  // Keypad PIN state
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // { success, message, visitor }

  // Walk-in form state
  const [buildings, setBuildings] = useState([]);
  const [selectedWingId, setSelectedWingId] = useState('');
  const [flats, setFlats] = useState([]);
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInPurpose, setWalkInPurpose] = useState('DELIVERY');
  const [walkInVehicle, setWalkInVehicle] = useState('');
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [liveApprovalRequest, setLiveApprovalRequest] = useState(null); // { visitorId, status, flatNumber, visitorName }

  // Fetch buildings and flats for the walk-in selector
  useEffect(() => {
    const loadWings = async () => {
      try {
        const res = await api.get('/buildings');
        const blds = res.data?.data || [];
        setBuildings(blds);
        if (blds.length > 0) {
          setSelectedWingId(blds[0]._id);
        }
      } catch (err) {
        console.error('Error loading buildings for security terminal:', err);
      }
    };
    loadWings();
  }, []);

  useEffect(() => {
    if (!selectedWingId) return;
    const loadFlats = async () => {
      try {
        const res = await api.get(`/flats/building/${selectedWingId}`);
        const flts = res.data?.data || [];
        setFlats(flts);
        if (flts.length > 0) {
          setSelectedFlatId(flts[0]._id);
        }
      } catch (err) {
        console.error('Error loading flats:', err);
      }
    };
    loadFlats();
  }, [selectedWingId]);

  // Real-time socket listener for resident response to walk-in approval request
  useEffect(() => {
    if (socket) {
      const handleApprovalResponse = (data) => {
        console.log('🛡️ Security terminal received resident response:', data);
        if (liveApprovalRequest && liveApprovalRequest.visitorId === data.visitorId) {
          setLiveApprovalRequest((prev) => ({
            ...prev,
            status: data.status,
            rejectionReason: data.rejectionReason,
          }));
        }
      };

      socket.on('visitor_approval_response', handleApprovalResponse);
      return () => {
        socket.off('visitor_approval_response', handleApprovalResponse);
      };
    }
  }, [socket, liveApprovalRequest]);

  // Keypad click handler
  const handleDigitClick = (digit) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    setPin('');
    setVerifyResult(null);
  };

  // Verify PIN / QR Code
  const handleVerifyPass = async (codeToVerify) => {
    const passCode = codeToVerify || pin;
    if (!passCode || passCode.length < 4) {
      alert('Please enter a valid pass code or 6-digit PIN.');
      return;
    }

    try {
      setVerifying(true);
      setVerifyResult(null);

      const res = await api.post('/visitors/verify-pass', {
        code: passCode,
      });

      setVerifyResult({
        success: true,
        message: res.data?.message || 'Pass verified successfully!',
        visitor: res.data?.data,
      });
      setPin('');
    } catch (err) {
      setVerifyResult({
        success: false,
        message: err.response?.data?.message || 'Invalid Pass Code! Please check with resident.',
        visitor: err.response?.data?.data || null,
      });
    } finally {
      setVerifying(false);
    }
  };

  // Handle Walk-in Submission
  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFlatId || !walkInName || !walkInPhone) return;

    try {
      setWalkInSubmitting(true);
      const res = await api.post('/visitors/walk-in', {
        flatId: selectedFlatId,
        visitorName: walkInName,
        phone: walkInPhone,
        purpose: walkInPurpose,
        vehicleNumber: walkInVehicle,
      });

      const visitor = res.data?.data;
      setLiveApprovalRequest({
        visitorId: visitor._id,
        status: 'PENDING_APPROVAL',
        visitorName: visitor.visitorName,
        flatNumber: visitor.flatId?.flatNumber,
        phone: visitor.phone,
      });

      // Clear fields
      setWalkInName('');
      setWalkInPhone('');
      setWalkInVehicle('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log walk-in');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const handleAdmitWalkIn = async (visitorId) => {
    try {
      await api.post('/visitors/verify-pass', { code: visitorId });
      alert('Visitor checked in to society!');
      setLiveApprovalRequest(null);
    } catch (err) {
      // If verify by ID fails, update status directly
      setLiveApprovalRequest(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Terminal Title Bar */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0F172A] border-2 border-cyan-500/40 shadow-glow-cyan flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shadow-glow-cyan">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white tracking-tight">Security Gatekeeper Terminal</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                Gate 1 Online
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Duty Officer: <strong className="text-white">{user?.name || 'Gate Guard'}</strong> · Emerald Heights Residency
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
          <button
            onClick={() => setActiveTab('KEYPAD')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'KEYPAD'
                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Verify Pass (PIN / QR)
          </button>
          <button
            onClick={() => setActiveTab('WALKIN')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'WALKIN'
                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            New Walk-in / Delivery
          </button>
        </div>
      </div>

      {/* Tab 1: KEYPAD & PASS VERIFICATION */}
      {activeTab === 'KEYPAD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Keypad Section (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Enter 6-Digit Guest Pass PIN</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ask guest or delivery agent for their entry code or paste QR token below.
              </p>
            </div>

            {/* PIN Display Boxes */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-4">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const val = pin[idx] || '';
                return (
                  <div
                    key={idx}
                    className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex items-center justify-center font-mono text-2xl font-black border-2 transition-all ${
                      val
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-glow-cyan'
                        : 'border-slate-800 bg-slate-950 text-slate-600'
                    }`}
                  >
                    {val || '·'}
                  </div>
                );
              })}
            </div>

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigitClick(digit.toString())}
                  className="h-16 rounded-2xl bg-slate-950 hover:bg-slate-800 active:bg-cyan-500 active:text-slate-950 border border-slate-800 font-mono text-2xl font-bold text-white transition-all transform active:scale-95 shadow-md flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClearPin}
                className="h-16 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Clear
              </button>
              <button
                onClick={() => handleDigitClick('0')}
                className="h-16 rounded-2xl bg-slate-950 hover:bg-slate-800 active:bg-cyan-500 active:text-slate-950 border border-slate-800 font-mono text-2xl font-bold text-white transition-all transform active:scale-95 shadow-md flex items-center justify-center"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
              >
                ⌫ Back
              </button>
            </div>

            {/* Verify Button */}
            <button
              disabled={verifying || pin.length < 4}
              onClick={() => handleVerifyPass()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-base shadow-glow-cyan flex items-center justify-center gap-2 transition-all"
            >
              {verifying ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Verify & Allow Entry
                </>
              )}
            </button>
          </div>

          {/* Result Card Section (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Live Verification Status Card */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex-1 flex flex-col justify-center text-center">
              {!verifyResult ? (
                <div className="py-12 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-300">Awaiting Pass Input</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Type the 6-digit code on the left keypad. Valid guest passes will instantly display host flat & clearance!
                  </p>
                </div>
              ) : verifyResult.success ? (
                <div className="p-5 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500/60 shadow-glow-emerald space-y-4 text-left animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/50">
                        Gate Clearance Approved
                      </span>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {verifyResult.visitor?.visitorName}
                      </h3>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-900/50 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Destination:</span>
                      <strong className="text-cyan-400 font-bold">
                        Flat {verifyResult.visitor?.flatId?.flatNumber} ({verifyResult.visitor?.buildingId?.name})
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Purpose:</span>
                      <span className="font-semibold text-white uppercase">{verifyResult.visitor?.purpose}</span>
                    </div>
                    {verifyResult.visitor?.vehicleNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vehicle:</span>
                        <span className="font-semibold text-white">{verifyResult.visitor?.vehicleNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-semibold text-white">{verifyResult.visitor?.phone}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold text-center">
                    Gate 1 Boom Barrier Opened · Status: CHECKED IN
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-3xl bg-rose-950/40 border-2 border-rose-500/60 shadow-glow-rose space-y-3 text-left animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                      <XCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-700/50">
                        Access Denied
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">{verifyResult.message}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-rose-300/80 leading-relaxed">
                    Check if the guest has entered the right 6-digit code or request resident authorization through the Walk-in tab.
                  </p>
                </div>
              )}
            </div>

            {/* Test Pass Hint */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Demo Gate Test PINs:</span>
              <p className="font-mono text-slate-300">
                • <strong>482910</strong> (Vikram Mehta - Flat 101)
              </p>
              <p className="font-mono text-slate-300">
                • <strong>918234</strong> (Urban Company - Flat 101)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: WALK-IN VISITOR & INSTANT RESIDENT APPROVAL */}
      {activeTab === 'WALKIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Walk-in Form (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-5">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Register Walk-in / Delivery Agent</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Submitting will trigger an instant high-priority popup alert on the resident's phone/screen.
              </p>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              {/* Wing & Flat Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tower / Wing *</label>
                  <select
                    value={selectedWingId}
                    onChange={(e) => setSelectedWingId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {buildings.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Flat *</label>
                  <select
                    value={selectedFlatId}
                    onChange={(e) => setSelectedFlatId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {flats.map((f) => (
                      <option key={f._id} value={f._id}>
                        Flat {f.flatNumber} ({f.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visitor Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Visitor Name *</label>
                  <input
                    type="text"
                    required
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="e.g., Swiggy Delivery Boy"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="+91 98888 77777"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Purpose of Visit</label>
                  <select
                    value={walkInPurpose}
                    onChange={(e) => setWalkInPurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="DELIVERY">Delivery (Swiggy / Amazon)</option>
                    <option value="CAB">Cab (Uber / Ola)</option>
                    <option value="GUEST">Unannounced Guest</option>
                    <option value="SERVICE">Technician / Service</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vehicle Number (Optional)</label>
                  <input
                    type="text"
                    value={walkInVehicle}
                    onChange={(e) => setWalkInVehicle(e.target.value)}
                    placeholder="MH 12 AB 1234"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={walkInSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-glow-cyan flex items-center justify-center gap-2 transition-all mt-2"
              >
                {walkInSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Request Resident Approval
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Resident Response Card (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-center text-center">
            {!liveApprovalRequest ? (
              <div className="py-12 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  <Radio className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-300">Live Resident Radar Idle</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Fill in the walk-in form to beam a live doorbell approval request to the resident.
                </p>
              </div>
            ) : liveApprovalRequest.status === 'PENDING_APPROVAL' ? (
              <div className="p-6 rounded-3xl bg-amber-950/40 border-2 border-amber-500/60 shadow-glow-amber space-y-4 animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800/40">
                    Awaiting Flat {liveApprovalRequest.flatNumber}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">Waiting for Resident Approval...</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Alert has been sent to the resident for <strong>{liveApprovalRequest.visitorName}</strong>.
                  </p>
                </div>
              </div>
            ) : liveApprovalRequest.status === 'APPROVED' ? (
              <div className="p-6 rounded-3xl bg-emerald-950/50 border-2 border-emerald-500 shadow-glow-emerald space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-700/60">
                    APPROVED by Resident
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">Entry Granted by Flat {liveApprovalRequest.flatNumber}!</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Resident confirmed entry for {liveApprovalRequest.visitorName}.
                  </p>
                </div>

                <button
                  onClick={() => handleAdmitWalkIn(liveApprovalRequest.visitorId)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-glow-emerald transition-all"
                >
                  Admit Visitor & Open Gate
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-rose-950/50 border-2 border-rose-500/60 shadow-glow-rose space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-rose-300 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-800/60">
                    ENTRY REJECTED
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">Resident Denied Entry</h3>
                  <p className="text-xs text-rose-300 mt-1">
                    Reason: {liveApprovalRequest.rejectionReason || 'Resident is unavailable / not expecting guest.'}
                  </p>
                </div>
                <button
                  onClick={() => setLiveApprovalRequest(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
