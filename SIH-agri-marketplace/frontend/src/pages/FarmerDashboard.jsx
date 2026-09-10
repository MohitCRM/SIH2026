import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFarmerDashboardApi, submitFarmerKycApi, createCropListingApi, toggleFarmerKycApi } from '../services/api';

export default function FarmerDashboard() {
  const { user, token, reloadUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showKycWizard, setShowKycWizard] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Active crop listings
  const [cropList, setCropList] = useState([
    { id: 1, name: 'Guntur Sannam Chilli', quantity: 45, price: 18500, status: 'Ready for Dispatch' },
    { id: 2, name: 'BPT 5204 Raw Paddy', quantity: 120, price: 2320, status: 'In Cold Storage Bay' },
  ]);

  // Form for new crop
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  // KYC Submission Form State
  const [idProofType, setIdProofType] = useState('AADHAAR');
  const [idProofNumber, setIdProofNumber] = useState('8923-4512-7890');
  const [landSize, setLandSize] = useState('4.5');
  const [surveyNum, setSurveyNum] = useState('Sy. No. 142/2B');
  const [village, setVillage] = useState(user?.profile?.village || 'Kalyanapudi');
  const [district, setDistrict] = useState(user?.profile?.district || 'Guntur');
  const [state, setState] = useState(user?.profile?.state || 'Andhra Pradesh');
  const [pincode, setPincode] = useState(user?.profile?.pincode || '522001');
  const [photoUrl, setPhotoUrl] = useState(
    user?.profile?.photo_url || 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400'
  );
  const [docUrl, setDocUrl] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400');

  async function loadDashboard() {
    if (!token) return;
    try {
      const data = await getFarmerDashboardApi(token);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load farmer dashboard:', err);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [token]);

  const profile = dashboardData?.profile || user?.profile;
  const isKycVerified = profile?.is_kyc_verified || false;
  const kycStatus = profile?.kyc_status || (isKycVerified ? 'VERIFIED' : 'PENDING_SUBMISSION');

  async function handleKycSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const payload = {
        id_proof_type: idProofType,
        id_proof_number: idProofNumber,
        land_size_acres: parseFloat(landSize) || 4.5,
        survey_number: surveyNum,
        village,
        district,
        state,
        pincode,
        photo_url: photoUrl,
        kyc_document_url: docUrl,
      };

      const res = await submitFarmerKycApi(payload, token);
      setFeedback({ type: 'success', message: 'KYC documents submitted! Status is now Under Review.' });
      setShowKycWizard(false);
      await loadDashboard();
      if (reloadUser) reloadUser();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoInstantApprove() {
    if (!profile?.id) return;
    setLoading(true);
    try {
      await toggleFarmerKycApi(profile.id, token);
      setFeedback({ type: 'success', message: 'KYC status toggled directly for demo presentation!' });
      await loadDashboard();
      if (reloadUser) reloadUser();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handlePublishCrop(e) {
    e.preventDefault();
    if (!isKycVerified) {
      setFeedback({
        type: 'error',
        message: 'Action Blocked: KYC verification is mandatory before listing produce on the marketplace.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        crop_name: cropName,
        quantity_quintals: parseFloat(quantity),
        expected_price_per_qtl: parseFloat(price),
      };
      await createCropListingApi(payload, token);
      setCropList([
        ...cropList,
        { id: Date.now(), name: cropName, quantity: parseFloat(quantity), price: parseFloat(price), status: 'Active on Corridor' },
      ]);
      setCropName('');
      setQuantity('');
      setPrice('');
      setFeedback({ type: 'success', message: `Consignment for '${cropName}' is now live on the marketplace!` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      
      {/* 1. Farmer Identification & Location Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Farmer Photo */}
            <div className="relative">
              <img
                src={photoUrl}
                alt="Farmer Photo"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400';
                }}
              />
              <span className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                isKycVerified ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 'bg-amber-500'
              }`}>
                {isKycVerified ? '✓' : '⏳'}
              </span>
            </div>

            {/* Core Info & Actual Address */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  ROLE: FARMER
                </span>
                <span className="text-xs text-slate-400 font-mono">{user?.phone_number}</span>
              </div>

              <h1 className="text-2xl font-black text-white">{user?.full_name}</h1>
              
              {/* Detailed Actual Address */}
              <div className="mt-1.5 text-xs text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  📍 {profile?.village || 'Kalyanapudi Village'}
                </span>
                <span className="text-slate-500">•</span>
                <span>{profile?.district || 'Guntur'}, {profile?.state || 'Andhra Pradesh'}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-400">PIN: {profile?.pincode || '522001'}</span>
              </div>

              <p className="text-[11px] text-slate-400 mt-1">
                Farm Address: <span className="text-slate-300">{profile?.address || 'Survey No 42, Guntur Rural'}</span>
              </p>
            </div>
          </div>

          {/* KYC Status Badge & Action */}
          <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
            <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 ${
              isKycVerified
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : kycStatus === 'UNDER_REVIEW'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <span className="text-xl">
                {isKycVerified ? '🛡️' : kycStatus === 'UNDER_REVIEW' ? '📋' : '⚠️'}
              </span>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold">Government KYC Verification</div>
                <div className="text-xs font-black">
                  {isKycVerified
                    ? 'VERIFIED AGRICULTURAL SELLER'
                    : kycStatus === 'UNDER_REVIEW'
                    ? 'DOCUMENTS UNDER REVIEW'
                    : 'ACTION REQUIRED: PENDING KYC'}
                </div>
              </div>
            </div>

            {/* Post-Registration KYC Button */}
            {!isKycVerified && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowKycWizard(true)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition"
                >
                  📝 {kycStatus === 'UNDER_REVIEW' ? 'Update KYC Details' : 'Complete KYC Verification'}
                </button>
                <button
                  onClick={handleDemoInstantApprove}
                  title="Directly activate KYC for immediate demonstration"
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 transition"
                >
                  ⚡ Instant Demo Verify
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex justify-between items-center ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 2. KYC Registration Wizard Modal / Panel */}
      {showKycWizard && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase tracking-wider mb-1">
                Post-Registration Onboarding
              </div>
              <h2 className="text-xl font-black text-white">Government KYC & Land Verification Wizard</h2>
              <p className="text-xs text-slate-400 mt-1">
                Under SIH 2026 regulations, all farmers must link their ID and land records before listing crops on the marketplace.
              </p>
            </div>
            <button
              onClick={() => setShowKycWizard(false)}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleKycSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ID Proof Type</label>
                <select
                  value={idProofType}
                  onChange={(e) => setIdProofType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="AADHAAR">Aadhaar Card (UIDAI)</option>
                  <option value="KISAN_CREDIT_CARD">Kisan Credit Card (KCC)</option>
                  <option value="PATTA_PASSBOOK">Pattadar Passbook / RoR</option>
                  <option value="PM_KISAN_ID">PM-KISAN Beneficiary ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Document / ID Number</label>
                <input
                  type="text"
                  required
                  value={idProofNumber}
                  onChange={(e) => setIdProofNumber(e.target.value)}
                  placeholder="e.g. 8923-4512-7890"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Farm Landholding (Acres)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  placeholder="e.g. 4.5"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Survey / Khata Number</label>
                <input
                  type="text"
                  value={surveyNum}
                  onChange={(e) => setSurveyNum(e.target.value)}
                  placeholder="Sy. No. 142/2B"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Village Name</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Kalyanapudi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Guntur"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="522001"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Photos & Document Attachments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1">Farmer Profile Photo (URL / Upload)</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs mb-2 truncate"
                />
                <div className="flex items-center gap-3">
                  <img src={photoUrl} alt="Farmer" className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                  <span className="text-[11px] text-slate-400">Photo preview linked to biometric record</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1">Supporting Land / ID Document (URL / Scan)</label>
                <input
                  type="text"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs mb-2 truncate"
                />
                <div className="flex items-center gap-3">
                  <img src={docUrl} alt="Document" className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                  <span className="text-[11px] text-slate-400">Pattadar Passbook or Aadhaar Scan</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowKycWizard(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
              >
                {loading ? 'Submitting to Authority...' : 'Submit Documents for Verification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Marketplace Gated Selling Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Crop Consignments (Gated by KYC) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative">
            
            {/* Gating Overlay if KYC is not verified */}
            {!isKycVerified && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm rounded-3xl z-20 flex flex-col items-center justify-center p-6 text-center border-2 border-amber-500/30">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-500/20">
                  🔒
                </div>
                <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase tracking-wider mb-2">
                  Marketplace Gated Feature
                </div>
                <h3 className="text-xl font-black text-white max-w-md">
                  KYC Verification Required to Publish Crops
                </h3>
                <p className="text-xs text-slate-300 max-w-md mt-1.5 mb-5">
                  To protect buyers and ensure authentic agricultural traceability, farmers can only start publishing consignments, booking transporters, and collecting payouts after completing government KYC registration.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setShowKycWizard(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition"
                  >
                    Complete KYC Registration Now ➔
                  </button>
                  <button
                    onClick={handleDemoInstantApprove}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 transition"
                  >
                    ⚡ Instant Demo Verification
                  </button>
                </div>
              </div>
            )}

            {/* Consignments Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Live Crop Consignments</h2>
                <p className="text-xs text-slate-400">Harvest ready for regional transporter dispatch or cold storage booking</p>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {cropList.length} Listed Lots
              </span>
            </div>

            {/* Consignments List */}
            <div className="space-y-3 mb-6">
              {cropList.map((crop) => (
                <div key={crop.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>🌾 {crop.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {crop.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Volume: <span className="text-slate-200 font-semibold">{crop.quantity} Quintals</span> • Target MSP: <span className="text-emerald-400 font-semibold">₹{crop.price.toLocaleString()}/Qtl</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase">Gross Consignment Value</div>
                    <div className="text-sm font-black text-white">₹{(crop.quantity * crop.price).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Consignment Form (Only active when KYC verified) */}
            <form onSubmit={handlePublishCrop} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <span>➕</span>
                <span>Publish New Crop Lot to Marketplace (Verified Sellers Only)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Crop Name (e.g. Tomato)"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  required
                />
                <input
                  type="number"
                  placeholder="Weight in Qtl (e.g. 50)"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  required
                />
                <input
                  type="number"
                  placeholder="Price / Qtl (e.g. 2400)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition"
              >
                + Publish Consignment to Regional Transporters & Cold Hubs
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Land & Verification Checklist */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-1">Land & Identity Verification</h3>
            <p className="text-[11px] text-slate-400 mb-4">Official revenue record status under SIH 2026</p>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Total Farm Acreage</span>
                <span className="text-white font-bold">{profile?.land_size_acres ? `${profile.land_size_acres} Acres` : '4.5 Acres'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Survey / Khata No</span>
                <span className="text-white font-bold">{profile?.survey_number || 'Sy. 142/2B'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">ID Proof Type</span>
                <span className="text-emerald-400 font-bold">{profile?.id_proof_type || 'AADHAAR (UIDAI)'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Marketplace Selling</span>
                <span className={`font-bold ${isKycVerified ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isKycVerified ? 'UNLOCKED' : 'LOCKED (KYC PENDING)'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
