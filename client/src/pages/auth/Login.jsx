import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Modal States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    if (!forgotEmail.trim() || !forgotNewPassword.trim() || !forgotConfirmPassword.trim()) {
      setForgotErrorMsg('Please fill in your email and new password.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    try {
      setForgotSubmitting(true);
      const res = await api.post('/auth/forgot-password', {
        email: forgotEmail.trim().toLowerCase(),
        newPassword: forgotNewPassword,
      });
      setForgotSuccessMsg(
        res.data?.message ||
          'Password change request sent! Once the society admin approves, your new password will become active.'
      );
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err) {
      setForgotErrorMsg(err.response?.data?.message || 'Failed to submit password reset request.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      if (user.role === 'SOCIETY_ADMIN' || user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'SECURITY') {
        navigate('/security/terminal');
      } else {
        navigate('/resident/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(demoEmail, demoPassword);
      if (user.role === 'SOCIETY_ADMIN' || user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'SECURITY') {
        navigate('/security/terminal');
      } else {
        navigate('/resident/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center items-center px-4 py-8 md:py-12 relative overflow-hidden">
      {/* Ambient neon orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-60 sm:w-72 h-60 sm:h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-glow-cyan mb-3 sm:mb-4">
            <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Socio<span className="text-cyan-400">Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-2">
            Smart Residential Society & Apartment Management
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-6 sm:p-8 shadow-2xl border border-slate-800/90 relative">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="piyush.resident@emeraldheights.com"
                  className="w-full pl-10 glass-input text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || '');
                    setForgotErrorMsg('');
                    setForgotSuccessMsg('');
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 glass-input text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-glow-cyan flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="mt-3 text-center">
              <p className="text-xs text-slate-400">
                New resident at Emerald Heights?{' '}
                <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
                  Register Account →
                </Link>
              </p>
            </div>
          </form>

          {/* Quick Demo Logins Container */}
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <p className="text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider text-center">
                1-Click Demo Accounts
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@emeraldheights.com', 'admin123')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fuchsia-400">Society Admin</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-cyan-400">Login →</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Piyush Kumar (Admin)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('piyush.resident@emeraldheights.com', 'resident123')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-cyan-500/40 text-left transition-colors group shadow-glow-cyan"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Resident Owner</span>
                  <span className="text-[10px] text-cyan-400 group-hover:underline">Login →</span>
                </div>
                <p className="text-[11px] text-white font-medium mt-0.5">Piyush Sharma (A-101)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ananya.tenant@emeraldheights.com', 'resident123')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">Resident Tenant</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-cyan-400">Login →</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Ananya Patel (A-102)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('security@emeraldheights.com', 'security123')}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">Security Gate</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-cyan-400">Login →</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Ramesh Pawar (Gate 1)</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          SocioHub • Emerald Heights Residency
        </p>
      </div>

      {/* Forgot Password Request Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleUp relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Reset Password Request</h2>
                  <p className="text-xs text-slate-400">Requires Society Admin approval</p>
                </div>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccessMsg ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-emerald-200">Request Sent Successfully</p>
                    <p className="leading-relaxed">{forgotSuccessMsg}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  🛡️ For security reasons, passwords cannot be overwritten directly without administrator verification. Once approved, you can log in with your new password.
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotSuccessMsg('');
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-glow-cyan"
                  >
                    Got It, Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                {forgotErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{forgotErrorMsg}</span>
                  </div>
                )}

                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered account email and your requested new password. Upon clicking submit, a confirmation request will be dispatched to your Society Admin.
                </p>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. piyush.resident@emeraldheights.com"
                      className="w-full pl-10 glass-input text-xs"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type={showForgotPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 glass-input text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPass(!showForgotPass)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showForgotPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type={showForgotConfirmPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-10 glass-input text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showForgotConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-glow-cyan flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {forgotSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Request Password Change</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
