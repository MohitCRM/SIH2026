import React from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, quickSwitch, isAuthenticated } = useAuth();

  const roleColors = {
    ADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    FARMER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    TRANSPORTER: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    COLLECTION_CENTER: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    CONSUMER: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
                🌾
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white tracking-tight">Kisan<span className="text-emerald-400">Setu</span></span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    SIH 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Decentralized Agri Marketplace</p>
              </div>
            </button>
          </div>

          {/* Quick Persona Switcher Bar (Crucial for SIH Hackathon Evaluation!) */}
          <div className="hidden lg:flex items-center bg-slate-900/90 border border-slate-800 rounded-full p-1 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 px-3 uppercase tracking-wider">
              Switch Persona:
            </span>
            {Object.entries(DEMO_ACCOUNTS).map(([roleKey, acc]) => {
              const isActive = user?.role === roleKey;
              return (
                <button
                  key={roleKey}
                  onClick={() => quickSwitch(roleKey)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`${acc.label}: ${acc.name}`}
                >
                  {acc.label}
                </button>
              );
            })}
            <button
              onClick={() => quickSwitch('UNAUTHENTICATED')}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                !isAuthenticated
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
              }`}
              title="Test anonymous visitor"
            >
              Public
            </button>
          </div>

          {/* Right Action Menu: User badge, Swagger UI link, Auth action */}
          <div className="flex items-center gap-3">
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Open interactive OpenAPI Swagger documentation"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              FastAPI Docs ↗
            </a>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                  <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center font-bold text-xs text-emerald-400">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-semibold text-white leading-none truncate max-w-[120px]">{user.full_name}</p>
                    <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleColors[user.role] || 'bg-slate-700'}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('auth')}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition"
              >
                Sign In / Register
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
