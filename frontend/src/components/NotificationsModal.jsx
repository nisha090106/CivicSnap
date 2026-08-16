import React from 'react';
import { Bell, X, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function NotificationsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl border border-emerald-200 p-6 shadow-2xl space-y-6 my-auto">
        
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-emerald-950">Notifications</h3>
              <p className="text-xs text-emerald-700 font-medium">CivicSnap Alerts & Status Updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 transition cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Empty Notifications State */}
        <div className="py-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 mx-auto">
            <Bell className="w-7 h-7" />
          </div>
          <h4 className="font-extrabold text-emerald-950 text-base">No New Notifications</h4>
          <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium leading-relaxed">
            Status updates for your submitted civic reports and department resolution progress will appear here.
          </p>
        </div>

      </div>
    </div>
  );
}
