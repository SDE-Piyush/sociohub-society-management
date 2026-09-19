import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';

export const AdminAmenities = () => {
  const [amenities, setAmenities] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('AMENITIES'); // 'AMENITIES' | 'BOOKINGS'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form states for new amenity
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'LEISURE',
    description: '',
    capacity: 30,
    location: '',
    hourlyRate: 0,
    openingTime: '06:00',
    closingTime: '22:00',
    rules: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [amenitiesRes, bookingsRes] = await Promise.all([
        api.get('/amenities'),
        api.get('/amenities/all-bookings'),
      ]);
      setAmenities(amenitiesRes.data?.data || []);
      setAllBookings(bookingsRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching admin amenities data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAmenity = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/amenities', formData);
      setSuccessMessage(`Amenity "${formData.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        code: '',
        category: 'LEISURE',
        description: '',
        capacity: 30,
        location: '',
        hourlyRate: 0,
        openingTime: '06:00',
        closingTime: '22:00',
        rules: '',
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating amenity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation as Admin?')) return;
    try {
      await api.put(`/amenities/bookings/${bookingId}/cancel`, {
        reason: 'Cancelled by Society Administrator',
      });
      setSuccessMessage('Reservation cancelled successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling booking');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Amenities & Facility Management
            </h1>
            <span className="badge-indigo">Administration</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure club facilities, hourly tariff, rules, and monitor society-wide reservation schedule.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Facility</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-glow-emerald">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Society Amenities"
          value={amenities.length}
          subtitle="Operational facilities"
          icon={CalendarDays}
          accentColor="cyan"
        />
        <StatCard
          title="Total Reservations"
          value={allBookings.length}
          subtitle="Across all resident flats"
          icon={Calendar}
          accentColor="indigo"
        />
        <StatCard
          title="Confirmed Bookings"
          value={allBookings.filter((b) => b.status === 'CONFIRMED').length}
          subtitle="Active upcoming slots"
          icon={Sparkles}
          accentColor="emerald"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('AMENITIES')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'AMENITIES'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Society Facilities Catalog ({amenities.length})
        </button>
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'BOOKINGS'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Master Reservation Log ({allBookings.length})
        </button>
      </div>

      {/* Tab 1: Amenities List */}
      {activeTab === 'AMENITIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {amenities.map((item) => (
            <div
              key={item._id}
              className="glass-card p-5 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge-cyan text-[10px] mb-1.5">{item.category}</span>
                    <h3 className="text-base font-bold text-white tracking-tight">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      item.hourlyRate > 0
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    }`}
                  >
                    {item.hourlyRate > 0 ? `₹${item.hourlyRate}/hr` : 'Free'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Location</span>
                    <span className="font-semibold text-white truncate block">{item.location}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Operating Hours</span>
                    <span className="font-semibold text-cyan-400 font-mono block">
                      {item.openingTime} - {item.closingTime}
                    </span>
                  </div>
                </div>

                {item.rules?.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Rules & Guidelines
                    </span>
                    <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-0.5">
                      {item.rules.slice(0, 3).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Bookings Log */}
      {activeTab === 'BOOKINGS' && (
        <div className="glass-card border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4">Resident & Flat</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold">
                      {b.bookingRef}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {b.amenityId?.name || 'Facility'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-medium block">
                        {b.userId?.name || 'Resident'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Flat {b.flatId?.flatNumber || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="block text-white font-medium">
                        {b.bookingDate}
                      </span>
                      <span className="text-cyan-400 font-mono text-[11px]">
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[140px] truncate text-slate-300">
                      {b.purpose}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleAdminCancelBooking(b._id)}
                          className="text-rose-400 hover:text-rose-300 font-medium text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Facility Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Society Facility"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateAmenity} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Facility Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Squash Court"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full glass-input text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full glass-input text-xs"
              >
                <option value="SPORTS">SPORTS</option>
                <option value="CLUBHOUSE">CLUBHOUSE</option>
                <option value="FITNESS">FITNESS</option>
                <option value="LEISURE">LEISURE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Location</label>
            <input
              type="text"
              required
              placeholder="e.g. Clubhouse 3rd Floor"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full glass-input text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={2}
              placeholder="Brief overview of the amenity..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full glass-input text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Capacity</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full glass-input text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Tariff (₹/hr)</label>
              <input
                type="number"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full glass-input text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Opening Time</label>
              <input
                type="text"
                value={formData.openingTime}
                onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                className="w-full glass-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Rules & Bylaws (one per line)</label>
            <textarea
              rows={3}
              placeholder="Appropriate attire mandatory..."
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              className="w-full glass-input text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan"
            >
              {submitting ? 'Creating...' : 'Create Amenity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
