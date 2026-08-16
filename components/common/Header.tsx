'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut, User, Sparkles, Type } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { playFeedback } from '../../lib/feedback';

interface HeaderProps {
  userRole?: string;
  userName?: string;
  departmentName?: string;
}

export default function Header({ 
  userRole = 'citizen', 
  userName = 'Aarav Sharma',
  departmentName
}: HeaderProps) {
  const router = useRouter();
  const { fontScale, setFontScale } = useAccessibility();

  const handleLogout = () => {
    playFeedback('click', 'Logging out');
    document.cookie = 'better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'civicsnap_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'civicsnap_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  const cycleTextScale = () => {
    if (fontScale === 'normal') setFontScale('large');
    else if (fontScale === 'large') setFontScale('xlarge');
    else setFontScale('normal');
    playFeedback('click', `Text size set to ${fontScale}`);
  };

  return (
    <header className="glass-panel sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between border-t-0 border-x-0">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold font-heading tracking-tight text-slate-100">
              Civic<span className="text-emerald-500">Snap</span>
            </h1>
            <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> ACCESSIBLE UI
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Municipal Issue Reporting Engine
          </p>
        </div>
      </div>

      {/* Controls & Accessibility Tools */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User-Adjustable Text Size Control (Min 48x48px Touch Target) */}
        <button
          onClick={cycleTextScale}
          className="min-w-[48px] min-h-[48px] px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-emerald-400 flex items-center justify-center gap-1 text-xs font-bold transition-colors"
          title={`Text Size: ${fontScale.toUpperCase()}`}
          aria-label="Adjust Text Size"
        >
          <Type className="w-4 h-4 text-emerald-500" />
          <span className="uppercase text-[10px] font-mono">{fontScale === 'normal' ? '1x' : fontScale === 'large' ? '1.2x' : '1.5x'}</span>
        </button>

        {/* User Persona Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            {userName.charAt(0)}
          </div>
          <div className="hidden md:flex flex-col text-left text-xs leading-tight">
            <span className="font-semibold text-slate-200">{userName}</span>
            <span className="text-[10px] text-slate-400 capitalize">
              {userRole === 'authority' ? (departmentName || 'Staff') : 'Citizen'}
            </span>
          </div>
        </div>

        {/* Icon-based Log Out Control (Min 48x48px Touch Target) */}
        <button
          onClick={handleLogout}
          className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 flex items-center justify-center transition-colors"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
