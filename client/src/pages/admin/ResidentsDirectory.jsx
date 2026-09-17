import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  Check,
  KeyRound,
  X,
  AlertCircle,
  Crown,
} from 'lucide-react';
import api from '../../api/axios';

export const ResidentsDirectory = () => {
  const [residents, setResidents] = useState([]);
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'PENDING' | 'PASSWORDS' | 'OWNER' | 'TENANT'
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=RESIDENT');
      setResidents(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching residents', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPasswordRequests = async () => {
    try {
      const res = await api.get('/auth/password-reset-requests');
      setPasswordRequests(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching password requests', err);
    }
  };

  useEffect(() => {
    fetchResidents();
    fetchPasswordRequests();
  }, []);

  const handleApprove = async (id, name) => {
    try {
      setActionLoadingId(id);
      const res = await api.patch(`/users/${id}/approve`);
      setFeedback(`Approved account for ${name}! Resident can now log in.`);
      setTimeout(() => setFeedback(null), 5000);
      fetchResidents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving resident');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchResidents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing resident');
    }
  };

  const handleApprovePassword = async (requestId, userName) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/auth/password-reset-requests/${requestId}/approve`);
      setFeedback(res.data?.message || `Approved new password for ${userName}!`);
      setTimeout(() => setFeedback(null), 5000);
      fetchPasswordRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving password reset request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectPassword = async (requestId, userName) => {
    if (!confirm(`Are you sure you want to reject the password reset request for ${userName}?`)) return;
    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/auth/password-reset-requests/${requestId}/reject`);
      setFeedback(res.data?.message || `Rejected password reset request for ${userName}.`);
      setTimeout(() => setFeedback(null), 5000);
      fetchPasswordRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Error rejecting password reset request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = residents.filter((r) => r.status === 'PENDING').length;
  const pendingPasswordCount = passwordRequests.filter((r) => r.status === 'PENDING').length;

  const filtered = residents.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.phone && r.phone.includes(search)) ||
      (r.flatId && r.flatId.flatNumber.includes(search));

    if (!matchesSearch) return false;
    if (filterType === 'ALL') return true;
    if (filterType === 'PENDING') return r.status === 'PENDING';
    return r.residentType === filterType;
  });

  const filteredPasswordRequests = passwordRequests.filter((r) => {
    const userName = r.userId?.name || '';
    const userEmail = r.email || '';
    return (
      userName.toLowerCase().includes(search.toLowerCase()) ||
      userEmail.toLowerCase().includes(search.toLowerCase())
    );
  });


  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Residents Directory & Approvals</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive member registry of apartment owners, tenants, and pending account approvals.
          </p>
        </div>

        <Link
          to="/admin/staff"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/60 transition-all shadow-glow-cyan"
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Manage Security & Staff</span>
        </Link>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {feedback}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by resident name, flat number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 glass-input text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            All Residents ({residents.length})
          </button>

          <button
            onClick={() => setFilterType('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              filterType === 'PENDING'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Approvals</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-extrabold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterType('PASSWORDS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              filterType === 'PASSWORDS'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Password Requests</span>
            {pendingPasswordCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500 text-slate-950 font-extrabold">
                {pendingPasswordCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterType('OWNER')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === 'OWNER'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            Owners
          </button>

          <button
            onClick={() => setFilterType('TENANT')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === 'TENANT'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            Tenants
          </button>
        </div>
      </div>

      {/* Conditional Table: Password Reset Requests vs Residents Directory */}
      {filterType === 'PASSWORDS' ? (
        <div className="glass-card border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Password Reset Verification Queue
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Users cannot log in with their requested password until approved here.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">User & Account</th>
                  <th className="px-6 py-3.5">Role / Unit</th>
                  <th className="px-6 py-3.5">Requested At</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPasswordRequests.map((req) => {
                  const userName = req.userId?.name || 'User Account';
                  const userRole = req.userId?.role || 'USER';
                  const isPending = req.status === 'PENDING';

                  return (
                    <tr
                      key={req._id}
                      className={`hover:bg-slate-850/50 transition-colors ${
                        isPending ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center font-bold text-white uppercase text-xs shrink-0">
                            {userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{userName}</p>
                            <p className="text-[11px] text-slate-400">{req.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              userRole === 'SECURITY'
                                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                                : userRole === 'SOCIETY_ADMIN'
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            }`}
                          >
                            {userRole.replace('_', ' ')}
                          </span>
                          {req.userId?.flatId && (
                            <p className="text-[11px] text-slate-400">
                              Flat {req.userId.flatId.flatNumber} ({req.userId.buildingId?.name || 'Building'})
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {new Date(req.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="px-6 py-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800/60 font-bold text-[10px]">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>PENDING ADMIN APPROVAL</span>
                          </span>
                        ) : req.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60 font-semibold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>APPROVED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800/60 font-semibold text-[10px]">
                            <X className="w-3 h-3" />
                            <span>REJECTED</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={actionLoadingId === req._id}
                              onClick={() => handleApprovePassword(req._id, userName)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-glow-emerald flex items-center gap-1 transition-all disabled:opacity-50"
                            >
                              {actionLoadingId === req._id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve New Password</span>
                                </>
                              )}
                            </button>

                            <button
                              disabled={actionLoadingId === req._id}
                              onClick={() => handleRejectPassword(req._id, userName)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors disabled:opacity-50"
                              title="Reject Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Reviewed by {req.reviewedBy?.name || 'Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredPasswordRequests.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No password reset requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Directory Table */
        <div className="glass-card border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Resident</th>
                  <th className="px-6 py-3.5">Wing & Flat</th>
                  <th className="px-6 py-3.5">Tenancy Type</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-slate-850/50 transition-colors ${
                      item.status === 'PENDING' ? 'bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white uppercase text-xs shrink-0">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-[11px] text-slate-400">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.flatId ? (
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Flat {item.flatId.flatNumber}</span>
                          <span className="text-slate-500">({item.buildingId?.name || 'Wing A'})</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          item.residentType === 'OWNER' ? 'badge-emerald' : 'badge-cyan'
                        }
                      >
                        {item.residentType || 'Resident'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="space-y-0.5">
                        <p>{item.phone || '—'}</p>
                        {item.emergencyContact?.name && (
                          <p className="text-[10px] text-slate-500">
                            ICE: {item.emergencyContact.name} ({item.emergencyContact.phone})
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800/60 font-bold">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>PENDING APPROVAL</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'PENDING' && (
                          <button
                            disabled={actionLoadingId === item._id}
                            onClick={() => handleApprove(item._id, item.name)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-glow-emerald flex items-center gap-1 transition-all"
                          >
                            {actionLoadingId === item._id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Approve Account
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(item._id, item.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      No residents found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
