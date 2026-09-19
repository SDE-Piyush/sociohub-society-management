import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  QrCode,
  Search,
  Building,
  AlertCircle,
  FileCheck,
  Plus,
  FileDown,
  Layers,
  Calendar,
  Zap,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import api from '../../api/axios';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';

export const AdminBilling = () => {
  const [activeTab, setActiveTab] = useState('BILLS'); // 'BILLS' | 'PAYMENTS'
  const [payments, setPayments] = useState([]);
  const [bills, setBills] = useState([]);
  const [paymentStats, setPaymentStats] = useState({ totalCollected: 0, pendingCashCount: 0, pendingCashAmount: 0 });
  const [billStats, setBillStats] = useState({ totalBilled: 0, totalPaid: 0, unpaidCount: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Filters
  const [billFilterStatus, setBillFilterStatus] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID' | 'OVERDUE'
  const [paymentFilterStatus, setPaymentFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING_CASH_VERIFICATION' | 'COMPLETED'
  const [search, setSearch] = useState('');

  // Modals
  const [confirmModal, setConfirmModal] = useState(null); // { id, residentName, flatNumber, amount }
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Batch Generator states
  const MONTHS_LIST = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const YEARS_LIST = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays) d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedMonth, setSelectedMonth] = useState('September');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [billType, setBillType] = useState('UTILITY_ONLY'); // 'FULL' | 'UTILITY_ONLY'
  const [utilityCharges, setUtilityCharges] = useState(250);
  const [dueDate, setDueDate] = useState(() => getLocalDateString(0));
  const [overwriteExisting, setOverwriteExisting] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, billsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/bills'),
      ]);
      setPayments(paymentsRes.data?.data?.payments || []);
      setPaymentStats(paymentsRes.data?.data?.stats || { totalCollected: 0, pendingCashCount: 0, pendingCashAmount: 0 });
      setBills(billsRes.data?.data?.bills || []);
      setBillStats(billsRes.data?.data?.stats || { totalBilled: 0, totalPaid: 0, unpaidCount: 0, overdueCount: 0 });
    } catch (err) {
      console.error('Error fetching billing data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Verify cash payment
  const executeVerifyCash = async () => {
    if (!confirmModal) return;
    try {
      setActionLoadingId(confirmModal.id);
      const res = await api.put(`/payments/${confirmModal.id}/verify-cash`);
      setSuccessMessage(res.data?.message || 'Cash payment verified successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      setConfirmModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error verifying cash payment');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Generate batch bills
  const handleGenerateBatch = async (e) => {
    e.preventDefault();
    try {
      setBatchLoading(true);
      const combinedMonth = `${selectedMonth} ${selectedYear}`;
      const payload = {
        month: combinedMonth,
        year: Number(selectedYear),
        dueDate,
        utilityCharges: Number(utilityCharges) || 0,
        billType,
        overwriteExisting,
      };
      const res = await api.post('/bills/generate-batch', payload);
      setSuccessMessage(res.data?.message || 'Batch bills generated successfully!');
      setTimeout(() => setSuccessMessage(''), 6000);
      setIsBatchModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating batch bills');
    } finally {
      setBatchLoading(false);
    }
  };

  // Delete an individual maintenance invoice
  const handleDeleteBill = async (billId, billNum) => {
    if (!window.confirm(`Are you sure you want to delete maintenance invoice ${billNum}?`)) return;
    try {
      setActionLoadingId(billId);
      const res = await api.delete(`/bills/${billId}`);
      setSuccessMessage(res.data?.message || 'Invoice deleted successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting invoice');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Purge any orphan unpaid bills for empty/unallotted flats
  const handleCleanupVacant = async () => {
    if (!window.confirm('Clean up and remove all unpaid maintenance invoices generated for empty/unallotted flats?')) return;
    try {
      setLoading(true);
      const res = await api.post('/bills/cleanup-vacant');
      setSuccessMessage(res.data?.message || 'Empty flat invoices cleaned up successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cleaning up empty flat invoices');
    } finally {
      setLoading(false);
    }
  };

  // Safe PDF download utility
  const handleDownloadPdf = async (url, filename, id) => {
    try {
      setDownloadingId(id);
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Failed to download PDF document. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const pendingCashList = payments.filter(
    (p) => p.status === 'PENDING_CASH_VERIFICATION'
  );

  const filteredPayments = payments.filter((p) => {
    if (paymentFilterStatus !== 'ALL' && p.status !== paymentFilterStatus) return false;
    if (!search) return true;
    const nameMatch = p.userId?.name?.toLowerCase().includes(search.toLowerCase());
    const flatMatch = p.flatId?.flatNumber?.includes(search);
    const receiptMatch = p.receiptNumber?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || flatMatch || receiptMatch;
  });

  const filteredBills = bills.filter((b) => {
    if (billFilterStatus !== 'ALL' && b.status !== billFilterStatus) return false;
    if (!search) return true;
    const flatMatch = b.flatId?.flatNumber?.includes(search);
    const billNumMatch = b.billNumber?.toLowerCase().includes(search.toLowerCase());
    const monthMatch = b.month?.toLowerCase().includes(search.toLowerCase());
    return flatMatch || billNumMatch || monthMatch;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Maintenance & Financial Desk
            </h1>
            <span className="badge-emerald">Phase 3 Financial Engine</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Batch bill generation, UPI & online reconciliation, cash desk verification, and branded PDF invoices.
          </p>
        </div>

        <button
          onClick={() => setIsBatchModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Zap className="w-4 h-4" />
          <span>1-Click Batch Bill Generator</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-glow-emerald animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Maintenance Collected"
          value={`₹${paymentStats.totalCollected.toLocaleString('en-IN')}`}
          subtitle="All verified UPI & cash"
          icon={CreditCard}
          accentColor="emerald"
        />
        <StatCard
          title="Total Invoiced Amount"
          value={`₹${billStats.totalBilled.toLocaleString('en-IN')}`}
          subtitle={`${bills.length} flat invoices`}
          icon={Layers}
          accentColor="cyan"
        />
        <StatCard
          title="Pending Cash Desk Dues"
          value={paymentStats.pendingCashCount}
          subtitle={`₹${paymentStats.pendingCashAmount.toLocaleString('en-IN')} cash at office`}
          icon={Banknote}
          accentColor="amber"
          trend={{
            label: 'Office desk',
            value: paymentStats.pendingCashCount > 0 ? 'Review now' : 'All cleared',
            isPositive: paymentStats.pendingCashCount === 0,
          }}
        />
        <StatCard
          title="Overdue Invoices"
          value={billStats.overdueCount}
          subtitle="Pending post due date"
          icon={AlertCircle}
          accentColor="rose"
        />
      </div>

      {/* Pending Cash Verification Alert Box */}
      {pendingCashList.length > 0 && (
        <div className="glass-card p-5 sm:p-6 border border-amber-500/30 bg-amber-950/10 shadow-glow-amber">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-400">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Cash Verification Requests Awaiting Admin Action ({pendingCashList.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Verify physical cash received at the society office to issue official PDF receipts.
                </p>
              </div>
            </div>
            <span className="badge-amber">{pendingCashList.length} Pending</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingCashList.map((item) => (
              <div
                key={item._id}
                className="p-4 rounded-xl bg-slate-900/90 border border-amber-800/40 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {item.userId?.name || 'Resident'}
                      </span>
                      <span className="badge-cyan">
                        Flat {item.flatId?.flatNumber || ''} ({item.buildingId?.name || 'Wing A'})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Phone: {item.userId?.phone || '—'}
                    </p>
                    <p className="text-xs text-amber-400 font-semibold mt-1">
                      Maintenance for {item.month}: ₹{item.amount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 italic">
                    Cash at Office
                  </span>
                  <button
                    disabled={actionLoadingId === item._id}
                    onClick={() =>
                      setConfirmModal({
                        id: item._id,
                        residentName: item.userId?.name,
                        flatNumber: item.flatId?.flatNumber,
                        amount: item.amount,
                      })
                    }
                    className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-glow-emerald transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{actionLoadingId === item._id ? 'Verifying...' : 'Verify & Mark as Received'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('BILLS')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'BILLS'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Maintenance Bills & Invoices ({bills.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'PAYMENTS'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Payment Receipts & Ledger ({payments.length})
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search flat number, resident, invoice #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 glass-input text-xs w-full sm:w-64"
          />
        </div>
      </div>

      {/* TAB 1: Bills & Invoices */}
      {activeTab === 'BILLS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-slate-400">
                Monthly maintenance invoices issued only to allotted & occupied flats.
              </p>
              {billStats.allottedFlats !== undefined && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-semibold">
                  {billStats.allottedFlats} Allotted Flats
                </span>
              )}
              {billStats.vacantFlats > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 font-medium">
                  {billStats.vacantFlats} Empty Flats (Excluded)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
              {['ALL', 'UNPAID', 'PAID', 'OVERDUE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setBillFilterStatus(status)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${billFilterStatus === status
                      ? 'bg-slate-800 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Flat & Resident</th>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4">Base + Utilities</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredBills.map((bill) => {
                    const resident = bill.flatId?.ownerId || bill.flatId?.tenantId;
                    const isOwner = !!bill.flatId?.ownerId;
                    const isTenant = !isOwner && !!bill.flatId?.tenantId;
                    const occupantType = isOwner ? 'Owner' : isTenant ? 'Tenant' : null;
                    return (
                    <tr key={bill._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold">
                        {bill.billNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white block">
                            Flat {bill.flatId?.flatNumber || '—'}
                          </span>
                          {occupantType ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-medium">
                              {occupantType}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              Vacant
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-[11px] block mt-0.5">
                          {bill.buildingId?.name || 'Wing A'}
                          {resident?.name ? ` • ${resident.name}` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {bill.month}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        ₹{bill.baseAmount} + ₹{bill.utilityCharges}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        ₹{bill.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {new Date(bill.dueDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${bill.status === 'PAID'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                              : bill.status === 'OVERDUE'
                                ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                                : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                            }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={downloadingId === bill._id}
                            onClick={() =>
                              handleDownloadPdf(
                                `/bills/${bill._id}/invoice-pdf`,
                                `Invoice-${bill.billNumber}.pdf`,
                                bill._id
                              )
                            }
                            className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                            <span>PDF</span>
                          </button>
                          {bill.status !== 'PAID' && (
                            <button
                              disabled={actionLoadingId === bill._id}
                              onClick={() => handleDeleteBill(bill._id, bill.billNumber)}
                              title="Delete invoice"
                              className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-700/50 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Payment Receipts & Cash Ledger */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Audit log of completed UPI transactions and verified physical cash receipts
            </p>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {['ALL', 'COMPLETED', 'PENDING_CASH_VERIFICATION'].map((status) => (
                <button
                  key={status}
                  onClick={() => setPaymentFilterStatus(status)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${paymentFilterStatus === status
                      ? 'bg-slate-800 text-cyan-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {status === 'ALL' ? 'All' : status === 'COMPLETED' ? 'Completed' : 'Pending Cash'}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Resident & Flat</th>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method & Ref</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date & Verified By</th>
                    <th className="py-3 px-4 text-right">Receipt PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPayments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold">
                        {p.receiptNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">
                          {p.userId?.name || 'Resident'}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Flat {p.flatId?.flatNumber || '—'} ({p.buildingId?.name || 'Wing A'})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {p.month}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{p.paymentMethod}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px] block">
                          {p.transactionRef || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'COMPLETED'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                              : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                            }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block text-slate-300">
                          {new Date(p.createdAt).toLocaleDateString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {p.verifiedBy ? `Admin: ${p.verifiedBy.name}` : 'Digital Auto-Verified'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {p.status === 'COMPLETED' ? (
                          <button
                            disabled={downloadingId === p._id}
                            onClick={() =>
                              handleDownloadPdf(
                                `/payments/${p._id}/receipt-pdf`,
                                `Receipt-${p.receiptNumber}.pdf`,
                                p._id
                              )
                            }
                            className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Receipt</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Unverified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: 1-Click Batch Bill Generator */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="1-Click Batch Maintenance Bill Generator"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleGenerateBatch} className="space-y-4">
          {/* Vacant Flat Protection Banner */}
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-200 font-medium">
                Billing <strong className="text-emerald-300 font-bold">{billStats.allottedFlats ?? 'All'} Allotted Flats</strong> only
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
              {billStats.vacantFlats ?? 0} Empty Flats Excluded
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Invoices are generated only for flats that are allotted to an owner or tenant. Empty/vacant flats are safely excluded to prevent unpayable orphan dues.
          </p>

          {/* Month and Year Dropdowns (Scroll / Select) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Billing Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full glass-input text-xs font-semibold cursor-pointer bg-slate-900 text-white"
              >
                {MONTHS_LIST.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white py-1">
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Billing Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full glass-input text-xs font-semibold cursor-pointer bg-slate-900 text-white"
              >
                {YEARS_LIST.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white py-1">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bill Scope / Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Billing Scope / Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBillType('FULL')}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                  billType === 'FULL'
                    ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-glow-emerald'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${billType === 'FULL' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>Full Maintenance</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Base (₹4,200) + Extra Charges
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBillType('UTILITY_ONLY')}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                  billType === 'UTILITY_ONLY'
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-glow-cyan'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${billType === 'UTILITY_ONLY' ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                  <span>Utility / Ad-hoc Only</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Base ₹0 + Ad-hoc Charge (₹{utilityCharges})
                </p>
              </button>
            </div>
          </div>

          {/* Utility / Sinking Contribution */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Utility / Ad-hoc Charge Amount (₹)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={utilityCharges}
                onChange={(e) => setUtilityCharges(Number(e.target.value))}
                placeholder="250"
                className="w-full glass-input text-xs font-mono font-bold text-white"
              />
              <div className="flex items-center gap-1">
                {[150, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setUtilityCharges(amt)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      utilityCharges === amt
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              {billType === 'UTILITY_ONLY'
                ? `Only ₹${utilityCharges || 0} will be billed to each flat as an ad-hoc charge.`
                : `₹${utilityCharges || 0} will be added on top of each flat's default base monthly maintenance.`}
            </p>
          </div>

          {/* Payment Due Date with Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Payment Due Date</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full glass-input text-xs font-semibold"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setDueDate(getLocalDateString(0))}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-medium border border-slate-700"
              >
                Today ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
              </button>
              <button
                type="button"
                onClick={() => setDueDate(getLocalDateString(3))}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700"
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => setDueDate(getLocalDateString(7))}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700"
              >
                In 7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                  const y = end.getFullYear();
                  const m = String(end.getMonth() + 1).padStart(2, '0');
                  const day = String(end.getDate()).padStart(2, '0');
                  setDueDate(`${y}-${m}-${day}`);
                }}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700"
              >
                End of Month
              </button>
            </div>
          </div>

          {/* Overwrite Existing Toggle */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="overwriteExistingCheckbox"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="overwriteExistingCheckbox" className="text-xs text-slate-300 cursor-pointer select-none">
              <span className="font-semibold text-white block">
                Apply & recalculate for all allotted flats (including flats with settled maintenance)
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Updates {selectedMonth} {selectedYear} bills to ₹{billType === 'UTILITY_ONLY' ? utilityCharges : 4200 + utilityCharges} UNPAID so residents can pay the new charge immediately. Vacant flats will not be billed.
              </span>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={batchLoading}
              className="py-2 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald flex items-center gap-1.5"
            >
              {batchLoading ? 'Generating Bills...' : 'Run Batch Generation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Cash Verification */}
      {confirmModal && (
        <Modal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          title="Verify Cash Payment Deposit"
          maxWidth="max-w-sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Confirm that you have physically collected <strong className="text-emerald-400">₹{confirmModal.amount}</strong> from <strong className="text-white">{confirmModal.residentName}</strong> (Flat {confirmModal.flatNumber}) at the society office?
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>• An official digital receipt will be generated immediately.</p>
              <p>• The flat's maintenance ledger will be marked as PAID.</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="py-2 px-4 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeVerifyCash}
                className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow-emerald"
              >
                Confirm Verification
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
