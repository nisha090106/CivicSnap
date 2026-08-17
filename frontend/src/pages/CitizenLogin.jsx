import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Phone, ArrowRight, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

export default function CitizenLogin() {
  const { sendOtp, verifyOtp, googleSignIn } = useAuth();
  const navigate = useNavigate();

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
      setError('Connection error. Is Auth Service running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return setError('Please enter the verification code');
    setError('');
    setLoading(true);
    try {
      const res = await verifyOtp({
        phoneNumber,
        code: otpCode,
        role: 'citizen'
      });
      if (res.success) {
        navigate('/dashboard/citizen');
      } else {
        setError(res.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Verification failed. Try again.');
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
        role: 'citizen'
      });
      if (res.success) {
        navigate('/dashboard/citizen');
      } else {
        setError(res.error || 'Google authentication failed');
      }
    } catch (err) {
      setError('Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pista-200 text-slate-900 flex flex-col justify-between p-4 md:p-8 font-sans selection:bg-pista-300">
      
      {/* Header Branding — DARK GREEN */}
      <header className="max-w-md mx-auto w-full bg-bottle-900 border border-bottle-800 rounded-2xl p-3 flex items-center justify-between shadow-md text-white">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-bottle-800 border border-bottle-700 flex items-center justify-center font-bold text-white text-xl shadow-inner">
            📸
          </div>
          <span className="text-2xl font-black tracking-tight text-white">CivicSnap</span>
        </div>
        <span className="text-xs px-3 py-1 bg-bottle-800 text-pista-100 border border-bottle-700 rounded-full font-extrabold">
          Citizen Portal
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-pista-100 rounded-3xl p-8 shadow-2xl relative border border-pista-400 space-y-6">
          
          <div className="text-center">
            <h1 className="text-3xl font-black text-bottle-900 tracking-tight">Report Civic Issues</h1>
            <p className="text-slate-800 text-sm mt-2 font-semibold">Sign in to report potholes, garbage, water leaks, and streetlight failures.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          {step === 'choice' && (
            <div className="space-y-4">
              
              {/* Real Google OAuth Button */}
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
                <div className="border-t border-pista-300 w-full"></div>
                <span className="bg-pista-100 px-3 text-xs text-bottle-800 font-extrabold uppercase tracking-wider absolute">or</span>
              </div>

              {/* Phone Login Button — DARK BOTTLE GREEN */}
              <button
                onClick={() => setStep('phone_input')}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-base rounded-2xl transition shadow-lg shadow-bottle-950/30 group cursor-pointer border border-bottle-700"
              >
                <Phone className="w-5 h-5 text-white" />
                Continue with Phone Number
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition" />
              </button>

            </div>
          )}

          {step === 'phone_input' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-bottle-800 mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-pista-400 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-bottle-800 text-base font-semibold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-base rounded-2xl transition shadow-lg shadow-bottle-950/30 disabled:opacity-50 cursor-pointer border border-bottle-700"
              >
                {loading ? 'Sending OTP...' : 'Send Verification OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep('choice')}
                className="w-full py-2 text-xs text-bottle-800 hover:text-bottle-600 font-black transition cursor-pointer"
              >
                Back to sign in options
              </button>
            </form>
          )}

          {step === 'otp_input' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              
              {/* Developer Helper Banner */}
              {generatedOtp && (
                <div className="p-3 bg-pista-300 border border-pista-400 rounded-xl text-xs text-bottle-800 text-center font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-bottle-800" />
                  <span>Dev OTP Code: <strong className="font-mono text-bottle-900 text-sm font-black">{generatedOtp}</strong></span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-bottle-800 mb-2">
                  Enter 6-Digit OTP Code sent to <span className="text-bottle-900 font-black">{phoneNumber}</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-pista-400 rounded-xl text-slate-900 text-center font-mono text-xl tracking-widest focus:outline-none focus:border-bottle-800 font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-base rounded-2xl transition shadow-lg shadow-bottle-950/30 disabled:opacity-50 cursor-pointer border border-bottle-700"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Continue'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone_input')}
                className="w-full py-2 text-xs text-bottle-800 hover:text-bottle-600 font-black transition cursor-pointer"
              >
                Change Phone Number
              </button>
            </form>
          )}

        </div>
      </main>

      {/* Discrete Link to Authority Login */}
      <footer className="max-w-md mx-auto w-full text-center pb-6">
        <Link
          to="/login/authority"
          className="inline-flex items-center gap-1.5 text-xs text-bottle-800 hover:text-bottle-600 font-black transition border-b border-transparent hover:border-bottle-800 pb-0.5"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-bottle-800" />
          Are you a municipal official / authority? Official Login &rarr;
        </Link>
      </footer>

    </div>
  );
}
