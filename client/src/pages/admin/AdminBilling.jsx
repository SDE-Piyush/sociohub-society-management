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
} from 'lucide-react';
import api from '../../api/axios';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';

export const AdminBilling = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalCollected: 0, pendingCashCount: 0, pendingCashAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING_CASH_VERIFICATION' | 'COMPLETED'
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments');
      setPayments(res.data?.data?.payments || []);
      setStats(res.data?.data?.stats || { totalCollected: 0, pendingCashCount: 0, pendingCashAmount: 0 });
    } catch (err) {
      console.error('Error fetching payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const [confirmModal, setConfirmModal] = useState(null); // { id, residentName, flatNumber, amount }
  const [successMessage, setSuccessMessage] = useState('');

  const executeVerifyCash = async () => {
    if (!confirmModal) return;
    try {
      setActionLoadingId(confirmModal.id);
      const res = await api.put(`/payments/${confirmModal.id}/verify-cash`);
      setSuccessMessage(res.data?.message || 'Cash payment verified successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      setConfirmModal(null);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error verifying cash payment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCashList = payments.filter(
    (p) => p.status === 'PENDING_CASH_VERIFICATION'
  );

  const filteredPayments = payments.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (!search) return true;
    const nameMatch = p.userId?.name?.toLowerCase().includes(search.toLowerCase());
    const flatMatch = p.flatId?.flatNumber?.includes(search);
    const receiptMatch = p.receiptNumber?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || flatMatch || receiptMatch;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Maintenance & Payments Desk
            </h1>
            <span className="badge-emerald">Billing Management</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track UPI dues and exclusively verify physical cash payments collected at the society office.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-glow-emerald animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Maintenance Collected"
          value={`₹${stats.totalCollected.toLocaleString('en-IN')}`}
          subtitle="All verified UPI & cash payments"
          icon={CreditCard}
          accentColor="emerald"
        />
        <StatCard
          title="Pending Cash Verifications"
          value={stats.pendingCashCount}
          subtitle={`₹${stats.pendingCashAmount.toLocaleString('en-IN')} to be collected`}
          icon={Banknote}
          accentColor="amber"
          trend={{
            label: 'Action required',
            value: stats.pendingCashCount > 0 ? 'Review below' : 'All cleared',
            isPositive: stats.pendingCashCount === 0,
          }}
        />
        <StatCard
          title="Society UPI Receiving Account"
          value="piyush09@ptaxis"
          subtitle="NPCI UPI / QR receiving handle"
          icon={QrCode}
          accentColor="cyan"
        />
      </div>

      {/* Actionable Section: Pending Cash Verification Requests */}
      {pendingCashList.length > 0 && (
        <div className="glass-card p-5 sm:p-6 border border-amber-500/30 bg-amber-950/10 shadow-glow-amber">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-400">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Cash Verification Requests Awaiting Admin Action
                </h2>
                <p className="text-xs text-slate-400">
                  Residents who opted to pay at the society office. Verify cash received to issue official receipt.
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
                    onClick={() =>
                      setConfirmModal({
                        id: item._id,
                        residentName: item.userId?.name,
                        flatNumber: item.flatId?.flatNumber,
                        amount: item.amount,
                      })
                    }
                    className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-glow-emerald transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Mark as Received</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Transactions Log */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Maintenance Transactions History
            </h2>
            <p className="text-xs text-slate-400">
              Complete society audit trail of UPI and verified cash payments
            </p>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search flat, resident, receipt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 glass-input text-xs w-48 sm:w-60"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'PENDING_CASH_VERIFICATION', label: 'Pending Cash' },
                { id: 'COMPLETED', label: 'Verified / Paid' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilterStatus(t.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterStatus === t.id
                      ? 'bg-slate-800 text-cyan-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Receipt #</th>
                  <th className="px-5 py-3.5">Flat & Resident</th>
                  <th className="px-5 py-3.5">Month</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Payment Mode</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayments.map((p) => {
                  const isCompleted = p.status === 'COMPLETED';
                  const isCash = p.paymentMethod === 'CASH';

                  return (
                    <tr key={p._id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-cyan-400 font-bold">
                        {p.receiptNumber || 'Pending'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">
                          {p.userId?.name || 'Resident'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Flat {p.flatId?.flatNumber} • {p.buildingId?.name}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-medium">
                        {p.month}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-white">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {isCash ? (
                            <Banknote className="w-4 h-4 text-amber-400" />
                          ) : (
                            <QrCode className="w-4 h-4 text-cyan-400" />
                          )}
                          <span className={isCash ? 'text-amber-400' : 'text-cyan-400'}>
                            {p.paymentMethod}
                          </span>
                        </div>
                        {p.transactionRef && (
                          <p className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                            {p.transactionRef}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {isCompleted ? (
                          <span className="badge-emerald">Verified & Paid</span>
                        ) : (
                          <span className="badge-amber">Awaiting Cash</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isCompleted ? (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{p.verifiedBy?.name ? `By ${p.verifiedBy.name}` : 'Auto UPI'}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmModal({
                                id: p._id,
                                residentName: p.userId?.name,
                                flatNumber: p.flatId?.flatNumber,
                                amount: p.amount,
                              })
                            }
                            className="text-xs text-emerald-400 hover:underline font-bold"
                          >
                            Verify Cash →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                      No maintenance transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Cash Receipt */}
      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title="Confirm Cash Collection"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Resident:</span>
              <span className="font-bold text-white">{confirmModal?.residentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Flat:</span>
              <span className="font-bold text-cyan-400">Flat {confirmModal?.flatNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cash Amount Collected:</span>
              <span className="font-extrabold text-emerald-400 text-sm">
                ₹{confirmModal?.amount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            By confirming, you certify that ₹{confirmModal?.amount?.toLocaleString('en-IN')} has been physically received at the office desk. An official society receipt number will be issued to the resident immediately.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmModal(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeVerifyCash}
              disabled={actionLoadingId === confirmModal?.id}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-glow-emerald flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionLoadingId === confirmModal?.id ? 'Processing...' : 'Confirm Cash Received'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
