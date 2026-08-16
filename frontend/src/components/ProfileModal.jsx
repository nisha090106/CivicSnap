import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, X, LogOut, CheckCircle2, ShieldCheck, Phone, Mail } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-6 my-auto">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Citizen Profile</h3>
              <p className="text-xs text-slate-400">Account & Authentication Session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Account Type</span>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Citizen
              </span>
            </div>
            <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-semibold">{user?.name || 'Citizen'}</span>
              </div>
              {user?.phoneNumber && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="font-mono">{user.phoneNumber}</span>
                </div>
              )}
              {user?.email && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{user.email}</span>
                </div>
              )}
              <div className="text-[11px] text-slate-500 font-mono pt-1">
                User ID: {user?.id}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full py-3.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 min-h-[48px]"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            Sign Out of CivicSnap
          </button>
        </div>

      </div>
    </div>
  );
}
