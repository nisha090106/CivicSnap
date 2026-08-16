import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, X, LogOut, CheckCircle2, ShieldCheck, Phone, Mail } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl border border-emerald-200 p-6 shadow-2xl space-y-6 my-auto">
        
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-emerald-950">Citizen Profile</h3>
              <p className="text-xs text-emerald-700 font-medium">Account & Authentication Session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 transition cursor-pointer"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Account Type</span>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" /> {user?.role === 'authority' ? 'Official Officer' : 'Citizen'}
              </span>
            </div>
            <div className="border-t border-emerald-200/80 pt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800">
                <User className="w-4 h-4 text-emerald-800" />
                <span className="font-bold">{user?.name || 'Citizen'}</span>
              </div>
              {user?.phoneNumber && (
                <div className="flex items-center gap-2 text-slate-800">
                  <Phone className="w-4 h-4 text-emerald-800" />
                  <span className="font-mono font-medium">{user.phoneNumber}</span>
                </div>
              )}
              {user?.email && (
                <div className="flex items-center gap-2 text-slate-800">
                  <Mail className="w-4 h-4 text-emerald-800" />
                  <span className="font-medium">{user.email}</span>
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
            className="w-full py-3.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-700" />
            Sign Out of CivicSnap
          </button>
        </div>

      </div>
    </div>
  );
}
