import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Grid,
  ShieldCheck,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Home,
  DoorOpen,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [societyData, setSocietyData] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states for quick additions
  const [isAddWingOpen, setIsAddWingOpen] = useState(false);
  const [isAddFlatOpen, setIsAddFlatOpen] = useState(false);
  const [newWingName, setNewWingName] = useState('');
  const [newWingCode, setNewWingCode] = useState('');
  const [newWingFloors, setNewWingFloors] = useState(10);

  const [selectedWingId, setSelectedWingId] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [flatFloor, setFlatFloor] = useState(1);
  const [flatType, setFlatType] = useState('2BHK');
  const [maintenanceAmt, setMaintenanceAmt] = useState(3500);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [socRes, bldRes] = await Promise.all([
        api.get('/society'),
        api.get('/buildings'),
      ]);
      setSocietyData(socRes.data?.data || null);
      setBuildings(bldRes.data?.data || []);
      if (bldRes.data?.data?.length > 0 && !selectedWingId) {
        setSelectedWingId(bldRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWing = async (e) => {
    e.preventDefault();
    try {
      await api.post('/buildings', {
        name: newWingName,
        code: newWingCode || newWingName.charAt(0).toUpperCase(),
        totalFloors: Number(newWingFloors),
      });
      setIsAddWingOpen(false);
      setNewWingName('');
      setNewWingCode('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating wing');
    }
  };

  const handleCreateFlat = async (e) => {
    e.preventDefault();
    try {
      await api.post('/flats', {
        buildingId: selectedWingId,
        flatNumber,
        floor: Number(flatFloor),
        type: flatType,
        monthlyMaintenance: Number(maintenanceAmt),
      });
      setIsAddFlatOpen(false);
      setFlatNumber('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding flat');
    }
  };

  const stats = societyData?.stats || {
    totalWings: 0,
    totalFlats: 0,
    occupiedFlats: 0,
    vacantFlats: 0,
    occupancyRate: 0,
    totalResidents: 0,
    totalStaff: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Admin Overview
            </h1>
            <span className="badge-cyan">Society Central</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, {user?.name}. Managing {societyData?.society?.name || 'Emerald Heights Residency'}.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/billing')}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition-colors shadow-glow-emerald"
          >
            <span>Cash & Billing Desk</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAddWingOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Add Wing</span>
          </button>
          <button
            onClick={() => setIsAddFlatOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-glow-cyan flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Flat</span>
          </button>
        </div>
      </div>

      {/* 3 Neon Accent Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Flats"
          value={stats.totalFlats}
          subtitle={`${stats.vacantFlats} units currently vacant`}
          icon={Grid}
          accentColor="cyan"
          trend={{ label: 'Wings active', value: `${stats.totalWings} Towers`, isPositive: true }}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          subtitle={`${stats.occupiedFlats} occupied homes`}
          icon={Home}
          accentColor="emerald"
          trend={{ label: 'Target', value: '95% Full', isPositive: true }}
        />
        <StatCard
          title="Active Residents"
          value={stats.totalResidents}
          subtitle="Owners & verified tenants"
          icon={Users}
          accentColor="fuchsia"
          trend={{ label: 'Status', value: '100% KYC verified', isPositive: true }}
        />
      </div>

      {/* Towers & Wings Detailed Progress Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Residential Towers & Wings</span>
              <span className="text-xs text-slate-400 font-normal">
                ({buildings.length} Registered)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time occupancy and capacity breakdown per wing
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/wings')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Interactive Floor Grid</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buildings.map((wing) => (
            <div
              key={wing._id}
              className="glass-card p-6 border border-slate-800/80 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center text-cyan-400 font-black text-lg">
                    {wing.code || wing.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {wing.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {wing.totalFloors} Floors • {wing.flatsPerFloor} Flats/Floor
                    </p>
                  </div>
                </div>

                <span className="badge-cyan">
                  {wing.occupancyRate}% Full
                </span>
              </div>

              {/* Occupancy bar */}
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Occupancy Progress</span>
                  <span className="text-white font-medium">
                    {wing.occupiedFlats} of {wing.totalFlats} Flats
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${wing.occupancyRate}%` }}
                  />
                </div>
              </div>

              {/* Bottom stats & Manage button */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{wing.occupiedFlats} Occupied</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    <span>{wing.vacantFlats} Vacant</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/admin/wings?wingId=${wing._id}`)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-white transition-colors flex items-center gap-1"
                >
                  <span>View Flats</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Society Quick Settings / Information Banner */}
      <div className="glass-card p-6 border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Society Administrative Profile</h3>
            <p className="text-xs text-slate-400">
              Registered Address: {societyData?.society?.address?.street}, {societyData?.society?.address?.city}, {societyData?.society?.address?.state} - {societyData?.society?.address?.pincode}
            </p>
            <p className="text-xs text-slate-500">
              Registration No: {societyData?.society?.registrationNumber || 'MAH/PUN/SOC/2022/4491'} • Maintenance Due Day: {societyData?.society?.settings?.maintenanceDueDay || 5}th of every month
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Phase 1 DB Initialized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Wing */}
      <Modal isOpen={isAddWingOpen} onClose={() => setIsAddWingOpen(false)} title="Register New Tower / Wing">
        <form onSubmit={handleCreateWing} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Wing Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Wing C - Carnation"
              value={newWingName}
              onChange={(e) => setNewWingName(e.target.value)}
              className="w-full glass-input text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Wing Code</label>
              <input
                type="text"
                placeholder="e.g. C"
                value={newWingCode}
                onChange={(e) => setNewWingCode(e.target.value.toUpperCase())}
                className="w-full glass-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Total Floors</label>
              <input
                type="number"
                min="1"
                max="50"
                value={newWingFloors}
                onChange={(e) => setNewWingFloors(e.target.value)}
                className="w-full glass-input text-sm"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddWingOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
            >
              Create Wing
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Flat */}
      <Modal isOpen={isAddFlatOpen} onClose={() => setIsAddFlatOpen(false)} title="Add Flat to Wing">
        <form onSubmit={handleCreateFlat} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Wing</label>
            <select
              value={selectedWingId}
              onChange={(e) => setSelectedWingId(e.target.value)}
              className="w-full glass-input text-sm"
            >
              {buildings.map((b) => (
                <option key={b._id} value={b._id} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Flat Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 302"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                className="w-full glass-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Floor</label>
              <input
                type="number"
                min="0"
                value={flatFloor}
                onChange={(e) => setFlatFloor(e.target.value)}
                className="w-full glass-input text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Type</label>
              <select
                value={flatType}
                onChange={(e) => setFlatType(e.target.value)}
                className="w-full glass-input text-sm"
              >
                <option value="1BHK" className="bg-slate-900 text-white">1 BHK</option>
                <option value="2BHK" className="bg-slate-900 text-white">2 BHK</option>
                <option value="3BHK" className="bg-slate-900 text-white">3 BHK</option>
                <option value="4BHK" className="bg-slate-900 text-white">4 BHK</option>
                <option value="PENTHOUSE" className="bg-slate-900 text-white">Penthouse</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Maintenance (₹/mo)</label>
              <input
                type="number"
                value={maintenanceAmt}
                onChange={(e) => setMaintenanceAmt(e.target.value)}
                className="w-full glass-input text-sm"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddFlatOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
            >
              Add Flat
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
