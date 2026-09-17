import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  Building,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Home,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import api from '../../api/axios';

export const Register = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [residentType, setResidentType] = useState('OWNER');
  const [society, setSociety] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [selectedWingId, setSelectedWingId] = useState('');
  const [flats, setFlats] = useState([]);
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Load public registration options (Society, Wings & Flats)
  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        setOptionsLoading(true);
        const res = await api.get('/auth/registration-options');
        const blds = res.data?.data?.buildings || [];
        const soc = res.data?.data?.society || null;

        if (isMounted) {
          setSociety(soc);
          setBuildings(blds);

          if (blds.length > 0) {
            setSelectedWingId(blds[0]._id);
            const firstWingFlats = blds[0].flats || [];
            setFlats(firstWingFlats);
            if (firstWingFlats.length > 0) {
              setSelectedFlatId(firstWingFlats[0]._id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching registration options, trying fallback:', err);
        try {
          const fbRes = await api.get('/buildings/public');
          const blds = fbRes.data?.data || [];
          if (isMounted) {
            setBuildings(blds);
            if (blds.length > 0) {
              setSelectedWingId(blds[0]._id);
            }
          }
        } catch (fbErr) {
          console.error('All building endpoints failed:', fbErr);
        }
      } finally {
        if (isMounted) {
          setOptionsLoading(false);
        }
      }
    };

    fetchOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update flats whenever selected wing changes
  useEffect(() => {
    if (!selectedWingId || buildings.length === 0) return;

    const currentWing = buildings.find((b) => b._id === selectedWingId);
    if (currentWing && currentWing.flats && currentWing.flats.length > 0) {
      setFlats(currentWing.flats);
      setSelectedFlatId(currentWing.flats[0]._id);
    } else {
      // Fetch flats for this building via public endpoint if not already preloaded
      const fetchFlats = async () => {
        try {
          const res = await api.get(`/flats/public/${selectedWingId}`);
          const flts = res.data?.data || [];
          setFlats(flts);
          if (flts.length > 0) {
            setSelectedFlatId(flts[0]._id);
          } else {
            setSelectedFlatId('');
          }
        } catch (err) {
          console.error('Error fetching flats for building:', err);
        }
      };
      fetchFlats();
    }
  }, [selectedWingId, buildings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
        residentType,
        buildingId: selectedWingId,
        flatId: selectedFlatId,
      });

      if (res.data?.pendingApproval) {
        setSubmittedSuccess(true);
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedWing = buildings.find((b) => b._id === selectedWingId);
  const selectedFlat = flats.find((f) => f._id === selectedFlatId);

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center items-center px-4 py-8 md:py-12 relative overflow-hidden">
      {/* Ambient neon orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-glow-cyan mb-3">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Socio<span className="text-cyan-400">Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Resident Registration • {society?.name || 'Emerald Heights Residency'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8 shadow-2xl border border-slate-800/90 relative">
          {submittedSuccess ? (
            <div className="text-center space-y-5 py-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-glow-amber">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800/50">
                  Verification Pending
                </span>
                <h2 className="text-xl font-extrabold text-white mt-2">
                  Registration Submitted!
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Thank you, <strong>{name}</strong>! Your account for{' '}
                  <strong className="text-cyan-400">
                    Flat {selectedFlat?.flatNumber || ''} ({selectedWing?.name || ''})
                  </strong>{' '}
                  is pending verification and approval by the society administration.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 text-left space-y-1.5">
                <p className="font-semibold text-slate-200">🛡️ Community Safety Notice:</p>
                <p>
                  To protect residents, all new memberships must be verified by the estate office
                  before portal access is activated.
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-glow-cyan transition-all"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Rohit Sen"
                      className="w-full pl-10 glass-input text-sm"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rohit@example.com"
                        className="w-full pl-10 glass-input text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98888 22222"
                        className="w-full pl-10 glass-input text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 glass-input text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Ownership Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tenancy / Ownership Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setResidentType('OWNER')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        residentType === 'OWNER'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 shadow-glow-emerald'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Flat Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => setResidentType('TENANT')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        residentType === 'TENANT'
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/60 shadow-glow-cyan'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Tenant / Leasee
                    </button>
                  </div>
                </div>

                {/* Tower & Flat Selectors */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Tower / Wing *
                        </label>
                        {optionsLoading && (
                          <span className="text-[10px] text-cyan-400 animate-pulse">Loading wings...</span>
                        )}
                      </div>
                      <select
                        id="tower-wing-select"
                        required
                        disabled={optionsLoading || buildings.length === 0}
                        value={selectedWingId}
                        onChange={(e) => setSelectedWingId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {buildings.length === 0 ? (
                          <option value="">{optionsLoading ? 'Loading wings...' : 'No wings found'}</option>
                        ) : (
                          buildings.map((b) => (
                            <option key={b._id} value={b._id} className="bg-slate-900 text-white">
                              {b.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Unoccupied Flat *
                        </label>
                        {optionsLoading && (
                          <span className="text-[10px] text-cyan-400 animate-pulse">Loading flats...</span>
                        )}
                      </div>
                      <select
                        id="flat-number-select"
                        required
                        disabled={optionsLoading || flats.length === 0}
                        value={selectedFlatId}
                        onChange={(e) => setSelectedFlatId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {flats.length === 0 ? (
                          <option value="">{optionsLoading ? 'Loading flats...' : 'No unoccupied flats available'}</option>
                        ) : (
                          flats.map((f) => (
                            <option key={f._id} value={f._id} className="bg-slate-900 text-white">
                              Flat {f.flatNumber} ({f.type} · Floor {f.floor}) - Available
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Warning if no unoccupied flats in selected wing */}
                  {!optionsLoading && flats.length === 0 && (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>All flats in this wing are currently occupied. Please select another tower/wing.</span>
                    </div>
                  )}

                  {/* Selected Residence Preview Pill */}
                  {selectedWing && selectedFlat && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between text-xs animate-fadeIn">
                      <div className="flex items-center gap-2 min-w-0">
                        <Home className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-300 truncate">
                          Residence: <strong className="text-white">Flat {selectedFlat.flatNumber}</strong> ({selectedFlat.type}) in <strong className="text-emerald-400">{selectedWing.name}</strong>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-900/50 border border-emerald-700/50 text-emerald-300 shrink-0 ml-2">
                        Unoccupied · Floor {selectedFlat.floor}
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-glow-cyan flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit for Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="mt-3 text-center">
                  <p className="text-xs text-slate-400">
                    Already registered?{' '}
                    <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
                      Sign In to Account
                    </Link>
                  </p>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          SocioHub • Emerald Heights Residency
        </p>
      </div>
    </div>
  );
};
