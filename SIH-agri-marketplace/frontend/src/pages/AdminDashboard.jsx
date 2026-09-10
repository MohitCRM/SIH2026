import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminStatsApi, getAdminUsersApi, toggleFarmerKycApi, toggleUserStatusApi } from '../services/api';

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        getAdminStatsApi(token),
        getAdminUsersApi(token),
      ]);
      setStats(statsData);
      setUsersList(usersData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  async function handleKycToggle(farmerProfileId) {
    try {
      setActionLoading(`kyc-${farmerProfileId}`);
      await toggleFarmerKycApi(farmerProfileId, token);
      setFeedback('Farmer KYC status updated successfully!');
      await loadData();
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStatusToggle(userId) {
    try {
      setActionLoading(`status-${userId}`);
      await toggleUserStatusApi(userId, token);
      setFeedback('User account active status toggled!');
      await loadData();
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  const roleBadges = {
    ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    FARMER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    TRANSPORTER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    COLLECTION_CENTER: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    CONSUMER: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-slate-900 to-slate-900 border border-purple-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
              SUPERADMIN PRIVILEGE
            </span>
            <span className="text-xs text-slate-400">Department: {user?.profile?.department || 'Operations'}</span>
          </div>
          <h1 className="text-2xl font-black text-white">Platform Operations & Control Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Oversee ecosystem participants, verify farmer credentials, and govern RBAC permissions.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition"
        >
          ↻ Refresh Platform State
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registered</div>
          <div className="text-3xl font-black text-white mt-1">{stats?.total_users ?? '...'}</div>
          <div className="text-[10px] text-emerald-400 mt-1">100% active identity index</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Farmers</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">{stats?.farmers ?? '...'}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            {stats?.verified_farmers ?? 0} Verified • {stats?.pending_kyc ?? 0} Pending KYC
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Transporters</div>
          <div className="text-3xl font-black text-blue-400 mt-1">{stats?.transporters ?? '...'}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active corridor logistics</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Cold Storage Hubs</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{stats?.collection_centers ?? '...'}</div>
          <div className="text-[10px] text-slate-400 mt-1">Aggregation points</div>
        </div>
      </div>

      {/* User Governance Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Platform Participant Registry</h2>
            <p className="text-xs text-slate-400">Manage accounts and role extension profiles across the system</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Count: {usersList.length} Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Participant</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Phone (ID)</th>
                <th className="py-3 px-3">Profile Data</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {usersList.map((u) => {
                const isCurrent = u.id === user?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-white">
                      {u.full_name}
                      {isCurrent && <span className="ml-2 text-[10px] text-purple-400">(You)</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleBadges[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{u.phone_number}</td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                      {u.role === 'FARMER' && u.profile && (
                        <span>
                          {u.profile.address} • KYC:{' '}
                          <span className={u.profile.is_kyc_verified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {u.profile.is_kyc_verified ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </span>
                      )}
                      {u.role === 'TRANSPORTER' && u.profile && (
                        <span>Vehicle: {u.profile.vehicle_number} ({u.profile.max_payload_kg} kg)</span>
                      )}
                      {u.role === 'COLLECTION_CENTER' && u.profile && (
                        <span>{u.profile.center_name} ({u.profile.storage_capacity_kg} kg cap)</span>
                      )}
                      {u.role === 'CONSUMER' && u.profile && (
                        <span>{u.profile.delivery_address}</span>
                      )}
                      {u.role === 'ADMIN' && u.profile && (
                        <span className="text-purple-400">{u.profile.department}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {/* Farmer KYC verify button */}
                      {u.role === 'FARMER' && u.profile && (
                        <button
                          onClick={() => handleKycToggle(u.profile.id)}
                          disabled={actionLoading === `kyc-${u.profile.id}`}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                            u.profile.is_kyc_verified
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                          }`}
                        >
                          {u.profile.is_kyc_verified ? 'Revoke KYC' : 'Verify KYC'}
                        </button>
                      )}

                      {/* Toggle status button */}
                      {!isCurrent && (
                        <button
                          onClick={() => handleStatusToggle(u.id)}
                          disabled={actionLoading === `status-${u.id}`}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                            u.is_active
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
