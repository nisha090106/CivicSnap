import React from 'react';
import { Bell, X, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function NotificationsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-pista-100 max-w-md w-full rounded-3xl border border-pista-400 shadow-2xl relative my-auto overflow-hidden">
        
        {/* Header — DARK BOTTLE GREEN */}
        <div className="bg-bottle-900 text-white p-6 border-b border-bottle-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-bottle-800 border border-bottle-700 flex items-center justify-center text-white">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Notifications</h3>
              <p className="text-xs text-pista-300 font-extrabold">CivicSnap Alerts & Status Updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Empty Notifications State */}
        <div className="p-8 py-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-bottle-900 border border-bottle-800 flex items-center justify-center text-pista-300 mx-auto shadow-inner">
            <Bell className="w-7 h-7" />
          </div>
          <h4 className="font-black text-bottle-900 text-base">No New Notifications</h4>
          <p className="text-xs text-slate-700 max-w-xs mx-auto font-semibold leading-relaxed">
            Status updates for your submitted civic reports and department resolution progress will appear here.
          </p>
        </div>

      </div>
    </div>
  );
}
