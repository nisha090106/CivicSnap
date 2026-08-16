'use client';

import React from 'react';
import { Camera, FileText, Map as MapIcon, User, Home } from 'lucide-react';
import { playFeedback } from '../../lib/feedback';

interface BottomNavProps {
  activeTab: 'reports' | 'map' | 'profile';
  setActiveTab: (tab: 'reports' | 'map' | 'profile') => void;
  onOpenReportModal: () => void;
  reportsCount?: number;
}

export default function BottomNav({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  reportsCount = 0,
}: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 sm:hidden flex items-center justify-around">
      {/* 1. Reports Tab (Min 48x48px Touch Target) */}
      <button
        onClick={() => {
          playFeedback('click', 'My Reports');
          setActiveTab('reports');
        }}
        className={`min-w-[56px] min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all ${
          activeTab === 'reports' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
        aria-label="My Reports"
      >
        <div className="relative">
          <FileText className="w-6 h-6" />
          {reportsCount > 0 && (
            <span className="absolute -top-1 -right-2 text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500 text-slate-950 rounded-full">
              {reportsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Reports</span>
      </button>

      {/* 2. CENTER CORE ACTION: Large Camera Button (Min 56x56px Thumb Target) */}
      <button
        onClick={() => {
          playFeedback('success', 'Opening camera issue report');
          onOpenReportModal();
        }}
        className="w-14 h-14 -mt-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-slate-950 flex flex-col items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-95 transition-transform"
        aria-label="Report Issue"
      >
        <Camera className="w-7 h-7 text-white" />
      </button>

      {/* 3. Community Map Tab (Min 48x48px Touch Target) */}
      <button
        onClick={() => {
          playFeedback('click', 'Community Map');
          setActiveTab('map');
        }}
        className={`min-w-[56px] min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all ${
          activeTab === 'map' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
        aria-label="Community Map"
      >
        <MapIcon className="w-6 h-6" />
        <span className="text-[10px] mt-0.5">Map</span>
      </button>

      {/* 4. Profile & Settings Tab (Min 48x48px Touch Target) */}
      <button
        onClick={() => {
          playFeedback('click', 'Profile');
          setActiveTab('profile');
        }}
        className={`min-w-[56px] min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all ${
          activeTab === 'profile' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
        aria-label="Profile and Settings"
      >
        <User className="w-6 h-6" />
        <span className="text-[10px] mt-0.5">Profile</span>
      </button>
    </nav>
  );
}
