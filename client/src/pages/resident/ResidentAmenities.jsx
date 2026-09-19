import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Droplets,
  Zap,
  Dumbbell,
  Shield,
  ChevronRight,
  Info,
  Calendar,
  Ticket,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

export const ResidentAmenities = () => {
  const { user } = useAuth();
  const [amenities, setAmenities] = useState([]);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [slotsData, setSlotsData] = useState({ slots: [], totalSlots: 0, availableSlotsCount: 0 });
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingModal, setBookingModal] = useState(null); // Slot object or null
  const [purpose, setPurpose] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Generate next 7 days for the visual date selector
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return { iso, dayName, dayNum };
  });

  // Fetch amenities list
  const fetchAmenities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/amenities');
      const list = res.data?.data || [];
      setAmenities(list);
      if (list.length > 0 && !selectedAmenity) {
        setSelectedAmenity(list[0]);
      }
    } catch (err) {
      console.error('Error loading amenities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch slots for selected amenity & date
  const fetchAvailability = async (amenityId, date) => {
    if (!amenityId) return;
    try {
      setSlotsLoading(true);
      const res = await api.get(`/amenities/${amenityId}/availability?date=${date}`);
      if (res.data?.data) {
        setSlotsData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching slot availability:', err);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Fetch resident's personal bookings
  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/amenities/my-bookings');
      setMyBookings(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  useEffect(() => {
    fetchAmenities();
    fetchMyBookings();
  }, []);

  useEffect(() => {
    if (selectedAmenity) {
      fetchAvailability(selectedAmenity._id, selectedDate);
    }
  }, [selectedAmenity, selectedDate]);

  // Handle slot reservation
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingModal || !selectedAmenity) return;

    try {
      setSubmitting(true);
      const res = await api.post('/amenities/book', {
        amenityId: selectedAmenity._id,
        bookingDate: selectedDate,
        startTime: bookingModal.startTime,
        endTime: bookingModal.endTime,
        purpose: purpose || 'Recreation',
        guestCount: Number(guestCount) || 1,
      });

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setStatusMessage({
        type: 'success',
        text: res.data?.message || 'Slot reserved successfully!',
      });
      setTimeout(() => setStatusMessage(null), 5000);

      setBookingModal(null);
      setPurpose('');
      setGuestCount(1);
      fetchAvailability(selectedAmenity._id, selectedDate);
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book slot. Please try another time.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await api.put(`/amenities/bookings/${bookingId}/cancel`, {
        reason: 'Cancelled by resident',
      });
      setStatusMessage({
        type: 'info',
        text: 'Reservation successfully cancelled.',
      });
      setTimeout(() => setStatusMessage(null), 4000);
      if (selectedAmenity) {
        fetchAvailability(selectedAmenity._id, selectedDate);
      }
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling booking');
    }
  };

  // Helper icon mapper
  const renderAmenityIcon = (code, className = 'w-5 h-5') => {
    switch (code) {
      case 'CLUBHOUSE':
        return <Sparkles className={className} />;
      case 'POOL':
        return <Droplets className={className} />;
      case 'TENNIS':
        return <Zap className={className} />;
      case 'GYM':
        return <Dumbbell className={className} />;
      default:
        return <CalendarDays className={className} />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Amenities & Slot Reservation
            </h1>
            <span className="badge-indigo">Live Booking Engine</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reserve sports courts, banquet halls, and leisure facilities with atomic double-booking prevention.
          </p>
        </div>

        {/* Assigned flat pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Ticket className="w-4 h-4 text-cyan-400" />
          <span>Billed Flat:</span>
          <span className="font-bold text-white">
            {user?.flatId ? `Flat ${user.flatId.flatNumber}` : 'Flat 101'}
          </span>
        </div>
      </div>

      {/* Status banner */}
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

      {/* Facility Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {amenities.map((item) => {
          const isSelected = selectedAmenity?._id === item._id;
          return (
            <button
              key={item._id}
              onClick={() => setSelectedAmenity(item)}
              className={`text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border-cyan-500/80 shadow-glow-cyan'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {renderAmenityIcon(item.code)}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.hourlyRate > 0
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    }`}
                  >
                    {item.hourlyRate > 0 ? `₹${item.hourlyRate}/hr` : 'Free'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.openingTime} - {item.closingTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cap: {item.capacity}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Booking Workspace */}
      {selectedAmenity && (
        <div className="glass-card p-5 sm:p-7 border border-slate-800/90 space-y-6">
          {/* Selected Facility Overview Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                {renderAmenityIcon(selectedAmenity.code, 'w-6 h-6')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {selectedAmenity.name}
                  </h2>
                  <span className="badge-cyan">{selectedAmenity.category}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {selectedAmenity.location}
                  </span>
                  <span>•</span>
                  <span>Operating: {selectedAmenity.openingTime} to {selectedAmenity.closingTime}</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-semibold">
                    {slotsData.availableSlotsCount} of {slotsData.totalSlots} slots free
                  </span>
                </div>
              </div>
            </div>

            {/* Rules trigger note */}
            {selectedAmenity.rules?.length > 0 && (
              <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 max-w-sm">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Key House Rules</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {selectedAmenity.rules[0]}
                </p>
              </div>
            )}
          </div>

          {/* 7-Day Visual Date Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Booking Date
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {next7Days.map((d) => {
                const isCurrent = selectedDate === d.iso;
                return (
                  <button
                    key={d.iso}
                    onClick={() => setSelectedDate(d.iso)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-cyan-500/15 border-cyan-500/80 text-cyan-300 shadow-glow-cyan'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      {d.dayName}
                    </p>
                    <p className="text-sm font-extrabold mt-0.5 text-white">
                      {d.dayNum}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots Visual Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Available 60-Minute Slots for{' '}
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
              </div>

              {/* Legend */}
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-emerald" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-glow-indigo" />
                  <span>Your Booking</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span>Reserved</span>
                </div>
              </div>
            </div>

            {slotsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Loading live slot availability...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {slotsData.slots.map((slot) => {
                  if (slot.isBookedByMe) {
                    return (
                      <div
                        key={slot.startTime}
                        className="p-3.5 rounded-xl border border-indigo-500/80 bg-indigo-950/40 shadow-glow-indigo flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-white">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          </div>
                          <p className="text-[11px] font-semibold text-indigo-300 mt-1">
                            Your Booking
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {slot.purpose || 'Recreation'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelBooking(slot.bookingId)}
                          className="mt-2.5 py-1 px-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-[11px] font-bold text-rose-300 transition-colors text-center"
                        >
                          Cancel Slot
                        </button>
                      </div>
                    );
                  }

                  if (slot.isBooked) {
                    return (
                      <div
                        key={slot.startTime}
                        className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 opacity-60 flex flex-col justify-between cursor-not-allowed"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-400">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1 font-medium">
                            Reserved (Flat {slot.flatNumber || 'Neighbor'})
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono mt-2">
                          Slot Locked
                        </span>
                      </div>
                    );
                  }

                  // Available Slot
                  return (
                    <button
                      key={slot.startTime}
                      onClick={() => setBookingModal(slot)}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:border-cyan-500/80 hover:bg-slate-850 hover:shadow-glow-cyan transition-all text-left group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 opacity-70 group-hover:opacity-100" />
                        </div>
                        <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                          Available
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                        <span>{selectedAmenity.hourlyRate > 0 ? `₹${selectedAmenity.hourlyRate}` : 'Free'}</span>
                        <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                          Book <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resident's Active Booking Passes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              My Facility Reservations & Passes
            </h2>
          </div>
          <span className="badge-indigo">
            {myBookings.filter((b) => b.status === 'CONFIRMED').length} Active Passes
          </span>
        </div>

        {myBookings.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <CalendarDays className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No amenity bookings yet</p>
            <p className="text-xs text-slate-400">
              Select any facility above to reserve a time slot for tennis, swimming, or gatherings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myBookings.map((b) => {
              const isConfirmed = b.status === 'CONFIRMED';
              return (
                <div
                  key={b._id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isConfirmed
                      ? 'bg-slate-900/90 border-indigo-500/40 shadow-glow-indigo'
                      : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {b.amenityId?.name || 'Facility'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ref: <span className="font-mono text-cyan-400 font-bold">{b.bookingRef}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isConfirmed
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="font-semibold text-white">
                        {new Date(b.bookingDate + 'T00:00:00').toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Slot Time:</span>
                      <span className="font-semibold text-cyan-300 font-mono">
                        {b.startTime} - {b.endTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Purpose:</span>
                      <span className="truncate max-w-[150px]">{b.purpose}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-slate-400">
                      <span>Total Charges:</span>
                      <span className="font-bold text-white">
                        {b.totalCharges > 0 ? `₹${b.totalCharges}` : 'Free'}
                      </span>
                    </div>
                  </div>

                  {isConfirmed && (
                    <div className="mt-4 flex items-center justify-end">
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                      >
                        Cancel Reservation
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {bookingModal && selectedAmenity && (
        <Modal
          isOpen={!!bookingModal}
          onClose={() => setBookingModal(null)}
          title={`Confirm Reservation: ${selectedAmenity.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Facility:</span>
                <span className="font-bold text-white">{selectedAmenity.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reservation Date:</span>
                <span className="font-bold text-cyan-400">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reserved Slot:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {bookingModal.startTime} - {bookingModal.endTime}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-slate-300">
                <span>Facility Charges:</span>
                <span className="font-bold text-base text-white">
                  {selectedAmenity.hourlyRate > 0 ? `₹${selectedAmenity.hourlyRate}` : 'Free'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Purpose / Activity Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Evening Tennis Doubles, Birthday Gathering"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Expected Number of Guests
              </label>
              <input
                type="number"
                min="1"
                max={selectedAmenity.capacity || 50}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full glass-input text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Max capacity for this amenity: {selectedAmenity.capacity} people
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBookingModal(null)}
                className="py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? 'Confirming...' : 'Confirm & Generate Pass'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
