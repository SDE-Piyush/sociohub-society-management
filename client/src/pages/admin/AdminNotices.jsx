import React, { useState, useEffect } from 'react';
import {
  Bell,
  PlusCircle,
  Pin,
  Trash2,
  AlertTriangle,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Tag,
  Send,
} from 'lucide-react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import { StatCard } from '../../components/common/StatCard';

export const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Notice Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [isPinned, setIsPinned] = useState(false);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notices');
      setNotices(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post('/notices', {
        title,
        content,
        category,
        priority,
        targetAudience,
        isPinned,
      });

      setFeedback({ type: 'success', message: 'Notice broadcasted to society members!' });
      setTimeout(() => setFeedback(null), 4000);
      setIsPublishModalOpen(false);

      // Reset form
      setTitle('');
      setContent('');
      setCategory('GENERAL');
      setPriority('NORMAL');
      setTargetAudience('ALL');
      setIsPinned(false);

      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await api.patch(`/notices/${id}/pin`);
      fetchNotices();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (err) {
      console.error('Error deleting notice:', err);
    }
  };

  const categories = [
    'ALL',
    'GENERAL',
    'MAINTENANCE',
    'EMERGENCY',
    'EVENT',
    'RULE',
    'SECURITY',
    'BILLING',
  ];

  const filteredNotices = notices.filter((n) => {
    const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const urgentCount = notices.filter((n) => n.priority === 'URGENT').length;
  const pinnedCount = notices.filter((n) => n.isPinned).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Society Notice Board</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              Operations
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Broadcast emergency alerts, maintenance schedules, and events to residents & owners.
          </p>
        </div>

        <button
          onClick={() => setIsPublishModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow-cyan transition-all transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Publish New Notice
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {feedback.message}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={Bell}
          label="Total Active Notices"
          value={notices.length}
          color="cyan"
          trend="All published circulars"
        />
        <StatCard
          icon={AlertTriangle}
          label="Urgent Priority Alerts"
          value={urgentCount}
          color="rose"
          trend="Immediate attention required"
        />
        <StatCard
          icon={Pin}
          label="Pinned on Dashboard"
          value={pinnedCount}
          color="amber"
          trend="Visible at top of feed"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-thin">
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

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/30 border border-slate-800/60 p-8">
          <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">No notices found</p>
          <p className="text-xs text-slate-500 mt-1">Publish a new circular to notify society residents.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNotices.map((notice) => (
            <div
              key={notice._id}
              className={`relative rounded-2xl p-6 transition-all flex flex-col justify-between border ${
                notice.isPinned
                  ? 'bg-gradient-to-b from-slate-900/95 to-slate-950 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.1)]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Badges Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Priority badge */}
                    <span
                      className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${
                        notice.priority === 'URGENT'
                          ? 'bg-rose-950/80 text-rose-400 border-rose-700/60 shadow-glow-rose'
                          : notice.priority === 'UPCOMING'
                          ? 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60'
                          : 'bg-slate-800 text-slate-300 border-slate-700/60'
                      }`}
                    >
                      {notice.priority}
                    </span>

                    {/* Category */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/40">
                      {notice.category}
                    </span>

                    {/* Audience */}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                      Audience: {notice.targetAudience}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(notice._id)}
                      title={notice.isPinned ? 'Unpin notice' : 'Pin notice'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        notice.isPinned
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notice._id)}
                      title="Delete notice"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                  {notice.title}
                </h3>

                {/* Content */}
                <p className="mt-2 text-sm text-slate-300 whitespace-pre-line line-clamp-4 leading-relaxed">
                  {notice.content}
                </p>
              </div>

              {/* Footer info */}
              <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(notice.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span>By {notice.postedBy?.name || 'Management'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Notice Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Publish Society Notice"
      >
        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notice Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Scheduled Water Shutdown for Tank Cleaning"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="GENERAL">General</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="EVENT">Event</option>
                <option value="RULE">Rule / Policy</option>
                <option value="SECURITY">Security</option>
                <option value="BILLING">Billing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent (Red Alert)</option>
                <option value="UPCOMING">Upcoming Event</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Residents</option>
                <option value="OWNERS">Owners Only</option>
                <option value="TENANTS">Tenants Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notice Content / Instructions *</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide clear details, timings, emergency contacts, or actions required from residents..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinCheck"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="pinCheck" className="text-xs text-slate-300 cursor-pointer">
              Pin this notice at the top of resident dashboard
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-cyan transition-all"
            >
              {submitting ? 'Broadcasting...' : 'Publish & Broadcast'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
