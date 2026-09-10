import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { registerApi } from '../services/api';

export default function AuthPage({ onAuthSuccess }) {
  const { login, quickSwitch } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Login form state
  const [loginPhone, setLoginPhone] = useState('+919999999999');
  const [loginPassword, setLoginPassword] = useState('AdminPass123!');

  // Registration form state
  const [regRole, setRegRole] = useState('FARMER');
  const [regPhone, setRegPhone] = useState('+91');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Role Profile states
  const [farmerAddress, setFarmerAddress] = useState('Survey No 42, Guntur Rural');
  const [farmerVillage, setFarmerVillage] = useState('Kalyanapudi');
  const [farmerDistrict, setDistrict] = useState('Guntur');
  const [farmerState, setFarmerState] = useState('Andhra Pradesh');
  const [farmerPincode, setFarmerPincode] = useState('522001');
  const [farmerPhoto, setFarmerPhoto] = useState('https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400');
  const [transporterVehicle, setTransporterVehicle] = useState('AP 07 TJ 1234');
  const [transporterPayload, setTransporterPayload] = useState('5000');
  const [centerName, setCenterName] = useState('Godavari Agri Hub');
  const [centerAddress, setCenterAddress] = useState('NH-16, Rajahmundry');
  const [centerCapacity, setCenterCapacity] = useState('25000');
  const [consumerAddress, setConsumerAddress] = useState('Plot 42, Jubilee Hills, Hyderabad');
  const [adminDept, setAdminDept] = useState('Platform Operations');

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(loginPhone, loginPassword);
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const payload = {
        phone_number: regPhone,
        password: regPassword,
        full_name: regFullName,
        role: regRole,
      };

      if (regRole === 'FARMER') {
        payload.farmer_profile = {
          address: farmerAddress,
          village: farmerVillage,
          district: farmerDistrict,
          state: farmerState,
          pincode: farmerPincode,
          photo_url: farmerPhoto,
          is_kyc_verified: false,
          kyc_status: 'PENDING_SUBMISSION',
        };
      } else if (regRole === 'TRANSPORTER') {
        payload.transporter_profile = {
          vehicle_number: transporterVehicle,
          max_payload_kg: parseFloat(transporterPayload) || 5000,
          is_available: true,
        };
      } else if (regRole === 'COLLECTION_CENTER') {
        payload.collection_center_profile = {
          center_name: centerName,
          address: centerAddress,
          storage_capacity_kg: parseFloat(centerCapacity) || 20000,
        };
      } else if (regRole === 'CONSUMER') {
        payload.consumer_profile = {
          delivery_address: consumerAddress,
        };
      } else if (regRole === 'ADMIN') {
        payload.admin_profile = {
          department: adminDept,
          access_level: 'SUPERADMIN',
        };
      }

      await registerApi(payload);
      setSuccessMsg('Account and profile successfully created! Logging you in...');
      await login(regPhone, regPassword);
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredentials(acc) {
    setLoginPhone(acc.phone);
    setLoginPassword(acc.pass);
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 mb-8 max-w-xs mx-auto">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In (OAuth2)
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Account
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <span className="text-base">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
            <span className="text-base">✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'login' ? (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight">Welcome Back</h2>
              <p className="text-xs text-slate-400 mt-1">Authenticate using your registered primary phone number</p>
            </div>

            {/* Quick Fill Demo Accounts */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                ⚡ Instant Hackathon Demo Login (Click to Autfill):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(DEMO_ACCOUNTS).map(([key, acc]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => fillDemoCredentials(acc)}
                    className="p-2 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 text-left transition-all text-xs"
                  >
                    <div className="font-bold text-white text-[11px]">{acc.label}</div>
                    <div className="text-[10px] text-emerald-400">{acc.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Username)</label>
                <input
                  type="text"
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all mt-2"
              >
                {loading ? 'Verifying Credentials...' : 'Sign In via OAuth2'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight">Create Marketplace Account</h2>
              <p className="text-xs text-slate-400 mt-1">Multi-role atomic registration with 1-to-1 extension profile</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Role Persona</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['FARMER', 'TRANSPORTER', 'COLLECTION_CENTER', 'CONSUMER', 'ADMIN'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRegRole(role)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                        regRole === role
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Account Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Login ID)</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              {/* Dynamic 1-to-1 Profile Form Fields */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mt-4">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Role Extension Profile ({regRole})
                </div>

                {regRole === 'FARMER' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Farm / Revenue Address</label>
                      <input
                        type="text"
                        required
                        value={farmerAddress}
                        onChange={(e) => setFarmerAddress(e.target.value)}
                        placeholder="Survey No, Field location, Rural post"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Village</label>
                        <input
                          type="text"
                          required
                          value={farmerVillage}
                          onChange={(e) => setFarmerVillage(e.target.value)}
                          placeholder="Village"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">District</label>
                        <input
                          type="text"
                          required
                          value={farmerDistrict}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="District"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={farmerState}
                          onChange={(e) => setFarmerState(e.target.value)}
                          placeholder="State"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">PIN Code</label>
                        <input
                          type="text"
                          required
                          value={farmerPincode}
                          onChange={(e) => setFarmerPincode(e.target.value)}
                          placeholder="522001"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Farmer Photo URL</label>
                      <div className="flex items-center gap-3">
                        <img
                          src={farmerPhoto}
                          alt="Farmer Preview"
                          className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40"
                        />
                        <input
                          type="text"
                          value={farmerPhoto}
                          onChange={(e) => setFarmerPhoto(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {regRole === 'TRANSPORTER' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Vehicle Plate Number</label>
                      <input
                        type="text"
                        required
                        value={transporterVehicle}
                        onChange={(e) => setTransporterVehicle(e.target.value)}
                        placeholder="AP 07 TJ 1234"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Payload Capacity (KG)</label>
                      <input
                        type="number"
                        required
                        value={transporterPayload}
                        onChange={(e) => setTransporterPayload(e.target.value)}
                        placeholder="5000"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {regRole === 'COLLECTION_CENTER' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">Facility Name</label>
                        <input
                          type="text"
                          required
                          value={centerName}
                          onChange={(e) => setCenterName(e.target.value)}
                          placeholder="Godavari Hub"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">Storage Capacity (KG)</label>
                        <input
                          type="number"
                          required
                          value={centerCapacity}
                          onChange={(e) => setCenterCapacity(e.target.value)}
                          placeholder="25000"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Facility Address</label>
                      <input
                        type="text"
                        required
                        value={centerAddress}
                        onChange={(e) => setCenterAddress(e.target.value)}
                        placeholder="NH-16, Rajahmundry"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {regRole === 'CONSUMER' && (
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Default Delivery Address</label>
                    <input
                      type="text"
                      required
                      value={consumerAddress}
                      onChange={(e) => setConsumerAddress(e.target.value)}
                      placeholder="Street, City, Postal Code"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                )}

                {regRole === 'ADMIN' && (
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Administrative Department</label>
                    <input
                      type="text"
                      required
                      value={adminDept}
                      onChange={(e) => setAdminDept(e.target.value)}
                      placeholder="e.g. SIH 2026 Core Team"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all mt-2"
              >
                {loading ? 'Creating Account & Profile...' : 'Complete Registration'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
