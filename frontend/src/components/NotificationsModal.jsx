import React from 'react';
import { Bell, X, Eye } from 'lucide-react';

function formatNotificationDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export default function NotificationsModal({ isOpen, onClose, reports = [] }) {
  if (!isOpen) return null;

  const acknowledgments = reports.filter((report) => report.acknowledged_at);

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-pista-100 max-w-md w-full rounded-md border border-pista-400 shadow-2xl relative my-auto overflow-hidden">
        
        {/* Header — DARK BOTTLE GREEN */}
        <div className="bg-bottle-900 text-white p-6 border-b border-bottle-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-bottle-800 border border-bottle-700 flex items-center justify-center text-white">
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

        {acknowledgments.length === 0 ? (
          <div className="p-8 py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-md bg-bottle-900 border border-bottle-800 flex items-center justify-center text-pista-300 mx-auto shadow-inner">
              <Bell className="w-7 h-7" />
            </div>
            <h4 className="font-black text-bottle-900 text-base">No New Notifications</h4>
            <p className="text-xs text-slate-700 max-w-xs mx-auto font-semibold leading-relaxed">
              Department updates for your submitted civic reports will appear here.
            </p>
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto p-4 space-y-3">
            {acknowledgments.map((report) => (
              <article
                key={report.id || report.report_id}
                className="rounded-xl border border-blue-200 bg-blue-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <Eye className="mt-0.5 h-5 w-5 shrink-0 text-blue-800" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-950">
                      Your report has been seen by {report.department || 'the department'}.
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      {report.category || 'Civic issue'} report
                    </p>
                    <time className="block text-[11px] font-semibold text-slate-600">
                      {formatNotificationDate(report.acknowledged_at)}
                    </time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
