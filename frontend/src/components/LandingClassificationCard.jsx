import React from 'react';
import { Building2, CheckCircle2, MapPin } from 'lucide-react';

export default function LandingClassificationCard() {
  return (
    <div className="bg-pista-100 rounded-2xl p-4 sm:p-5 border border-pista-400 shadow-xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-[0_0_0_3px_rgba(22,101,52,0.12)] shrink-0" />
          <span className="text-[11px] sm:text-xs font-black text-bottle-800 uppercase tracking-wider">
            Report Preview
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-bottle-800 text-[10px] font-extrabold rounded-full border border-pista-400 whitespace-nowrap">
          <MapPin className="w-3 h-3" />
          GPS Active
        </span>
      </div>

      <div className="rounded-xl bg-[#E5F1DD] border border-pista-300 overflow-hidden">
        <img
          src="/pothole-report.png"
          alt="Large pothole on a city road"
          className="w-full h-44 sm:h-48 object-cover"
        />
        <div className="px-4 py-3 text-center">
          <p className="text-sm font-black text-bottle-900">
            Pothole Detected &amp; Categorized
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-bottle-700 font-semibold">
            Auto-routed to: Road &amp; Transport Department
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white rounded-xl border border-pista-300 shadow-xs">
          <span className="flex items-center gap-2 text-xs text-slate-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            Image Verification
          </span>
          <span className="text-[11px] font-black text-emerald-800">Passed</span>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white rounded-xl border border-pista-300 shadow-xs">
          <span className="flex items-center gap-2 text-xs text-slate-800 font-bold">
            <Building2 className="w-4 h-4 text-bottle-800 shrink-0" />
            Department Assignment
          </span>
          <span className="text-[11px] font-black text-bottle-800 text-right">
            Road &amp; Transport
          </span>
        </div>
      </div>
    </div>
  );
}
