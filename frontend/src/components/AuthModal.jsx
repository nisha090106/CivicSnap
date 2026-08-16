import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
      // Direct sign-in using Google handler structure for email users
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await googleSignIn({
        email: `user_${Math.floor(Math.random() * 10000)}@gmail.com`,
        name: role === 'citizen' ? 'Google Citizen' : 'Google Officer',
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
      }
    } catch (err) {
      setError('Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-emerald-100 p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-xl shadow-inner">
              📸
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-emerald-950">
                {mode === 'login' ? 'Welcome Back' : 'Create CivicSnap Account'}
              </h3>
              <p className="text-xs text-emerald-700 font-medium">Public Civic Issue Platform</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Account Role Selector (Citizen vs Authority) */}
        <div className="grid grid-cols-2 gap-2 bg-emerald-50/80 p-1.5 rounded-2xl border border-emerald-100">
          <button
            type="button"
            onClick={() => setRole('citizen')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              role === 'citizen'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-emerald-800 hover:bg-emerald-100/60'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Citizen
          </button>
          <button
            type="button"
            onClick={() => setRole('authority')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              role === 'authority'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-emerald-800 hover:bg-emerald-100/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Official Officer
          </button>
        </div>

        {/* Department Selector for Authority Accounts */}
        {role === 'authority' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-800" />
              Select Municipal Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-emerald-950 font-medium text-xs focus:outline-none focus:border-emerald-800 cursor-pointer"
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        )}

        {/* Sign-in Method Tabs */}
        <div className="flex border-b border-emerald-100 gap-4 text-xs font-bold text-emerald-800">
          <button
            onClick={() => setAuthMethod('email')}
            className={`pb-2 border-b-2 transition ${authMethod === 'email' ? 'border-emerald-800 text-emerald-950' : 'border-transparent text-emerald-600'}`}
          >
            Email & Password
          </button>
          <button
            onClick={() => setAuthMethod('phone')}
            className={`pb-2 border-b-2 transition ${authMethod === 'phone' ? 'border-emerald-800 text-emerald-950' : 'border-transparent text-emerald-600'}`}
          >
            Phone OTP
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 px-4 bg-white border border-emerald-200 hover:bg-emerald-50 text-slate-800 font-bold text-xs rounded-2xl transition shadow-sm flex items-center justify-center gap-3"
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
          <div className="border-t border-emerald-100 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-emerald-600 font-semibold uppercase tracking-wider absolute">or</span>
        </div>

        {/* Email & Password Form */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs text-emerald-950 placeholder-emerald-400 focus:outline-none focus:border-emerald-800"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-emerald-900 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs text-emerald-950 placeholder-emerald-400 focus:outline-none focus:border-emerald-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs text-emerald-950 placeholder-emerald-400 focus:outline-none focus:border-emerald-800"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-emerald-900/20 disabled:opacity-50"
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
                  <label className="block text-xs font-bold text-emerald-900 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs text-emerald-950 placeholder-emerald-400 focus:outline-none focus:border-emerald-800"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {generatedOtp && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 text-center font-medium flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-800" />
                    <span>Dev OTP Code: <strong className="font-mono text-emerald-950">{generatedOtp}</strong></span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Enter 6-Digit Code sent to <span className="text-emerald-950">{phoneNumber}</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-center font-mono text-lg tracking-widest text-emerald-950 focus:outline-none focus:border-emerald-800"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Toggle Mode */}
        <div className="text-center pt-2 text-xs text-emerald-800">
          {mode === 'login' ? (
            <span>Don't have an account? <button type="button" onClick={() => setMode('signup')} className="font-bold underline text-emerald-950">Sign Up</button></span>
          ) : (
            <span>Already have an account? <button type="button" onClick={() => setMode('login')} className="font-bold underline text-emerald-950">Sign In</button></span>
          )}
        </div>

      </div>
    </div>
  );
}
