import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function CollectionCenterDashboard() {
  const { user } = useAuth();

  const totalCap = user?.profile?.storage_capacity_kg || 25000;
  const currentUtilized = 14200;
  const percentage = Math.round((currentUtilized / totalCap) * 100);

  const inventory = [
    { crop: 'Grade-A Sannam Chilli', weight: '6,400 KG', temp: '4°C Controlled', chamber: 'Bay-02', status: 'Preserved' },
    { crop: 'BPT 5204 Raw Paddy', weight: '7,800 KG', temp: 'Ambient Dry', chamber: 'Silo-01', status: 'Ready for Mill' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ROLE: COLLECTION & COLD STORAGE HUB
            </span>
            <span className="text-xs text-slate-400">{user?.profile?.address || 'NH-16, Rajahmundry'}</span>
          </div>
          <h1 className="text-2xl font-black text-white">{user?.profile?.center_name || 'Godavari Central Cold Storage'}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Regional aggregation node providing cold chain preservation, batch testing, and bulk dispatch.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-right">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Rated Capacity</div>
          <div className="text-lg font-black text-amber-400">{totalCap.toLocaleString()} KG</div>
        </div>
      </div>

      {/* Storage Capacity Gauge */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-base font-bold text-white">Facility Capacity Utilization</h2>
            <p className="text-xs text-slate-400">Current holdings across cold storage chambers and grain silos</p>
          </div>
          <div className="text-right font-mono">
            <span className="text-xl font-black text-amber-400">{currentUtilized.toLocaleString()}</span>
            <span className="text-xs text-slate-400"> / {totalCap.toLocaleString()} KG ({percentage}%)</span>
          </div>
        </div>

        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-1000"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Occupied Volume</div>
            <div className="text-sm font-black text-white mt-0.5">14.2 Tonnes</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Headroom Available</div>
            <div className="text-sm font-black text-emerald-400 mt-0.5">10.8 Tonnes</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Chamber Temperature</div>
            <div className="text-sm font-black text-blue-400 mt-0.5">3.8°C Regulated</div>
          </div>
        </div>
      </div>

      {/* Vaulted Inventory Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-1">Stock On Hand</h2>
        <p className="text-xs text-slate-400 mb-4">Batches deposited by regional farmers awaiting marketplace fulfillment</p>

        <div className="divide-y divide-slate-800/80">
          {inventory.map((item, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <div className="font-bold text-white text-xs">{item.crop}</div>
                <div className="text-[11px] text-slate-400">{item.weight} • Chamber: {item.chamber}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-mono">
                  {item.temp}
                </span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
