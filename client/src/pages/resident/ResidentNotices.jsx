import React, { useState, useEffect } from 'react';
import {
  Bell,
  Pin,
  AlertTriangle,
  Calendar,
  Search,
  Clock,
  Sparkles,
  Megaphone,
  Filter,
} from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

export const ResidentNotices = () => {
  const { socket } = useSocket();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notices');
      setNotices(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching resident notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();

    // Listen for live new notice from socket
    if (socket) {
      const handleNewNotice = (newNotice) => {
        setNotices((prev) => [newNotice, ...prev]);
      };
      socket.on('new_notice', handleNewNotice);
      return () => {
        socket.off('new_notice', handleNewNotice);
      };
    }
  }, [socket]);

  const categories = [
    'ALL',
    'MAINTENANCE',
    'EMERGENCY',
    'EVENT',
    'RULE',
    'SECURITY',
    'GENERAL',
  ];

  const filteredNotices = notices.filter((n) => {
    const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const urgentNotice = notices.find((n) => n.priority === 'URGENT');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Notices & Community Feed</h1>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
            Live
          </span>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Official society circulars, maintenance advisories, and cultural events.
        </p>
      </div>

      {/* Emergency Alert Banner (if any urgent notice exists) */}
      {urgentNotice && (
        <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-rose-950/80 border-2 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 shrink-0 shadow-glow-rose">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest bg-rose-500 text-white px-2 py-0.5 rounded-full">
                  Urgent Advisory
                </span>
                <span className="text-xs text-rose-300/80">
                  {new Date(urgentNotice.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">{urgentNotice.title}</h3>
              <p className="text-sm text-slate-200 mt-1 leading-relaxed">{urgentNotice.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glow-cyan'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feed..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Notices Stream */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/30 border border-slate-800/60 p-8">
          <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">No circulars in this category</p>
          <p className="text-xs text-slate-500 mt-1">Management hasn't posted any notices matching your query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <div
              key={notice._id}
              className={`p-6 rounded-3xl border transition-all ${
                notice.isPinned
                  ? 'bg-gradient-to-r from-slate-900/90 to-slate-950/90 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.08)]'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {notice.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-800/40">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      notice.priority === 'URGENT'
                        ? 'bg-rose-950/80 text-rose-400 border-rose-700/60'
                        : notice.priority === 'UPCOMING'
                        ? 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60'
                        : 'bg-slate-800 text-slate-300 border-slate-700/60'
                    }`}
                  >
                    {notice.priority}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/40">
                    {notice.category}
                  </span>
                </div>

                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(notice.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h2 className="text-lg font-extrabold text-white tracking-tight mt-1">{notice.title}</h2>
              <p className="mt-2 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {notice.content}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span>Issued by {notice.postedBy?.name || 'Estate Office'}</span>
                <span className="text-[11px] text-slate-500 font-mono">Audience: {notice.targetAudience}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
