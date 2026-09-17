import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Crown,
  UserPlus,
  Search,
  Mail,
  Phone,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Power,
  Users,
  Building2,
  Clock,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export const AdminStaffManagement = () => {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('ALL'); // 'ALL' | 'SECURITY' | 'SOCIETY_ADMIN'
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [errorFeedback, setErrorFeedback] = useState(null);

  // Add Personnel Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Security@123',
    role: 'SECURITY',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Fetch all staff members (Security Guards & Admins)
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=SECURITY,SOCIETY_ADMIN');
      setStaffList(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching staff list:', err);
      setErrorFeedback('Failed to load personnel roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorFeedback(msg);
      setTimeout(() => setErrorFeedback(null), 5000);
    } else {
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Handle Create Staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      showNotification('Please fill in Name, Email, and Password.', true);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      };

      await api.post('/users', payload);
      showNotification(`Successfully created account for ${formData.name}!`);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: 'Security@123',
        role: 'SECURITY',
      });
      fetchStaff();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error creating personnel account.', true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Toggle Active/Inactive Status
  const handleToggleStatus = async (user) => {
    if (currentUser?._id === user._id) {
      showNotification('You cannot deactivate your own administrative account.', true);
      return;
    }

    try {
      await api.patch(`/users/${user._id}/toggle-status`);
      showNotification(
        `Account for ${user.name} is now ${user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}.`
      );
      fetchStaff();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update account status.', true);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showNotification('Password must be at least 6 characters.', true);
      return;
    }

    try {
      setResetting(true);
      await api.patch(`/users/${resetModalUser._id}/reset-password`, { newPassword });
      showNotification(`Password reset successfully for ${resetModalUser.name}.`);
      setResetModalUser(null);
      setNewPassword('');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to reset password.', true);
    } finally {
      setResetting(false);
    }
  };

  // Handle Delete Staff
  const handleDeleteStaff = async (user) => {
    if (currentUser?._id === user._id) {
      showNotification('You cannot delete your own administrative account.', true);
      return;
    }

    if (!confirm(`Are you sure you want to remove ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/users/${user._id}`);
      showNotification(`Account for ${user.name} removed successfully.`);
      fetchStaff();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete account.', true);
    }
  };

  // Derived counts
  const totalGuards = staffList.filter((s) => s.role === 'SECURITY').length;
  const totalAdmins = staffList.filter((s) => s.role === 'SOCIETY_ADMIN').length;
  const activeCount = staffList.filter((s) => s.status === 'ACTIVE').length;

  // Filtered List
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search));

    if (!matchesSearch) return false;
    if (filterRole === 'ALL') return true;
    return s.role === filterRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            <span>Staff & Security Personnel</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Provision and control accounts for gate security guards, patrol staff, and society administrators.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              phone: '',
              password: 'Security@123',
              role: 'SECURITY',
            });
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-glow-cyan transition-all transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Feedback Alerts */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorFeedback && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{totalGuards}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Security Gatekeepers</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-glow-amber">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{totalAdmins}</div>
            <div className="text-xs text-slate-400 mt-0.5">Society Admins & Office</div>
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow-indigo">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{activeCount} / {staffList.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Active Staff Accounts</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search staff by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 glass-input text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <button
            onClick={() => setFilterRole('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterRole === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            All Personnel ({staffList.length})
          </button>

          <button
            onClick={() => setFilterRole('SECURITY')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              filterRole === 'SECURITY'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>Guards ({totalGuards})</span>
          </button>

          <button
            onClick={() => setFilterRole('SOCIETY_ADMIN')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              filterRole === 'SOCIETY_ADMIN'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Admins ({totalAdmins})</span>
          </button>
        </div>
      </div>

      {/* Staff Roster Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mr-3" />
          <span className="text-sm">Loading staff members...</span>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="glass-card p-12 text-center border border-slate-800">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No personnel found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {search ? 'Try adjusting your search query.' : 'Click "Add Staff Member" to provision guards or admins.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => {
            const isGuard = staff.role === 'SECURITY';
            const isSelf = currentUser?._id === staff._id;
            const isActive = staff.status === 'ACTIVE';

            return (
              <div
                key={staff._id}
                className="glass-card p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Role badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                        isGuard
                          ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {isGuard ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Security Guard</span>
                        </>
                      ) : (
                        <>
                          <Crown className="w-3.5 h-3.5" />
                          <span>Society Admin</span>
                        </>
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      {isSelf && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold">
                          You
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        ></span>
                        {staff.status}
                      </span>
                    </div>
                  </div>

                  {/* Name & Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {staff.name}
                  </h3>

                  {/* Contact Info */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Reset Password Button */}
                    <button
                      onClick={() => {
                        setResetModalUser(staff);
                        setNewPassword('');
                      }}
                      title="Reset Password"
                      className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-colors flex items-center gap-1 text-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset Pass</span>
                    </button>

                    {/* Toggle Active/Inactive */}
                    {!isSelf && (
                      <button
                        onClick={() => handleToggleStatus(staff)}
                        title={isActive ? 'Deactivate Account' : 'Activate Account'}
                        className={`p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs ${
                          isActive
                            ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-900/60'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-900/60'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {isActive ? 'Deactivate' : 'Activate'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Delete Button */}
                  {!isSelf && (
                    <button
                      onClick={() => handleDeleteStaff(staff)}
                      title="Delete User"
                      className="p-2 rounded-lg bg-rose-950/20 hover:bg-rose-950/60 text-rose-400 border border-rose-900/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Operational Note Card */}
      <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-slate-300 flex items-start gap-3 mt-6">
        <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-cyan-300">How Security Guard Accounts Work</p>
          <p className="text-slate-400 leading-relaxed">
            When you create a <strong>Security Guard</strong> account, they can immediately log in via the main login screen.
            They will be automatically routed straight to the <strong>Gatekeeper Terminal</strong> (live walk-in registration, visitor QR scanner, and resident radar approvals).
            Guards do not have access to financial ledgers, maintenance funds, or resident personal contact databases.
          </p>
        </div>
      </div>

      {/* MODAL: Add Staff Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white">Add Staff Member</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Role & Clearance Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        role: 'SECURITY',
                        password: formData.password === 'Admin@123' ? 'Security@123' : formData.password,
                      });
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      formData.role === 'SECURITY'
                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-glow-cyan'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Security Guard</span>
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      Gate terminal, walk-in logging, guest entry requests
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        role: 'SOCIETY_ADMIN',
                        password: formData.password === 'Security@123' ? 'Admin@123' : formData.password,
                      });
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      formData.role === 'SOCIETY_ADMIN'
                        ? 'bg-amber-950/60 border-amber-500 text-white shadow-glow-amber'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                      <Crown className="w-4 h-4" />
                      <span>Society Admin</span>
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      Full society control, maintenance billing, complaints
                    </span>
                  </button>
                </div>
              </div>

              {/* Full Name / Post */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name & Designation / Gate
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formData.role === 'SECURITY'
                      ? 'e.g. Suresh Shinde (Gate 2 / Night Shift)'
                      : 'e.g. Sunil Verma (Secretary / Treasurer)'
                  }
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address (Login ID)
                </label>
                <input
                  type="email"
                  required
                  placeholder={
                    formData.role === 'SECURITY'
                      ? 'e.g. guard2@emeraldheights.com'
                      : 'e.g. secretary@emeraldheights.com'
                  }
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Initial Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full glass-input text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Min. 6 characters. Provide this password to the guard or admin for their first login.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-glow-cyan flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Reset Password</h2>
                  <p className="text-xs text-slate-400">For {resetModalUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Enter new 6+ char password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full glass-input text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The user will be able to log in immediately with this new password.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-glow-amber flex items-center gap-1.5 disabled:opacity-50"
                >
                  {resetting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffManagement;
