import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Grid,
  Plus,
  UserPlus,
  UserCheck,
  UserMinus,
  CheckCircle2,
  Home,
  Key,
  Shield,
  Phone,
  Mail,
} from 'lucide-react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';

export const WingsAndFlats = () => {
  const [searchParams] = useSearchParams();
  const initialWingId = searchParams.get('wingId');

  const [buildings, setBuildings] = useState([]);
  const [selectedWing, setSelectedWing] = useState(null);
  const [flats, setFlats] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetFlat, setTargetFlat] = useState(null);
  const [residentName, setResidentName] = useState('');
  const [residentEmail, setResidentEmail] = useState('');
  const [residentPhone, setResidentPhone] = useState('');
  const [residentType, setResidentType] = useState('OWNER');

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/buildings');
      const blds = res.data?.data || [];
      setBuildings(blds);

      if (blds.length > 0) {
        const found = initialWingId ? blds.find((b) => b._id === initialWingId) : blds[0];
        setSelectedWing(found || blds[0]);
      }
    } catch (err) {
      console.error('Error fetching buildings', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlats = async (wingId) => {
    if (!wingId) return;
    try {
      const res = await api.get(`/flats/building/${wingId}`);
      setFlats(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching flats', err);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedWing?._id) {
      fetchFlats(selectedWing._id);
    }
  }, [selectedWing]);

  const openAssignModal = (flat) => {
    setTargetFlat(flat);
    setResidentName('');
    setResidentEmail('');
    setResidentPhone('');
    setResidentType('OWNER');
    setIsAssignModalOpen(true);
  };

  const handleAssignResident = async (e) => {
    e.preventDefault();
    if (!targetFlat) return;

    try {
      // 1. Create user or onboard resident
      const userRes = await api.post('/users', {
        name: residentName,
        email: residentEmail,
        phone: residentPhone,
        role: 'RESIDENT',
        residentType,
        flatId: targetFlat._id,
        buildingId: selectedWing._id,
      });

      setIsAssignModalOpen(false);
      fetchFlats(selectedWing._id);
      fetchBuildings();
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning resident');
    }
  };

  const handleUnassign = async (flat, type) => {
    if (!confirm(`Are you sure you want to remove the current ${type.toLowerCase()} from Flat ${flat.flatNumber}?`)) {
      return;
    }
    try {
      await api.post(`/flats/${flat._id}/unassign`, { residentType: type });
      fetchFlats(selectedWing._id);
      fetchBuildings();
    } catch (err) {
      alert(err.response?.data?.message || 'Error unassigning');
    }
  };

  const filteredFlats = flats.filter((f) => {
    if (filterStatus === 'ALL') return true;
    return f.occupancyStatus === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <span>Towers & Flat Occupancy</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual floor grid, tenancy status, and instant resident onboarding
          </p>
        </div>
      </div>

      {/* Wing Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {buildings.map((wing) => {
          const isActive = selectedWing?._id === wing._id;
          return (
            <button
              key={wing._id}
              onClick={() => setSelectedWing(wing)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{wing.name}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                {wing.occupiedFlats}/{wing.totalFlats}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Units' },
            { id: 'OWNER_OCCUPIED', label: 'Owner Occupied', color: 'text-emerald-400' },
            { id: 'TENANT_OCCUPIED', label: 'Tenant Occupied', color: 'text-cyan-400' },
            { id: 'VACANT', label: 'Vacant', color: 'text-slate-400' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === item.id
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={item.color || ''}>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{filteredFlats.length}</span> flats in {selectedWing?.name}
        </div>
      </div>

      {/* Interactive Flats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFlats.map((flat) => {
          const isOwnerOccupied = flat.occupancyStatus === 'OWNER_OCCUPIED';
          const isTenantOccupied = flat.occupancyStatus === 'TENANT_OCCUPIED';
          const isVacant = flat.occupancyStatus === 'VACANT';
          const activeResident = isTenantOccupied ? flat.tenantId : flat.ownerId;

          return (
            <div
              key={flat._id}
              className={`glass-card p-5 border transition-all duration-300 flex flex-col justify-between group ${
                isOwnerOccupied
                  ? 'border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-glow-emerald'
                  : isTenantOccupied
                  ? 'border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-glow-cyan'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header: Flat Number & BHK Badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">
                        {flat.flatNumber}
                      </span>
                      <span className="text-xs text-slate-500">Floor {flat.floor}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {flat.type} • {flat.areaSqFt} sq.ft
                    </span>
                  </div>

                  {/* Status Badge */}
                  {isOwnerOccupied && (
                    <span className="badge-emerald">Owner</span>
                  )}
                  {isTenantOccupied && (
                    <span className="badge-cyan">Tenant</span>
                  )}
                  {isVacant && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      Vacant
                    </span>
                  )}
                </div>

                {/* Resident Info or Vacant Slot */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  {activeResident ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate max-w-[140px]">
                          {activeResident.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ₹{flat.monthlyMaintenance}/mo
                        </span>
                      </div>
                      {activeResident.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{activeResident.phone}</span>
                        </div>
                      )}
                      {activeResident.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] truncate">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span className="truncate">{activeResident.email}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-slate-500 italic">
                      Ready for assignment • ₹{flat.monthlyMaintenance}/mo
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                {isVacant ? (
                  <button
                    onClick={() => openAssignModal(flat)}
                    className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Onboard Resident</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    <button
                      onClick={() => openAssignModal(flat)}
                      className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleUnassign(
                          flat,
                          isTenantOccupied ? 'TENANT' : 'OWNER'
                        )
                      }
                      title="Unassign resident"
                      className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 transition-colors"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Onboard / Assign Resident */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Onboard Resident to Flat ${targetFlat?.flatNumber}`}
      >
        <form onSubmit={handleAssignResident} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Tower: <b className="text-white">{selectedWing?.name}</b></span>
            <span>Unit: <b className="text-cyan-400">Flat {targetFlat?.flatNumber}</b></span>
            <span>Floor: <b className="text-white">{targetFlat?.floor}</b></span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Resident Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Deshmukh"
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
              className="w-full glass-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. priya.deshmukh@gmail.com"
              value={residentEmail}
              onChange={(e) => setResidentEmail(e.target.value)}
              className="w-full glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={residentPhone}
                onChange={(e) => setResidentPhone(e.target.value)}
                className="w-full glass-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tenancy Type</label>
              <select
                value={residentType}
                onChange={(e) => setResidentType(e.target.value)}
                className="w-full glass-input text-sm"
              >
                <option value="OWNER" className="bg-slate-900 text-white">Owner</option>
                <option value="TENANT" className="bg-slate-900 text-white">Tenant</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            A temporary password (<code className="text-cyan-400">Welcome@123</code>) will be created for the resident's portal login.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-glow-cyan"
            >
              Assign & Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
