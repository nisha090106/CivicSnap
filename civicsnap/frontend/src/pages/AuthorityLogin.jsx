import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const [step, setStep] = useState('choice'); // 'choice', 'phone_input', 'otp_input'
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await googleSignIn({
        email: `officer_${Math.floor(Math.random() * 10000)}@gov.in`,
        name: 'Municipal Officer',
        role: 'authority',
        department: department
      });
      if (res.success) {
        if (res.user.isApproved) {
          navigate(`/dashboard/authority/${encodeURIComponent(res.user.department || department)}`);
        } else {
          navigate('/dashboard/pending-approval');
        }
      }
    } catch (err) {
      setError('Google sign-in error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8">
      
      {/* Header */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between pt-4">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-indigo-500/20">
            🏛️
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">CivicSnap</span>
        </div>
        <span className="text-xs px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/30 font-semibold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Authority Portal
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="glass-card rounded-3xl p-8 shadow-2xl relative border border-slate-800">
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Official Authority Sign-In</h1>
            <p className="text-slate-400 text-xs mt-1.5">For department officers and municipal authority personnel.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Department Selection (Required for Authority Login) */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-indigo-300 mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Select Municipal Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500 text-sm cursor-pointer"
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {step === 'choice' && (
            <div className="space-y-4">
              
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-2xl font-semibold text-sm transition shadow-md disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.41l3.99-3.14z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.59l3.99 3.14c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-950 px-3 text-xs text-slate-500 font-medium uppercase tracking-wider absolute">or</span>
              </div>

              <button
                onClick={() => setStep('phone_input')}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-indigo-500/20 group"
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
                <label className="block text-xs font-semibold text-slate-300 mb-2">Officer Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-base"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send Official Verification OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep('choice')}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition"
              >
                Back to sign in options
              </button>
            </form>
          )}

          {step === 'otp_input' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              
              {generatedOtp && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Dev OTP Code: <strong className="font-mono text-white text-sm">{generatedOtp}</strong></span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Enter 6-Digit OTP Code sent to <span className="text-white">{phoneNumber}</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Submit for Approval'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone_input')}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition"
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
          className="text-xs text-slate-500 hover:text-slate-300 transition"
        >
          &larr; Back to Citizen Reporting Portal
        </Link>
      </footer>

    </div>
  );
}
