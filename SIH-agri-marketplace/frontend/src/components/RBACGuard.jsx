import React from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';

export default function RBACGuard({ allowedRoles, children }) {
  const { user, isAuthenticated, quickSwitch } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl mx-auto mb-4">
          🔒
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Authentication Required</h3>
        <p className="text-xs text-slate-400 mb-6">
          This portal section is protected. Please authenticate or select a demo persona from the top navigation bar to explore.
        </p>
        <div className="flex justify-center gap-2">
          {allowedRoles.map((role) => (
            <button
              key={role}
              onClick={() => quickSwitch(role)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition"
            >
              Sign in as {role}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-rose-500/30 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500"></div>
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl mx-auto mb-4">
          ⛔
        </div>
        <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider mb-2">
          HTTP 403 Forbidden • Access Denied
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Role Authorization Violation</h3>
        <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">
          Your current account role <span className="font-bold text-rose-400">[{user.role}]</span> is not authorized to view this portal.
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono text-left max-w-lg mx-auto mb-6">
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-500">Current User:</span>
            <span className="text-slate-300">{user.full_name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-500">Current Role:</span>
            <span className="text-rose-400 font-bold">{user.role}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Permitted Role(s):</span>
            <span className="text-emerald-400 font-bold">{allowedRoles.join(', ')}</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 mb-3">Instant 1-Click Evaluation Switch:</div>
        <div className="flex flex-wrap justify-center gap-2">
          {allowedRoles.map((role) => (
            <button
              key={role}
              onClick={() => quickSwitch(role)}
              className="text-xs px-3.5 py-1.5 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition"
            >
              Switch to {role} Persona
            </button>
          ))}
        </div>
      </div>
    );
  }

  return children;
}
