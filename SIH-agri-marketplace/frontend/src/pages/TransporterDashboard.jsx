import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLogisticsOverviewApi } from '../services/api';

export default function TransporterDashboard() {
  const { user, token } = useAuth();
  const [isAvailable, setIsAvailable] = useState(user?.profile?.is_available ?? true);
  const [corridorData, setCorridorData] = useState(null);

  useEffect(() => {
    if (token) {
      getLogisticsOverviewApi(token)
        .then(setCorridorData)
        .catch(console.error);
    }
  }, [token]);

  const trips = [
    { id: 'TRIP-801', origin: 'Guntur Rural (Patel Farms)', destination: 'Godavari Cold Storage', cargo: 'Chilli • 45 Qtl', pay: '₹7,800', status: 'Ready for Pickup' },
    { id: 'TRIP-802', origin: 'Tenali Mandi Hub', destination: 'Vijayawada Aggregation Yard', cargo: 'Paddy • 70 Qtl', pay: '₹11,200', status: 'Scheduled' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              ROLE: TRANSPORTER
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Vehicle: {user?.profile?.vehicle_number || 'AP 07 TJ 8888'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Logistics & Fleet Dispatch Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Optimized routing and load aggregation connecting farmers directly to storage hubs.
          </p>
        </div>

        {/* Dynamic Availability Toggle */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Dispatch Status</div>
            <div className={`text-xs font-black ${isAvailable ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isAvailable ? 'READY FOR LOADS' : 'OFFLINE / EN ROUTE'}
            </div>
          </div>
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`w-12 h-7 rounded-full transition-colors relative p-1 focus:outline-none ${
              isAvailable ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              isAvailable ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Vehicle Specs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Fleet Unit</div>
          <div className="text-xl font-bold font-mono text-white mt-1">{user?.profile?.vehicle_number || 'AP 07 TJ 8888'}</div>
          <div className="text-[10px] text-blue-400 mt-0.5">Heavy Duty Commercial E-Transit</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Max Payload Capacity</div>
          <div className="text-xl font-bold text-white mt-1">{user?.profile?.max_payload_kg || 7500} KG</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Certified axle weight allowance</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Multi-Role RBAC Corridor</div>
          <div className="text-xs font-bold text-emerald-400 mt-2">
            {corridorData?.message || 'Access Granted: Transporter & Collection Center Corridor'}
          </div>
        </div>
      </div>

      {/* Available Loads */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Available Harvest Pickup Corridors</h2>
            <p className="text-xs text-slate-400">Direct bookings from verified farmers in your coverage sector</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Radius: 50 KM</span>
        </div>

        <div className="space-y-3">
          {trips.map((t) => (
            <div key={t.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400">{t.id}</span>
                  <span className="text-xs font-semibold text-white">{t.cargo}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>📍 {t.origin}</span>
                  <span>➔</span>
                  <span>🏭 {t.destination}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Freight Payout</div>
                  <div className="text-sm font-black text-emerald-400">{t.pay}</div>
                </div>
                <button className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition">
                  Accept Load
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
