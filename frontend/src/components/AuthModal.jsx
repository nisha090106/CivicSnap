import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { X, Mail, Lock, Phone, Sparkles, Building2, UserCheck, ShieldCheck } from 'lucide-react';

const DEPARTMENTS = [
  "Road & Transport",
  "Garbage & Waste Management",
  "Food & Drug Authority",
  "Forest Department",
  "Municipal Corporation",
  "Nagar Panchayat",
  "Gram Panchayat"
];

export default function AuthModal({ isOpen, onClose, initialTab = 'login', initialRole = 'citizen' }) {
  const { sendOtp, verifyOtp, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(initialTab); // 'login' | 'signup'
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
  const [role, setRole] = useState(initialRole); // 'citizen' | 'authority'
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  
  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpStep, setOtpStep] = useState('send'); // 'send' | 'verify'
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Please enter both email and password');
    setError('');
    setLoading(true);
    try {
      const res = await googleSignIn({
        email,
        name: name || (role === 'citizen' ? 'Citizen User' : 'Municipal Officer'),
        role,
        department: role === 'authority' ? department : null
      });

      if (res.success) {
        onClose();
        if (role === 'citizen') {
          navigate('/dashboard/citizen');
        } else if (res.user.isApproved) {
          navigate(`/dashboard/authority/${encodeURIComponent(res.user.department || department)}`);
        } else {
          navigate('/dashboard/pending-approval');
        }
      } else {
        setError(res.error || 'Sign-in failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return setError('Please enter your phone number');
    setError('');
    setLoading(true);
    try {
      const res = await sendOtp(phoneNumber);
      if (res.success) {
        setGeneratedOtp(res.otpCode);
        setOtpStep('verify');
      } else {
        setError(res.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Connection error. Auth Service offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return setError('Please enter 6-digit OTP code');
    setError('');
    setLoading(true);
    try {
      const res = await verifyOtp({
        phoneNumber,
        code: otpCode,
        role,
        department: role === 'authority' ? department : null,
        name
      });

      if (res.success) {
        onClose();
        if (role === 'citizen') {
          navigate('/dashboard/citizen');
        } else if (res.user.isApproved) {
          navigate(`/dashboard/authority/${encodeURIComponent(res.user.department || department)}`);
        } else {
          navigate('/dashboard/pending-approval');
        }
      } else {
        setError(res.error || 'Invalid OTP code');
      }
    } catch (err) {
      setError('OTP Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google Sign-In failed: No credential token received');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await googleSignIn({
        idToken: credentialResponse.credential,
        role,
        department: role === 'authority' ? department : null
      });

      if (res.success) {
        onClose();
        if (role === 'citizen') {
          navigate('/dashboard/citizen');
        } else if (res.user.isApproved) {
          navigate(`/dashboard/authority/${encodeURIComponent(res.user.department || department)}`);
        } else {
          navigate('/dashboard/pending-approval');
        }
      } else {
        setError(res.error || 'Google Authentication failed');
      }
    } catch (err) {
      setError('Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-pista-100 rounded-3xl border border-pista-400 max-w-md w-full shadow-2xl relative my-auto overflow-hidden">
        
        {/* Header — DARK BOTTLE GREEN */}
        <div className="bg-bottle-900 text-white p-6 border-b border-bottle-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-bottle-800 border border-bottle-700 flex items-center justify-center font-bold text-white text-xl shadow-inner">
              📸
            </div>
            <div>
              <h3 className="font-black text-xl text-white">
                {mode === 'login' ? 'Welcome Back' : 'Create CivicSnap Account'}
              </h3>
              <p className="text-xs text-pista-300 font-extrabold">Public Civic Issue Platform</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          {/* Account Role Selector (Citizen vs Authority) */}
          <div className="grid grid-cols-2 gap-2 bg-pista-300/80 p-1.5 rounded-2xl border border-pista-400">
            <button
              type="button"
              onClick={() => setRole('citizen')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'citizen'
                  ? 'bg-bottle-800 text-white shadow-md'
                  : 'text-bottle-800 hover:bg-pista-200'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Citizen
            </button>
            <button
              type="button"
              onClick={() => setRole('authority')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'authority'
                  ? 'bg-bottle-800 text-white shadow-md'
                  : 'text-bottle-800 hover:bg-pista-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Official Officer
            </button>
          </div>

          {/* Department Selector for Authority Accounts */}
          {role === 'authority' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-bottle-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-bottle-800" />
                Select Municipal Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-pista-400 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:border-bottle-800 cursor-pointer"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sign-in Method Tabs */}
          <div className="flex border-b border-pista-300 gap-4 text-xs font-black text-bottle-800">
            <button
              onClick={() => setAuthMethod('email')}
              className={`pb-2 border-b-2 transition cursor-pointer ${authMethod === 'email' ? 'border-bottle-800 text-bottle-900' : 'border-transparent text-slate-600'}`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setAuthMethod('phone')}
              className={`pb-2 border-b-2 transition cursor-pointer ${authMethod === 'phone' ? 'border-bottle-800 text-bottle-900' : 'border-transparent text-slate-600'}`}
            >
              Phone OTP
            </button>
          </div>

          {/* Google OAuth Button */}
          <div className="flex justify-center w-full min-h-[44px]">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In was cancelled or failed')}
              size="large"
              width="320"
              text="continue_with"
              shape="pill"
            />
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-pista-300 w-full"></div>
            <span className="bg-pista-100 px-3 text-[11px] text-bottle-800 font-black uppercase tracking-wider absolute">or</span>
          </div>

          {/* Email & Password Form */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-black text-bottle-800 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-pista-400 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-semibold focus:outline-none focus:border-bottle-800"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-bottle-800 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-bottle-800 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-pista-400 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-semibold focus:outline-none focus:border-bottle-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-bottle-800 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-bottle-800 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-pista-400 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-semibold focus:outline-none focus:border-bottle-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-sm rounded-2xl transition shadow-lg shadow-bottle-950/30 disabled:opacity-50 cursor-pointer border border-bottle-700"
              >
                {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Account' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Phone OTP Form */}
          {authMethod === 'phone' && (
            <div className="space-y-4">
              {otpStep === 'send' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-bottle-800 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-pista-400 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-semibold focus:outline-none focus:border-bottle-800"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-sm rounded-2xl transition shadow-lg shadow-bottle-950/30 disabled:opacity-50 cursor-pointer border border-bottle-700"
                  >
                    {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {generatedOtp && (
                    <div className="p-3 bg-pista-300 border border-pista-400 rounded-xl text-xs text-bottle-800 text-center font-bold flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-bottle-800" />
                      <span>Dev OTP Code: <strong className="font-mono text-bottle-900 text-sm font-black">{generatedOtp}</strong></span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-bottle-800 mb-1">
                      Enter 6-Digit Code sent to <span className="text-bottle-900 font-black">{phoneNumber}</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-pista-400 rounded-xl text-center font-mono text-lg tracking-widest text-slate-900 font-bold focus:outline-none focus:border-bottle-800"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-sm rounded-2xl transition shadow-lg shadow-bottle-950/30 disabled:opacity-50 cursor-pointer border border-bottle-700"
                  >
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Footer Toggle Mode */}
          <div className="text-center pt-2 text-xs text-slate-700 font-semibold">
            {mode === 'login' ? (
              <span>Don't have an account? <button type="button" onClick={() => setMode('signup')} className="font-black underline text-bottle-800 cursor-pointer">Sign Up</button></span>
            ) : (
              <span>Already have an account? <button type="button" onClick={() => setMode('login')} className="font-black underline text-bottle-800 cursor-pointer">Sign In</button></span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
