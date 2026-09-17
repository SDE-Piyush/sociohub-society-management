import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, login } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleQuickSwitch = async (email, pass) => {
    try {
      await login(email, pass);
      setDropdownOpen(false);
      if (email.includes('admin')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/resident/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-medium text-xs truncate max-w-[140px] sm:max-w-none">
              {user?.societyId?.name || 'Emerald Heights Residency'}
            </span>
          </div>
          {user?.flatId && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs text-cyan-400">
              <Building className="w-3.5 h-3.5" />
              <span>Flat {user.flatId.flatNumber} ({user.residentType || 'Resident'})</span>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search on larger screens */}
        <div className="hidden lg:flex items-center relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search flats, residents..."
            className="w-56 bg-slate-900/80 border border-slate-800/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full ring-2 ring-slate-950" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 sm:gap-2.5 p-1 sm:p-1.5 sm:pr-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-tight truncate max-w-[100px]">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">
                {user?.role?.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                onClick={() => setDropdownOpen(false)}
                className="fixed inset-0 z-30"
              />
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0B0F19] border border-slate-800 shadow-2xl p-2 z-40">
                <div className="px-3 py-2.5 border-b border-slate-800/80">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                    <ShieldCheck className="w-3 h-3" />
                    {user?.role}
                  </div>
                </div>

                {/* Quick Persona Switcher */}
                <div className="p-2 border-b border-slate-800/60">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Demo Role Switcher
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleQuickSwitch('admin@emeraldheights.com', 'admin123')}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center justify-between"
                    >
                      <span>Admin</span>
                      <span className="text-[10px] text-fuchsia-400 font-semibold">Piyush Kumar</span>
                    </button>
                    <button
                      onClick={() => handleQuickSwitch('piyush.resident@emeraldheights.com', 'resident123')}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center justify-between"
                    >
                      <span>Resident Owner</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Piyush (A-101)</span>
                    </button>
                    <button
                      onClick={() => handleQuickSwitch('ananya.tenant@emeraldheights.com', 'resident123')}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center justify-between"
                    >
                      <span>Resident Tenant</span>
                      <span className="text-[10px] text-cyan-400 font-semibold">Ananya (A-102)</span>
                    </button>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
