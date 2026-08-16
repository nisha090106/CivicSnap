import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { ShieldCheck, Phone, ArrowRight, Building2, Sparkles, AlertCircle } from 'lucide-react';

const DEPARTMENTS = [
  "Road & Transport",
  "Garbage & Waste Management",
  "Food & Drug Authority",
  "Forest Department",
  "Municipal Corporation",
  "Nagar Panchayat",
  "Gram Panchayat"
];

export default function AuthorityLogin() {
  const { sendOtp, verifyOtp, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [step, setStep] = useState('choice');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return setError('Please enter your phone number');
    setError('');
    setLoading(true);
    try {
      const res = await sendOtp(phoneNumber);
      if (res.success) {
        setGeneratedOtp(res.otpCode);
        setStep('otp_input');
      } else {
        setError(res.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Connection error to Auth Service');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return setError('Please enter verification code');
    setError('');
    setLoading(true);
    try {
      const res = await verifyOtp({
        phoneNumber,
        code: otpCode,
        role: 'authority',
        department: department
      });
      if (res.success) {
        if (res.user.isApproved) {
          navigate(`/dashboard/authority/${encodeURIComponent(res.user.department || department)}`);
        } else {
          navigate('/dashboard/pending-approval');
        }
      } else {
        setError(res.error || 'Invalid OTP code');
      }
    } catch (err) {
      setError('Verification error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google Sign-In failed');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await googleSignIn({
        idToken: credentialResponse.credential,
        role: 'authority',
        department: department
      });
      if (res.success) {
        if (res.user.isApproved) {
          navigate(`/dashboard/authority/${encodeURIComponent(res.user.department || department)}`);
        } else {
          navigate('/dashboard/pending-approval');
        }
      } else {
        setError(res.error || 'Google authentication failed');
      }
    } catch (err) {
      setError('Google sign-in error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/40 text-slate-900 flex flex-col justify-between p-4 md:p-8 font-sans selection:bg-emerald-200">
      
      {/* Header */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between pt-4">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-950 text-xl shadow-inner">
            🏛️
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-emerald-950">CivicSnap</span>
        </div>
        <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300 font-bold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" /> Authority Portal
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-white rounded-3xl p-8 shadow-2xl relative border border-emerald-200 space-y-6">
          
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">Official Authority Sign-In</h1>
            <p className="text-slate-600 text-xs mt-1.5 font-medium">For department officers and municipal authority personnel.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* Department Selection (Required for Authority Login) */}
          <div>
            <label className="block text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-800" />
              Select Municipal Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl text-emerald-950 font-medium focus:outline-none focus:border-emerald-800 text-sm cursor-pointer"
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {step === 'choice' && (
            <div className="space-y-4">
              
              <div className="flex justify-center w-full min-h-[44px]">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Sign-In was cancelled or failed')}
                  size="large"
                  width="340"
                  text="continue_with"
                  shape="pill"
                />
              </div>

              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-emerald-100 w-full"></div>
                <span className="bg-white px-3 text-xs text-emerald-700 font-semibold uppercase tracking-wider absolute">or</span>
              </div>

              <button
                onClick={() => setStep('phone_input')}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-emerald-900/20 group cursor-pointer"
              >
                <Phone className="w-4 h-4 text-white" />
                Continue with Phone Number
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition" />
              </button>

            </div>
          )}

          {step === 'phone_input' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-2">Officer Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl text-emerald-950 placeholder-emerald-400 focus:outline-none focus:border-emerald-800 text-base"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-emerald-900/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Sending OTP...' : 'Send Official Verification OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep('choice')}
                className="w-full py-2 text-xs text-emerald-700 hover:text-emerald-950 font-bold transition cursor-pointer"
              >
                Back to sign in options
              </button>
            </form>
          )}

          {step === 'otp_input' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              
              {generatedOtp && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 text-center font-medium flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-800" />
                  <span>Dev OTP Code: <strong className="font-mono text-emerald-950 text-sm">{generatedOtp}</strong></span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-2">
                  Enter 6-Digit OTP Code sent to <span className="text-emerald-950">{phoneNumber}</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl text-emerald-950 text-center font-mono text-xl tracking-widest focus:outline-none focus:border-emerald-800"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-emerald-900/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Submit for Approval'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone_input')}
                className="w-full py-2 text-xs text-emerald-700 hover:text-emerald-950 font-bold transition cursor-pointer"
              >
                Change Phone Number
              </button>
            </form>
          )}

        </div>
      </main>

      <footer className="max-w-md mx-auto w-full text-center pb-6">
        <Link
          to="/"
          className="text-xs text-emerald-800 hover:text-emerald-950 font-bold transition"
        >
          &larr; Back to Public Landing Page
        </Link>
      </footer>

    </div>
  );
}
