import React, { useState } from 'react';
import Navbar from './components/Navbar';
import RBACGuard from './components/RBACGuard';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import TransporterDashboard from './pages/TransporterDashboard';
import CollectionCenterDashboard from './pages/CollectionCenterDashboard';
import BuyerMarketplace from './pages/BuyerMarketplace';
import { useAuth, DEMO_ACCOUNTS } from './context/AuthContext';

export default function App() {
  const { user, isAuthenticated, quickSwitch } = useAuth();
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' | 'admin' | 'farmer' | 'transporter' | 'collection' | 'consumer' | 'auth' | 'rbac-matrix'

  // Decide current view based on activeTab and active role
  function renderActiveView() {
    if (activeTab === 'auth') {
      return <AuthPage onAuthSuccess={() => setActiveTab('auto')} />;
    }

    // Determine target portal
    let targetPortal = activeTab;
    if (activeTab === 'auto' || activeTab === 'dashboard') {
      if (!isAuthenticated) return <AuthPage onAuthSuccess={() => setActiveTab('auto')} />;
      targetPortal = user.role.toLowerCase();
    }

    if (targetPortal === 'admin') {
      return (
        <RBACGuard allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </RBACGuard>
      );
    }

    if (targetPortal === 'farmer') {
      return (
        <RBACGuard allowedRoles={['FARMER']}>
          <FarmerDashboard />
        </RBACGuard>
      );
    }

    if (targetPortal === 'transporter') {
      return (
        <RBACGuard allowedRoles={['TRANSPORTER']}>
          <TransporterDashboard />
        </RBACGuard>
      );
    }

    if (targetPortal === 'collection' || targetPortal === 'collection_center') {
      return (
        <RBACGuard allowedRoles={['COLLECTION_CENTER']}>
          <CollectionCenterDashboard />
        </RBACGuard>
      );
    }

    if (targetPortal === 'consumer') {
      return (
        <RBACGuard allowedRoles={['CONSUMER']}>
          <BuyerMarketplace />
        </RBACGuard>
      );
    }

    if (targetPortal === 'rbac-matrix') {
      return <RBACMatrixView />;
    }

    return <FarmerDashboard />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Subnavigation Bar: Portal Explorer */}
      <div className="bg-slate-900/60 border-b border-slate-800 py-2.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-400 font-semibold uppercase tracking-wider mr-2 text-[10px]">
              Portals:
            </span>
            {[
              { id: 'auto', label: 'My Role Portal' },
              { id: 'admin', label: '👑 Admin Control', role: 'ADMIN' },
              { id: 'farmer', label: '🌾 Farmer', role: 'FARMER' },
              { id: 'transporter', label: '🚛 Transporter', role: 'TRANSPORTER' },
              { id: 'collection', label: '🏭 Cold Storage Hub', role: 'COLLECTION_CENTER' },
              { id: 'consumer', label: '🛒 Buyer Market', role: 'CONSUMER' },
              { id: 'rbac-matrix', label: '⚡ RBAC Live Matrix' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Backend: <span className="text-emerald-400 font-bold">FastAPI + PostgreSQL (Port 8000)</span>
          </div>
        </div>
      </div>

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Smart India Hackathon (SIH) 2026 • Agricultural Marketplace Architecture</p>
        <p className="mt-1 text-[11px] text-slate-600">
          FastAPI • SQLAlchemy 2.0 • PostgreSQL Native UUIDs • Passlib Bcrypt • HS256 JWT RBAC
        </p>
      </footer>
    </div>
  );
}

// Live RBAC Matrix Viewer Component
function RBACMatrixView() {
  const { user, quickSwitch } = useAuth();

  const permissions = [
    { endpoint: 'POST /auth/register', method: 'POST', desc: 'Atomic multi-role user & profile creation', roles: ['PUBLIC', 'ALL'] },
    { endpoint: 'POST /auth/login', method: 'POST', desc: 'OAuth2 password authentication & JWT issuance', roles: ['PUBLIC', 'ALL'] },
    { endpoint: 'GET /auth/me', method: 'GET', desc: 'Authenticated profile inspection & dynamic schema', roles: ['ADMIN', 'FARMER', 'TRANSPORTER', 'COLLECTION_CENTER', 'CONSUMER'] },
    { endpoint: 'GET /auth/farmer/dashboard', method: 'GET', desc: 'Advisory insights & harvest MSP metrics', roles: ['FARMER'] },
    { endpoint: 'GET /auth/transporter/fleet', method: 'GET', desc: 'Active logistics load requests & axle capacities', roles: ['TRANSPORTER'] },
    { endpoint: 'GET /auth/logistics/overview', method: 'GET', desc: 'Multi-role aggregation corridor dispatch', roles: ['TRANSPORTER', 'COLLECTION_CENTER'] },
    { endpoint: 'GET /auth/admin/stats', method: 'GET', desc: 'Platform-wide telemetry, user & KYC metrics', roles: ['ADMIN'] },
    { endpoint: 'GET /auth/admin/users', method: 'GET', desc: 'Full registry of all participant accounts', roles: ['ADMIN'] },
    { endpoint: 'PATCH /auth/admin/farmers/{id}/verify-kyc', method: 'PATCH', desc: 'Approve or revoke farmer government KYC credentials', roles: ['ADMIN'] },
    { endpoint: 'PATCH /auth/admin/users/{id}/toggle-status', method: 'PATCH', desc: 'Activate or suspend accounts in real-time', roles: ['ADMIN'] },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <h1 className="text-2xl font-black text-white">Live Role-Based Access Control (RBAC) Matrix</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete permission audit table showing HTTP status outcomes based on current user role vs endpoint requirements.
        </p>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Method & Endpoint</th>
              <th className="py-3 px-3">Purpose</th>
              <th className="py-3 px-3">Authorized Roles</th>
              <th className="py-3 px-3 text-right">Access for Current Role ({user?.role || 'ANON'})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {permissions.map((p, idx) => {
              const isAllowed = p.roles.includes('PUBLIC') || p.roles.includes('ALL') || (user && p.roles.includes(user.role));
              return (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-bold text-white">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] mr-2 ${
                      p.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                      p.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {p.method}
                    </span>
                    {p.endpoint}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300">{p.desc}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {p.roles.map((r) => (
                        <span key={r} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isAllowed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {isAllowed ? 'HTTP 200 PERMITTED' : 'HTTP 403 FORBIDDEN'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
