'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, ShieldAlert, LogOut, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AuthorityPendingPage() {
  const router = useRouter();

  const handleApproveAccount = () => {
    // Flip approval state cookie for testing as requested
    document.cookie = 'civicsnap_user_approved=true; path=/; max-age=86400';
    const dept = 'road-and-transport-authority';
    router.push(`/dashboard/authority/${dept}`);
  };

  const handleLogout = () => {
    document.cookie = 'better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'civicsnap_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold font-heading text-slate-100 mb-2">
          Account Pending Approval
        </h2>

        <p className="text-sm text-slate-400 mb-6">
          Your authority staff account has been created with <code className="text-amber-400 font-mono text-xs">isApproved: false</code>. A municipal super administrator must verify your credentials before department access is granted.
        </p>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 text-left space-y-2 text-xs mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">Role:</span>
            <span className="font-semibold text-slate-200">Municipal Authority</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Approval Status:</span>
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending Verification
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Default Rule:</span>
            <span className="text-slate-300">Prevent self-declared authority signups</span>
          </div>
        </div>

        {/* Demo Quick Approval button as specified in prompt ("A manual DB flag flip or small seed script is enough for today") */}
        <div className="space-y-3">
          <button
            onClick={handleApproveAccount}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simulate DB Approval Flag Flip (isApproved: true)</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-650 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out to Login Page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
