import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, X, LogOut, CheckCircle2, ShieldCheck, Phone, Mail } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-pista-100 max-w-md w-full rounded-md border border-pista-400 shadow-2xl relative my-auto overflow-hidden">
        
        {/* Header — DARK BOTTLE GREEN */}
        <div className="bg-bottle-900 text-white p-6 border-b border-bottle-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-bottle-800 border border-bottle-700 flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Citizen Profile</h3>
              <p className="text-xs text-pista-300 font-extrabold">Account & Authentication Session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-white rounded-md border border-pista-400 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-bottle-800 uppercase tracking-wider">Account Type</span>
              <span className="px-2.5 py-1 bg-bottle-900 text-pista-100 border border-bottle-800 text-xs font-black rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-pista-300" /> {user?.role === 'authority' ? 'Official Officer' : 'Citizen'}
              </span>
            </div>
            <div className="border-t border-pista-300 pt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-900">
                <User className="w-4 h-4 text-bottle-800" />
                <span className="font-black">{user?.name || 'Citizen'}</span>
              </div>
              {user?.phoneNumber && (
                <div className="flex items-center gap-2 text-slate-900">
                  <Phone className="w-4 h-4 text-bottle-800" />
                  <span className="font-mono font-bold">{user.phoneNumber}</span>
                </div>
              )}
              {user?.email && (
                <div className="flex items-center gap-2 text-slate-900">
                  <Mail className="w-4 h-4 text-bottle-800" />
                  <span className="font-bold">{user.email}</span>
                </div>
              )}
              <div className="text-[11px] text-slate-600 font-mono pt-1">
                User ID: {user?.id}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full py-3.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black text-sm rounded-md transition flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-700" />
            Sign Out of CivicSnap
          </button>
        </div>

      </div>
    </div>
  );
}
