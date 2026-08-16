'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AUTHORITY_DEPARTMENTS } from '../../../db/schema';
import { Building2, Shield, Phone, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthorityLoginPage() {
  const router = useRouter();
  const [selectedDept, setSelectedDept] = useState<string>(AUTHORITY_DEPARTMENTS[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isApprovedDemo, setIsApprovedDemo] = useState(false); // Default false for authority as requested

  const formatDeptSlug = (dept: string) => {
    return dept.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  };

  const handleAuthorityLogin = (approvedState: boolean) => {
    const slug = formatDeptSlug(selectedDept);
    document.cookie = 'better-auth.session_token=valid_token; path=/; max-age=86400';
    document.cookie = 'civicsnap_user_role=authority; path=/; max-age=86400';
    document.cookie = `civicsnap_user_dept=${slug}; path=/; max-age=86400`;
    document.cookie = `civicsnap_user_approved=${approvedState}; path=/; max-age=86400`;

    if (!approvedState) {
      router.push('/authority/pending');
    } else {
      router.push(`/dashboard/authority/${slug}`);
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[Authority OTP] Code sent to ${phoneNumber}: 882190`);
    setStep('otp');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold font-heading text-slate-100 tracking-tight">
          Municipal Authority Portal
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Departmental sign-in for ticket allocation, SLA resolution, and ground verification.
        </p>
      </div>

      {/* Authority Login Card */}
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="space-y-4">
          {/* Department Dropdown Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Your Authority Department
            </label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {AUTHORITY_DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Account Approval Mode Switcher (For testing approved vs pending state) */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Test Approval State:</span>
            <button
              type="button"
              onClick={() => setIsApprovedDemo(!isApprovedDemo)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                isApprovedDemo 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isApprovedDemo ? 'Approved Staff' : 'Pending Approval'}
            </button>
          </div>

          {/* Login Option 1: Continue with Google */}
          <button
            onClick={() => handleAuthorityLogin(isApprovedDemo)}
            className="w-full py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-650 border border-slate-600 text-slate-100 font-semibold text-sm flex items-center justify-center gap-3 transition-all"
          >
            <Shield className="w-5 h-5 text-amber-400" />
            <span>Sign In with Google ({selectedDept.split(' ')[0]})</span>
          </button>

          <div className="relative text-center my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <span className="relative bg-slate-800 px-3 text-[11px] font-semibold uppercase text-slate-400">
              OR PHONE OTP
            </span>
          </div>

          {/* Login Option 2: Phone OTP Flow */}
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Officer Registered Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-600/20"
              >
                <span>Send Department OTP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAuthorityLogin(isApprovedDemo);
              }} 
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter 6-Digit Department OTP
                </label>
                <input
                  type="text"
                  placeholder="882190"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  maxLength={6}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Enter Department Dashboard</span>
              </button>
            </form>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6 pt-4 border-t border-slate-700 text-center">
          <Link 
            href="/login" 
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to Citizen Login
          </Link>
        </div>
      </div>
    </div>
  );
}
