import React, { useState, useEffect } from 'react';
import {
  Vote,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  ChevronRight,
  BarChart3,
  Calendar,
  Layers,
  Lock,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Modal } from '../../components/common/Modal';

export const CommunityPolls = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'CLOSED'
  const [votingPollId, setVotingPollId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Admin New Poll Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPollData, setNewPollData] = useState({
    question: '',
    description: '',
    category: 'GENERAL',
    targetAudience: 'ALL',
    endDate: '',
    options: ['', ''],
  });

  const isAdmin = user?.role === 'SOCIETY_ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const res = await api.get('/polls');
      setPolls(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching polls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  // Listen to live socket events for real-time percentage updates!
  useEffect(() => {
    if (!socket) return;

    socket.on('poll_vote_update', (data) => {
      setPolls((prev) =>
        prev.map((p) => {
          if (p._id === data.pollId) {
            return {
              ...p,
              totalVotes: data.totalVotes,
              options: data.options.map((opt) => ({
                ...opt,
                isSelectedByMe: p.myVotedOptionId === opt.optionId,
              })),
            };
          }
          return p;
        })
      );
    });

    socket.on('new_poll_created', () => {
      fetchPolls();
    });

    return () => {
      socket.off('poll_vote_update');
      socket.off('new_poll_created');
    };
  }, [socket]);

  // Cast vote on a specific poll option
  const handleVote = async (pollId, optionId) => {
    try {
      setVotingPollId(pollId);
      const res = await api.post(`/polls/${pollId}/vote`, { optionId });
      setStatusMessage({
        type: 'success',
        text: res.data?.message || 'Vote successfully cast!',
      });
      setTimeout(() => setStatusMessage(null), 4000);

      // Update local state with the returned formatted poll
      setPolls((prev) =>
        prev.map((p) => (p._id === pollId ? res.data.data : p))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording your vote');
    } finally {
      setVotingPollId(null);
    }
  };

  // Admin close poll
  const handleClosePoll = async (pollId) => {
    if (!window.confirm('Close voting on this community poll?')) return;
    try {
      const res = await api.patch(`/polls/${pollId}/close`);
      setPolls((prev) =>
        prev.map((p) => (p._id === pollId ? res.data.data : p))
      );
      setStatusMessage({ type: 'info', text: 'Poll has been closed.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error closing poll');
    }
  };

  // Add option field in create form
  const handleAddOptionField = () => {
    if (newPollData.options.length < 5) {
      setNewPollData({
        ...newPollData,
        options: [...newPollData.options, ''],
      });
    }
  };

  // Handle create poll submit
  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const validOptions = newPollData.options.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) {
      alert('Please provide at least 2 valid options.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/polls', {
        ...newPollData,
        options: validOptions,
      });

      setStatusMessage({
        type: 'success',
        text: 'Community poll published successfully!',
      });
      setTimeout(() => setStatusMessage(null), 4000);

      setIsCreateModalOpen(false);
      setNewPollData({
        question: '',
        description: '',
        category: 'GENERAL',
        targetAudience: 'ALL',
        endDate: '',
        options: ['', ''],
      });
      fetchPolls();
    } catch (err) {
      alert(err.response?.data?.message || 'Error publishing poll');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPolls = polls.filter((p) => {
    if (filterStatus === 'ACTIVE') return p.status === 'ACTIVE' && !p.isExpired;
    if (filterStatus === 'CLOSED') return p.status === 'CLOSED' || p.isExpired;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Community Polls & Feedback
            </h1>
            <span className="badge-fuchsia">Democratic Governance</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cast 1 vote per flat on society bylaws, festival celebrations, and infrastructure enhancements.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-fuchsia transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Community Poll</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in duration-300 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 shadow-glow-emerald'
              : 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-300'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'ALL', label: 'All Polls' },
          { id: 'ACTIVE', label: 'Active Votes' },
          { id: 'CLOSED', label: 'Concluded' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              filterStatus === tab.id
                ? 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/40 shadow-glow-fuchsia'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Polls Feed */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading community votes...</p>
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3 border border-slate-800">
          <BarChart3 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No polls found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filterStatus === 'ACTIVE'
              ? 'There are currently no active community votes in Emerald Heights.'
              : 'No past polls match your filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPolls.map((poll) => {
            const isClosed = poll.status === 'CLOSED' || poll.isExpired;
            return (
              <div
                key={poll._id}
                className={`glass-card p-6 border transition-all duration-300 flex flex-col justify-between ${
                  poll.hasVoted
                    ? 'border-fuchsia-500/30 bg-slate-900/90'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/70'
                }`}
              >
                <div>
                  {/* Category & Status Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="badge-fuchsia text-[10px]">
                        {poll.category}
                      </span>
                      {poll.hasVoted && (
                        <span className="badge-emerald text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Voted
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {isClosed
                          ? 'Concluded'
                          : `Ends ${new Date(poll.endDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}`}
                      </span>
                    </div>
                  </div>

                  {/* Question & Description */}
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {poll.question}
                  </h3>
                  {poll.description && (
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {poll.description}
                    </p>
                  )}

                  {/* Options & Real-Time Percentage Bars */}
                  <div className="mt-5 space-y-3">
                    {poll.options.map((opt) => {
                      const isMyChoice = opt.isSelectedByMe;
                      return (
                        <div key={opt.optionId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span
                              className={`flex items-center gap-2 ${
                                isMyChoice ? 'text-fuchsia-300 font-bold' : 'text-slate-200'
                              }`}
                            >
                              {opt.text}
                              {isMyChoice && (
                                <span className="text-[10px] text-fuchsia-400 font-bold bg-fuchsia-950/80 px-1.5 py-0.5 rounded border border-fuchsia-800/40">
                                  Your Choice
                                </span>
                              )}
                            </span>
                            <span className="text-slate-400 font-mono">
                              {opt.percentage}% ({opt.votesCount})
                            </span>
                          </div>

                          {/* Progress Bar Track */}
                          <div className="relative h-2.5 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                isMyChoice
                                  ? 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 shadow-glow-fuchsia'
                                  : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                              }`}
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>

                          {/* Action button if user has NOT voted yet */}
                          {!poll.hasVoted && !isClosed && (
                            <button
                              disabled={votingPollId === poll._id}
                              onClick={() => handleVote(poll._id, opt.optionId)}
                              className="mt-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <span>Vote for this</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Meta & Admin Action */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      <strong className="text-white">{poll.totalVotes}</strong> resident flat votes
                    </span>
                  </div>

                  {isAdmin && !isClosed && (
                    <button
                      onClick={() => handleClosePoll(poll._id)}
                      className="text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors"
                    >
                      Close Poll
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Launch Poll Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Launch New Community Poll"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Question / Resolution</label>
            <input
              type="text"
              required
              placeholder="e.g. Should we install EV fast chargers in Basement 1?"
              value={newPollData.question}
              onChange={(e) => setNewPollData({ ...newPollData, question: e.target.value })}
              className="w-full glass-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={newPollData.category}
                onChange={(e) => setNewPollData({ ...newPollData, category: e.target.value })}
                className="w-full glass-input text-xs"
              >
                <option value="GENERAL">GENERAL</option>
                <option value="AMENITIES">AMENITIES</option>
                <option value="RULES">RULES</option>
                <option value="FESTIVAL">FESTIVAL</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="SECURITY">SECURITY</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Voting End Date</label>
              <input
                type="date"
                required
                value={newPollData.endDate}
                onChange={(e) => setNewPollData({ ...newPollData, endDate: e.target.value })}
                className="w-full glass-input text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description & Context</label>
            <textarea
              rows={2}
              placeholder="Provide background, proposed cost, or committee recommendation..."
              value={newPollData.description}
              onChange={(e) => setNewPollData({ ...newPollData, description: e.target.value })}
              className="w-full glass-input text-xs"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Poll Options (Minimum 2)
              </label>
              {newPollData.options.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOptionField}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  + Add Option
                </button>
              )}
            </div>

            {newPollData.options.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                required
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => {
                  const updated = [...newPollData.options];
                  updated[idx] = e.target.value;
                  setNewPollData({ ...newPollData, options: updated });
                }}
                className="w-full glass-input text-xs"
              />
            ))}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2 px-5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-fuchsia"
            >
              {submitting ? 'Publishing...' : 'Publish Poll to Society'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
