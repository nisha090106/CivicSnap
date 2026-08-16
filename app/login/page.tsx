'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Phone, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function CitizenLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    // Set cookies for citizen session
    document.cookie = 'better-auth.session_token=valid_token; path=/; max-age=86400';
    document.cookie = 'civicsnap_user_role=citizen; path=/; max-age=86400';
    router.push('/dashboard/citizen');
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setIsLoading(true);

    // Simulate sending OTP (console logging stub as per requirement)
    console.log(`========================================`);
    console.log(`[BetterAuth OTP Service]`);
    console.log(`Target Phone: ${phoneNumber}`);
    console.log(`Verification Code: 554901`);
    console.log(`========================================`);

    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 600);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      document.cookie = 'better-auth.session_token=valid_token; path=/; max-age=86400';
      document.cookie = 'civicsnap_user_role=citizen; path=/; max-age=86400';
      router.push('/dashboard/citizen');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-slate-100 tracking-tight">
          Civic<span className="text-emerald-500">Snap</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          Report potholes, garbage, water leaks, or broken lights in 10 seconds.
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Citizen Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose your preferred sign-in method to report issues.
          </p>
        </div>

        <div className="space-y-4">
          {/* Option 1: Continue with Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-650 border border-slate-600 text-slate-100 font-semibold text-sm flex items-center justify-center gap-3 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.3c0 2.8.7 5.5 1.9 7.9l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative text-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <span className="relative bg-slate-800 px-3 text-[11px] font-semibold uppercase text-slate-400">
              OR PHONE OTP
            </span>
          </div>

          {/* Option 2: Phone OTP Flow */}
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <span>{isLoading ? 'Sending OTP...' : 'Send Verification Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400">
                <span className="font-bold">Demo OTP sent to {phoneNumber}:</span> Code is <strong>554901</strong> (Check console logs).
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  placeholder="554901"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  maxLength={6}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isLoading ? 'Verifying...' : 'Verify OTP & Enter'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Small footer link to authority login as requested */}
        <div className="mt-6 pt-4 border-t border-slate-700 text-center">
          <Link 
            href="/authority/login" 
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            Municipal Staff / Authority Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
