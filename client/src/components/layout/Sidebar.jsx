import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Users,
  Grid,
  CreditCard,
  Bell,
  MessageSquareWarning,
  CalendarDays,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  Sparkles,
  QrCode,
  Vote,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'SOCIETY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isResident = user?.role === 'RESIDENT';
  const isSecurity = user?.role === 'SECURITY';

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Towers & Flats', path: '/admin/wings', icon: Grid },
    { name: 'Residents Directory', path: '/admin/residents', icon: Users },
    { name: 'Security & Staff', path: '/admin/staff', icon: ShieldCheck },
    { name: 'Maintenance & Invoices', path: '/admin/billing', icon: CreditCard },
    { name: 'Amenities Manager', path: '/admin/amenities', icon: CalendarDays },
    { name: 'Community Polls', path: '/admin/community', icon: Vote },
    { name: 'Notice Board', path: '/admin/notices', icon: Bell },
    { name: 'Helpdesk Tickets', path: '/admin/complaints', icon: MessageSquareWarning },
  ];

  const residentNav = [
    { name: 'Resident Portal', path: '/resident/dashboard', icon: LayoutDashboard },
    { name: 'Book Amenities', path: '/resident/amenities', icon: CalendarDays },
    { name: 'Community Polls', path: '/resident/community', icon: Vote },
    { name: 'Guest Passes', path: '/resident/visitors', icon: QrCode },
    { name: 'Notices & Feed', path: '/resident/notices', icon: Bell },
    { name: 'Helpdesk & Service', path: '/resident/helpdesk', icon: MessageSquareWarning },
  ];

  const securityNav = [
    { name: 'Gatekeeper Terminal', path: '/security/terminal', icon: ShieldAlert },
    { name: 'Visitor Log', path: '/security/logs', icon: QrCode },
  ];

  const navLinks = isAdmin ? adminNav : isResident ? residentNav : securityNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0B0F19] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-glow-cyan">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">Socio</span>
                <span className="font-extrabold text-lg text-cyan-400">Hub</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[140px]">
                {user?.societyId?.name || 'Emerald Heights'}
              </p>
            </div>
          </div>
        </div>

        {/* Role Badge Indicator */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Logged in as:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-md ${
                isAdmin
                  ? 'bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-800/40'
                  : isResident
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                  : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
              }`}
            >
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-glow-cyan'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-colors group-hover:text-cyan-400" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white uppercase shrink-0">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.flatId ? `Flat ${user.flatId.flatNumber}` : user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
