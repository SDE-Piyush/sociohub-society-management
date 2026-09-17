import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  LogOut,
  Search,
  Filter,
  User,
  Car,
  Building,
  QrCode,
  Sparkles,
} from 'lucide-react';
import api from '../../api/axios';
import { StatCard } from '../../components/common/StatCard';
import { useSocket } from '../../context/SocketContext';

export const SecurityLogs = () => {
  const { socket } = useSocket();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ insideNow: 0, expectedToday: 0, walkInsToday: 0, totalToday: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/visitors/gate-logs', {
        params: {
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
          search: search || undefined,
        },
      });
      setLogs(res.data?.data || []);
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching gate logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterStatus, search]);

  useEffect(() => {
    if (socket) {
      const handleVisitorEvent = () => {
        fetchLogs();
      };
      socket.on('visitor_checked_in', handleVisitorEvent);
      socket.on('visitor_approval_response', handleVisitorEvent);
      return () => {
        socket.off('visitor_checked_in', handleVisitorEvent);
        socket.off('visitor_approval_response', handleVisitorEvent);
      };
    }
  }, [socket]);

  const handleCheckOut = async (visitorId) => {
    try {
      setActionLoadingId(visitorId);
      await api.patch(`/visitors/${visitorId}/checkout`);
      fetchLogs();
    } catch (err) {
      alert('Error checking out visitor');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Live Gate & Visitor Log</h1>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
            Real-Time
          </span>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Monitor all entries and exits across Main Gate and record visitor departures.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={User}
          label="Currently Inside"
          value={stats.insideNow}
          color="emerald"
          trend="Guests on campus"
        />
        <StatCard
          icon={QrCode}
          label="Expected Today"
          value={stats.expectedToday}
          color="cyan"
          trend="Pre-approved passes"
        />
        <StatCard
          icon={ShieldAlert}
          label="Walk-ins Logged"
          value={stats.walkInsToday}
          color="purple"
          trend="Gate approvals today"
        />
        <StatCard
          icon={Clock}
          label="Total Gate Movements"
          value={stats.totalToday}
          color="amber"
          trend="Today's total visitors"
        />
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'CHECKED_IN', 'EXPECTED', 'CHECKED_OUT'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glow-cyan'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/40'
              }`}
            >
              {st === 'CHECKED_IN' ? 'Inside Now' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visitor or PIN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/30 border border-slate-800/60 p-8">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">No visitor records found</p>
          <p className="text-xs text-slate-500 mt-1">Movement logs will appear here in real-time as visitors arrive.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Visitor & Contact</th>
                  <th className="px-5 py-4">Destination Flat</th>
                  <th className="px-5 py-4">Purpose & Type</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Timestamps</th>
                  <th className="px-5 py-4 text-right">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{item.visitorName}</div>
                      <div className="text-slate-400 font-mono mt-0.5">{item.phone}</div>
                      {item.vehicleNumber && (
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Car className="w-3 h-3" /> {item.vehicleNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-cyan-400">Flat {item.flatId?.flatNumber || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">{item.buildingId?.name || 'Main Tower'}</div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-white uppercase">{item.purpose}</span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {item.entryType === 'PRE_APPROVED' ? '🎟️ Pre-Approved' : '🚶 Walk-In Entry'}
                      </div>
                      {item.passCode && (
                        <div className="text-[10px] font-mono text-cyan-500/80 mt-0.5">
                          PIN: {item.passCode}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          item.status === 'CHECKED_IN'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 shadow-glow-emerald'
                            : item.status === 'EXPECTED'
                            ? 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60'
                            : item.status === 'CHECKED_OUT'
                            ? 'bg-slate-800 text-slate-400 border-slate-700/60'
                            : 'bg-rose-950/80 text-rose-400 border-rose-700/60'
                        }`}
                      >
                        {item.status === 'CHECKED_IN' ? 'INSIDE NOW' : item.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-400 space-y-0.5">
                      {item.checkInTime ? (
                        <div>
                          In: {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <div>Expected: {new Date(item.expectedDate || item.createdAt).toLocaleDateString()}</div>
                      )}
                      {item.checkOutTime && (
                        <div className="text-slate-500">
                          Out: {new Date(item.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {item.status === 'CHECKED_IN' ? (
                        <button
                          disabled={actionLoadingId === item._id}
                          onClick={() => handleCheckOut(item._id)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800/60 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Log Exit (Out)
                        </button>
                      ) : item.status === 'CHECKED_OUT' ? (
                        <span className="text-[11px] text-slate-600 font-semibold">Departed</span>
                      ) : (
                        <span className="text-[11px] text-cyan-500/80 font-semibold">Pass Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
