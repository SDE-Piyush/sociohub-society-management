import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { VisitorArrivalModal } from '../common/VisitorArrivalModal';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Bell } from 'lucide-react';

export const AppShell = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeAlert } = useSocket();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      {/* Real-time Resident Arrival Alert Modal (Residents only) */}
      {user?.role === 'RESIDENT' && <VisitorArrivalModal />}

      {/* Floating Gatekeeper Check-In Notification Banner */}
      {activeAlert && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 shadow-glow-emerald text-white max-w-sm animate-bounce">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{activeAlert.title}</h4>
              <p className="text-[11px] text-emerald-200/90 mt-0.5">{activeAlert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
