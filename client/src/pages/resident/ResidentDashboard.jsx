import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  QrCode,
  CreditCard,
  MessageSquareWarning,
  CalendarDays,
  Sparkles,
  ShieldCheck,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  PhoneCall,
  Zap,
  Droplets,
  Car,
  Bell,
  Share2,
  Copy,
  Check,
  Banknote,
  FileCheck,
  ExternalLink,
  Wrench,
  Pencil,
  FileDown,
  Vote,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Modal } from '../../components/common/Modal';
import api from '../../api/axios';

export const ResidentDashboard = () => {
  const { user } = useAuth();
  const { incomingVisitor, respondToArrival } = useSocket();
  const navigate = useNavigate();
  const [respondingVisitor, setRespondingVisitor] = useState(false);

  // Payment states
  const [activeModal, setActiveModal] = useState(null); // 'GUEST' | 'PAYMENT' | 'TICKET' | 'BOOKING' | 'RECEIPT'
  const [paymentTab, setPaymentTab] = useState('UPI'); // 'UPI' | 'CASH'
  const [upiRef, setUpiRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({ isPaid: false, isPendingCash: false, currentMonthPayment: null });
  const [activeBill, setActiveBill] = useState(null);
  const [allBills, setAllBills] = useState([]);

  // Phase 2 Live Data
  const [liveNotices, setLiveNotices] = useState([]);
  const [liveTickets, setLiveTickets] = useState([]);

  // Guest pass states
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [generatedPass, setGeneratedPass] = useState(null);

  const flatInfo = user?.flatId || {
    flatNumber: '101',
    floor: 1,
    type: '3BHK',
    monthlyMaintenance: 4200,
  };

  const buildingInfo = user?.buildingId || {
    name: 'Wing A - Aster',
    code: 'A',
  };

  // Dynamic Bill Values computed from activeBill (from Batch Bill Generator)
  const currentBillAmount = activeBill !== null && activeBill?.totalAmount !== undefined
    ? activeBill.totalAmount
    : (flatInfo.monthlyMaintenance || 4200);
  const currentBillMonth = activeBill?.month || 'Current Month';
  const isBillPaid = activeBill ? activeBill.status === 'PAID' : paymentData.isPaid;
  const isBillPendingCash = activeBill ? activeBill.status === 'PENDING_VERIFICATION' : paymentData.isPendingCash;
  const isBillOverdue = activeBill
    ? activeBill.status === 'OVERDUE' ||
      (activeBill.status === 'UNPAID' && (() => {
        const d = new Date(activeBill.dueDate);
        d.setHours(23, 59, 59, 999);
        return d < new Date();
      })())
    : false;
  const formattedDueDate = activeBill?.dueDate
    ? new Date(activeBill.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '5th of month';

  const maintenanceAmt = currentBillAmount;
  const [societyUpiId, setSocietyUpiId] = useState(
    localStorage.getItem('sociohub_custom_upi') || 'emeraldheights@upi'
  );
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [customUpiInput, setCustomUpiInput] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);

  const upiDeepLink = `upi://pay?pa=${societyUpiId}&pn=${encodeURIComponent(
    user?.societyId?.name || 'Emerald Heights Residency'
  )}&am=${currentBillAmount}&cu=INR&tn=${encodeURIComponent(
    `Flat ${flatInfo.flatNumber} ${currentBillMonth} Maintenance`
  )}`;

  // Fetch payment status, bills & society upi id
  const fetchPaymentStatus = async () => {
    try {
      const [paymentsRes, billsRes] = await Promise.all([
        api.get('/payments/my-payments'),
        api.get('/bills/my-bills'),
      ]);

      if (paymentsRes.data?.data) {
        setPaymentData(paymentsRes.data.data);
        if (paymentsRes.data.data.societyUpiId && !localStorage.getItem('sociohub_custom_upi')) {
          setSocietyUpiId(paymentsRes.data.data.societyUpiId);
        }
      }

      if (billsRes.data?.data) {
        setAllBills(billsRes.data.data.bills || []);
        setActiveBill(billsRes.data.data.activeBill || null);
      }
    } catch (err) {
      console.error('Error fetching payments and bills:', err);
    }
  };

  const handleDownloadReceipt = async (paymentId, receiptNumber) => {
    if (!paymentId) return;
    try {
      const res = await api.get(`/payments/${paymentId}/receipt-pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Receipt-${receiptNumber || 'Payment'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Failed to download PDF receipt. Please try again.');
    }
  };

  const handleDownloadInvoice = async (billId, billNumber) => {
    if (!billId) return;
    try {
      const res = await api.get(`/bills/${billId}/invoice-pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Invoice-${billNumber || 'Bill'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Failed to download PDF invoice. Please try again.');
    }
  };

  useEffect(() => {
    fetchPaymentStatus();
    const fetchLiveItems = async () => {
      try {
        const [noticesRes, ticketsRes] = await Promise.all([
          api.get('/notices'),
          api.get('/complaints'),
        ]);
        setLiveNotices(noticesRes.data?.data || []);
        setLiveTickets(ticketsRes.data?.data || []);
      } catch (err) {
        console.error('Error fetching dashboard live items:', err);
      }
    };
    fetchLiveItems();
  }, [user]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(societyUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSaveUpi = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!customUpiInput.trim() || !customUpiInput.includes('@')) {
      alert('Please enter a valid UPI ID (e.g., yourname@okhdfcbank or 9888822222@paytm)');
      return;
    }

    const newUpi = customUpiInput.trim().toLowerCase();
    setSavingUpi(true);
    try {
      await api.patch('/payments/settings/upi', { upiId: newUpi });
    } catch (err) {
      console.warn('Could not save UPI to server, keeping in local session:', err);
    } finally {
      setSavingUpi(false);
      setSocietyUpiId(newUpi);
      localStorage.setItem('sociohub_custom_upi', newUpi);
      setIsEditingUpi(false);
    }
  };

  const handleGeneratePass = (e) => {
    e.preventDefault();
    const pin = Math.floor(100000 + Math.random() * 900000);
    setGeneratedPass({
      guestName,
      pin,
      validUntil: 'Today, 11:59 PM',
      flatNumber: flatInfo.flatNumber,
      wing: buildingInfo.name,
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);

    try {
      if (paymentTab === 'UPI' && !upiRef.trim()) {
        alert('Please enter your 12-digit UPI UTR or Reference Number.');
        setPaymentLoading(false);
        return;
      }

      const res = await api.post('/payments/submit', {
        paymentMethod: paymentTab,
        transactionRef: paymentTab === 'UPI' ? upiRef : 'CASH-OFFICE',
        amount: currentBillAmount,
        month: currentBillMonth,
        billId: activeBill?._id,
      });

      alert(res.data?.message || 'Payment submitted!');
      setActiveModal(null);
      setUpiRef('');
      fetchPaymentStatus();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment submission failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-5 sm:p-8 border border-slate-800/80 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Resident Portal Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome home, {user?.name || 'Piyush Sharma'}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 mt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                <Building className="w-4 h-4" />
                Flat {flatInfo.flatNumber} • {buildingInfo.name}
              </span>
              <span>•</span>
              <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                {user?.residentType || 'Owner'}
              </span>
              <span>•</span>
              <span className="text-slate-400 truncate max-w-[200px] sm:max-w-none">
                {user?.societyId?.name || 'Emerald Heights Residency'}
              </span>
            </div>
          </div>

          {/* Dues Status Card in Welcome Header */}
          <div className="flex items-center gap-3">
            <div className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-950/90 border border-slate-800 sm:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {currentBillMonth} Maintenance
              </p>

              {isBillPaid ? (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Paid & Verified</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {activeBill?.paymentId?.receiptNumber || paymentData.currentMonthPayment?.receiptNumber || 'Receipt Verified'}
                  </p>
                </div>
              ) : isBillPendingCash ? (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Cash Pending Verification</span>
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Deposit ₹{currentBillAmount.toLocaleString('en-IN')} at Office
                  </p>
                </div>
              ) : (
                <div className="mt-1">
                  <p className="text-xl font-extrabold text-amber-400">
                    ₹{currentBillAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isBillOverdue ? `Overdue (${formattedDueDate})` : `Due ${formattedDueDate}`}
                    {activeBill?.utilityCharges > 0 && ` • +₹${activeBill.utilityCharges} util`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Visitor Gate Arrival Alert Banner */}
      {incomingVisitor && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 p-5 border-2 border-cyan-500 shadow-[0_0_35px_rgba(6,182,212,0.3)] animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Live Gate Arrival
                  </span>
                  <span className="text-xs text-slate-400">Flat {flatInfo.flatNumber}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {incomingVisitor.visitorName} is at Gate 1
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Purpose: <span className="text-cyan-300 font-medium">{incomingVisitor.purpose}</span> • Phone: <span className="text-slate-300">{incomingVisitor.phone}</span>
                  {incomingVisitor.vehicleNumber && ` • Vehicle: ${incomingVisitor.vehicleNumber}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                disabled={respondingVisitor}
                onClick={async () => {
                  try {
                    setRespondingVisitor(true);
                    await respondToArrival(incomingVisitor.visitorId, 'APPROVE');
                  } finally {
                    setRespondingVisitor(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Entry</span>
              </button>
              <button
                disabled={respondingVisitor}
                onClick={async () => {
                  try {
                    setRespondingVisitor(true);
                    await respondToArrival(incomingVisitor.visitorId, 'REJECT', 'Resident denied entry from dashboard.');
                  } finally {
                    setRespondingVisitor(false);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Deny</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Interactive Glowing Action Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
            Quick Resident Actions
          </h2>
          <span className="text-xs text-slate-500">1-click instant workflows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Invite Guest (Cyan Glow) */}
          <button
            onClick={() => navigate('/resident/visitors')}
            className="text-left glass-card p-5 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-glow-cyan transition-all duration-300 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                Gate Pass
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
              Invite Guest
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Generate instant 6-digit entry PIN & WhatsApp pass
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-400">
              <span>Create Pass</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Action 2: Pay Maintenance (Emerald Glow) */}
          <button
            onClick={() => setActiveModal('PAYMENT')}
            className={`text-left glass-card p-5 border transition-all duration-300 group relative overflow-hidden ${isBillPaid
                ? 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-glow-emerald'
                : isBillPendingCash
                  ? 'border-amber-500/40 hover:border-amber-400 hover:shadow-glow-amber'
                  : isBillOverdue
                    ? 'border-rose-500/50 hover:border-rose-400 hover:shadow-glow-rose'
                    : 'border-emerald-500/30 hover:border-emerald-400 hover:shadow-glow-emerald'
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isBillPaid
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                    : isBillPendingCash
                      ? 'bg-amber-950 text-amber-400 border border-amber-700'
                      : isBillOverdue
                        ? 'bg-rose-950 text-rose-400 border border-rose-700 animate-pulse'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  }`}
              >
                {isBillPaid ? 'Paid' : isBillPendingCash ? 'Verifying' : isBillOverdue ? 'Overdue' : 'Dues'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
              {isBillPaid ? 'Maintenance Receipt' : 'Pay Maintenance'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isBillPaid
                ? `Receipt ${activeBill?.paymentId?.receiptNumber || paymentData.currentMonthPayment?.receiptNumber || 'Verified'}`
                : isBillPendingCash
                  ? 'Awaiting cash receipt verification'
                  : `₹${currentBillAmount.toLocaleString('en-IN')} due • Due ${formattedDueDate}`}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <span>{isBillPaid ? 'View Receipt' : 'Pay via UPI / Cash'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Action 3: Raise Ticket (Fuchsia Glow) */}
          <button
            onClick={() => navigate('/resident/helpdesk')}
            className="text-left glass-card p-5 border border-fuchsia-500/30 hover:border-fuchsia-400 hover:shadow-glow-fuchsia transition-all duration-300 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-950/60 border border-fuchsia-800/60 flex items-center justify-center text-fuchsia-400 group-hover:scale-110 transition-transform">
                <MessageSquareWarning className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-800/60">
                Helpdesk
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-fuchsia-400 transition-colors">
              Raise Ticket
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Plumbing, electric or common amenity issues
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-fuchsia-400">
              <span>Report Issue</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Action 4: Book Facility (Indigo Glow) */}
          <button
            onClick={() => navigate('/resident/amenities')}
            className="text-left glass-card p-5 border border-indigo-500/30 hover:border-indigo-400 hover:shadow-glow-indigo transition-all duration-300 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                Amenities
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
              Book Facility
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Reserve clubhouse, tennis court or pool slot
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-400">
              <span>Check Slots</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Two Column Content: Left (Passes & Utilities) | Right (Announcements & Contacts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Passes & Flat Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Guest Passes Snippet */}
          <div className="glass-card p-5 sm:p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Active Guest Passes & Deliveries</h3>
                <p className="text-xs text-slate-400">Pre-approved visitors authorized for gate entry</p>
              </div>
              <span className="badge-cyan">2 Active</span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-800/50 flex items-center justify-center text-cyan-400 font-bold text-sm shrink-0">
                    PK
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Pradeep Kulkarni (Guest)</h4>
                    <p className="text-xs text-slate-400">Valid today until 10:00 PM • Main Gate 1</p>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start">
                  <div className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono font-bold text-xs tracking-wider">
                    PIN: 849201
                  </div>
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Approved</span>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-800/50 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                    BL
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Blinkit Delivery Executive</h4>
                    <p className="text-xs text-slate-400">Grocery delivery arriving in 15 mins</p>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start">
                  <div className="px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-700 text-amber-300 font-mono font-bold text-xs tracking-wider">
                    PIN: 391820
                  </div>
                  <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Expected</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Flat Specs & Utility Card */}
          <div className="glass-card p-5 sm:p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4">Apartment & Utility Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                  <Building className="w-4 h-4" />
                  <span className="font-semibold">Unit Spec</span>
                </div>
                <p className="text-white font-bold">{flatInfo.type || '3BHK'}</p>
                <p className="text-slate-400 text-[11px]">Floor {flatInfo.floor || 1}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Car className="w-4 h-4" />
                  <span className="font-semibold">Parking</span>
                </div>
                <p className="text-white font-bold">Slot P-A01</p>
                <p className="text-slate-400 text-[11px]">Basement Level 1</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-fuchsia-400 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold">Electricity</span>
                </div>
                <p className="text-white font-bold">MSEDCL #88219</p>
                <p className="text-slate-400 text-[11px]">Normal Load</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 mb-1">
                  <Droplets className="w-4 h-4" />
                  <span className="font-semibold">Water Supply</span>
                </div>
                <p className="text-white font-bold">24/7 Treated</p>
                <p className="text-slate-400 text-[11px]">Pressure: Optimal</p>
              </div>
            </div>
          </div>

          {/* Maintenance Invoices & Statement */}
          <div className="glass-card p-5 sm:p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Maintenance Invoices & Statement</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Monthly billing ledger and payment receipts for Flat {flatInfo.flatNumber}
                </p>
              </div>
              <button
                onClick={() => setActiveModal('PAYMENT')}
                className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow-emerald transition-all"
              >
                {isBillPaid ? 'View Receipt' : 'Pay Dues'}
              </button>
            </div>

            {allBills.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No maintenance bills generated yet.</p>
            ) : (
              <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden">
                {allBills.slice(0, 4).map((b) => (
                  <div key={b._id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{b.month}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'PAID'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : b.status === 'OVERDUE'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Due: {new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {b.utilityCharges > 0 && ` • Includes ₹${b.utilityCharges} utilities`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-white text-sm">
                        ₹{b.totalAmount.toLocaleString('en-IN')}
                      </span>
                      {b.status !== 'PAID' && b.status !== 'PENDING_VERIFICATION' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBill(b);
                            setActiveModal('PAYMENT');
                          }}
                          className="py-1 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] inline-flex items-center gap-1 shadow-glow-emerald transition-all"
                        >
                          <span>Pay Now</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(b._id, b.billNumber)}
                        className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white font-medium text-[11px] inline-flex items-center gap-1 transition-colors border border-slate-700"
                        title="Download Invoice PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Notices & Emergency Contacts */}
        <div className="space-y-6">
          {/* Society Notice Board Snippet */}
          <div className="glass-card p-5 sm:p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>Notice Board</span>
              </h3>
              <Link
                to="/resident/notices"
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>View Feed</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {liveNotices.length > 0 ? (
                liveNotices.slice(0, 2).map((n) => (
                  <div key={n._id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${n.priority === 'URGENT'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          }`}
                      >
                        {n.category}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{n.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{n.content}</p>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="badge-cyan">Maintenance</span>
                    <span className="text-[10px] text-slate-500">Notice</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">No Active Circulars</h4>
                  <p className="text-[11px] text-slate-400">All current society advisories will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Emergency Contacts */}
          <div className="glass-card p-5 sm:p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-3">Society Help & Contacts</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">Security Gate 1 (Ramesh)</span>
                </div>
                <span className="font-mono text-cyan-400 font-bold">+91 99111 00011</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">Admin (Piyush Kumar)</span>
                </div>
                <span className="font-mono text-cyan-400 font-bold">+91 98220 99999</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">Duty Electrician (Suresh)</span>
                </div>
                <span className="font-mono text-cyan-400 font-bold">+91 98220 11223</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Maintenance Payment (UPI + Cash Workflows) */}
      <Modal
        isOpen={activeModal === 'PAYMENT'}
        onClose={() => setActiveModal(null)}
        title={`${currentBillMonth} Maintenance Payment`}
        maxWidth="max-w-lg"
      >
        {isBillPaid ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center shadow-glow-emerald">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Maintenance Already Paid!</h3>
            <p className="text-xs text-slate-400">
              Your {currentBillMonth} dues of ₹{currentBillAmount.toLocaleString('en-IN')} have been verified and settled.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Official Receipt #:</span>
                <span className="font-mono font-bold text-cyan-400">
                  {paymentData.currentMonthPayment?.receiptNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="font-semibold text-white">
                  {paymentData.currentMonthPayment?.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Settled:</span>
                <span className="font-bold text-emerald-400">
                  ₹{currentBillAmount.toLocaleString('en-IN')}
                </span>
              </div>
              {paymentData.currentMonthPayment?.transactionRef && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Ref / UTR:</span>
                  <span className="font-mono text-slate-300">
                    {paymentData.currentMonthPayment.transactionRef}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() =>
                  handleDownloadReceipt(
                    paymentData.currentMonthPayment?._id,
                    paymentData.currentMonthPayment?.receiptNumber
                  )
                }
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold shadow-glow-emerald flex items-center justify-center gap-2 transition-all"
              >
                <FileDown className="w-4 h-4" />
                <span>Download Official PDF Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : isBillPendingCash ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-400 mx-auto flex items-center justify-center shadow-glow-amber">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Cash Verification Pending</h3>
            <p className="text-xs text-slate-300">
              You have requested to pay ₹{currentBillAmount.toLocaleString('en-IN')} in <b>Cash</b> at the Society Office.
            </p>
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 text-left">
              <p className="font-semibold mb-1">Next Step:</p>
              <p className="text-[11px] text-slate-300">
                Please visit the Society Office desk and deposit ₹{currentBillAmount.toLocaleString('en-IN')} with Admin <b>Piyush Kumar</b>. Once he confirms the cash collection on his dashboard, your receipt will be issued immediately.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Understood
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Amount Summary Banner */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400">Maintenance Dues ({currentBillMonth})</p>
                  {activeBill && (
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(activeBill._id, activeBill.billNumber)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-semibold"
                    >
                      <FileDown className="w-3 h-3" />
                      <span>PDF Bill</span>
                    </button>
                  )}
                </div>
                <p className="text-xl font-black text-emerald-400">
                  ₹{currentBillAmount.toLocaleString('en-IN')}
                </p>
                {activeBill?.utilityCharges > 0 && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    (Base: ₹{activeBill.baseAmount} + Utilities: ₹{activeBill.utilityCharges})
                  </p>
                )}
              </div>
              <span className={isBillOverdue ? 'badge-rose' : 'badge-amber'}>
                {isBillOverdue ? `Overdue (${formattedDueDate})` : `Due ${formattedDueDate}`}
              </span>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentTab('UPI')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${paymentTab === 'UPI'
                    ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Pay via UPI / QR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('CASH')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${paymentTab === 'CASH'
                    ? 'bg-amber-500 text-slate-950 shadow-glow-amber'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Pay in Cash</span>
              </button>
            </div>

            {/* TAB 1: UPI PAYMENT FLOW */}
            {paymentTab === 'UPI' && (
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30">
                  {/* Dynamic UPI QR Code (Crisp Vector SVG) */}
                  <div className="p-3 bg-white rounded-2xl shadow-lg shrink-0 flex items-center justify-center">
                    <QRCodeSVG
                      value={upiDeepLink}
                      size={135}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">Scan with any UPI App:</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomUpiInput(societyUpiId);
                          setIsEditingUpi(!isEditingUpi);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>{isEditingUpi ? 'Cancel' : 'Set My UPI ID'}</span>
                      </button>
                    </div>

                    {isEditingUpi ? (
                      <div className="p-3 rounded-xl bg-slate-900/95 border border-cyan-500/50 space-y-2 animate-fadeIn text-left">
                        <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                          Enter Your UPI ID
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. yourname@okhdfcbank"
                            value={customUpiInput}
                            onChange={(e) => setCustomUpiInput(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                            autoFocus
                          />
                          <button
                            type="button"
                            disabled={savingUpi}
                            onClick={handleSaveUpi}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                          >
                            {savingUpi ? 'Saving...' : 'Generate QR'}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Instantly updates this QR code so payments go directly to your account.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-white">
                          Google Pay • PhonePe • Paytm • BHIM
                        </p>

                        {/* UPI ID copy pill */}
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <span className="font-mono text-cyan-300 font-bold">{societyUpiId}</span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="p-1 hover:text-cyan-400 text-slate-400 transition-colors"
                            title="Copy UPI ID"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Mobile App Deep-link Intent */}
                        <div className="pt-1">
                          <a
                            href={upiDeepLink}
                            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-semibold"
                          >
                            <span>Open directly in UPI App</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 12-digit UTR Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enter 12-Digit UPI Transaction UTR / Ref ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 428192019482"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    className="w-full glass-input text-sm font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Found in your UPI app payment receipt after successful transfer.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-glow-cyan disabled:opacity-50"
                  >
                    {paymentLoading ? 'Verifying...' : 'Submit & Generate Receipt'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CASH PAYMENT FLOW */}
            {paymentTab === 'CASH' && (
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Banknote className="w-4 h-4" />
                    <span>Pay in Cash at Society Office Desk</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    By submitting this option, your maintenance record will be queued as{' '}
                    <span className="text-amber-300 font-semibold">Pending Cash Verification</span>.
                  </p>
                  <p className="text-slate-400">
                    • <b>Amount to deposit:</b> ₹{maintenanceAmt.toLocaleString('en-IN')}<br />
                    • <b>Desk Location:</b> Ground Floor Office, Club Building<br />
                    • <b>Manager in Charge:</b> Piyush Kumar (Admin)
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Only the Society Admin has the administrative permission to accept cash and verify the transaction.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-glow-amber disabled:opacity-50"
                  >
                    {paymentLoading ? 'Submitting...' : `Request Cash Payment (₹${currentBillAmount.toLocaleString('en-IN')})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Invite Guest (Interactive Pass Generator) */}
      <Modal
        isOpen={activeModal === 'GUEST'}
        onClose={() => setActiveModal(null)}
        title="Create Guest / Visitor Pass"
      >
        {!generatedPass ? (
          <form onSubmit={handleGeneratePass} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Guest Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Verma"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Guest Phone (For WhatsApp Pass)
              </label>
              <input
                type="tel"
                placeholder="+91 98900 11223"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full glass-input text-sm"
              />
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Your guest can show the generated 6-digit PIN or QR code at Gate 1 for zero-wait automatic entry.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-glow-cyan"
              >
                Generate 6-Digit Pass
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/50 shadow-glow-cyan">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-700 text-cyan-400 mb-2">
                <QrCode className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400">Entry Verification Code</p>
              <p className="text-3xl font-black text-cyan-300 font-mono tracking-widest my-2">
                {generatedPass.pin}
              </p>
              <p className="text-xs font-bold text-white">{generatedPass.guestName}</p>
              <p className="text-[11px] text-slate-400">
                Destination: Flat {generatedPass.flatNumber}, {generatedPass.wing}
              </p>
              <p className="text-[10px] text-emerald-400 mt-2 font-medium">
                Valid until {generatedPass.validUntil}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Namaste ${generatedPass.guestName}, here is your SocioHub entry pass for Flat ${generatedPass.flatNumber} (${generatedPass.wing}), Emerald Heights Residency: PIN is ${generatedPass.pin}.`
                  );
                  alert('WhatsApp pass message copied to clipboard!');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Pass</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Raise Ticket Placeholder */}
      <Modal
        isOpen={activeModal === 'TICKET'}
        onClose={() => setActiveModal(null)}
        title="Raise Service Request / Complaint"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            The multi-stage Helpdesk lifecycle (Pending → Assigned → In-Progress → Resolved) with photo uploads and technician dispatch will be activated in <b>Phase 2</b>!
          </p>
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Book Facility Placeholder */}
      <Modal
        isOpen={activeModal === 'BOOKING'}
        onClose={() => setActiveModal(null)}
        title="Reserve Society Amenities"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Double-booking-free time slot reservation for Clubhouse, Tennis Court, and Swimming Pool is coming in <b>Phase 3</b>!
          </p>
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
