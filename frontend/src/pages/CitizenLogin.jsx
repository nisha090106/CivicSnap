import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, ShieldCheck } from 'lucide-react';

export default function CitizenLogin() {
  const { googleSignIn, emailSignIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await emailSignIn({ email, password });
      if (res.success) {
        navigate('/dashboard/citizen');
      } else {
        setError(res.error || 'Sign-in failed');
      }
    } catch (err) {
      setError(`Sign-in failed: ${err.message || 'Unable to connect to the authentication service.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await googleSignIn({
        idToken: credentialResponse.credential,
        role: 'citizen',
        department: null
      });
      if (res.success) {
        navigate('/dashboard/citizen');
      } else {
        const errorMsg = res.error || 'Google sign-in failed';
        const detailsText = res.details ? `: ${res.details}` : '';
        setError(`${errorMsg}${detailsText}`);
      }
    } catch (err) {
      setError(`Google sign-in failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pista-200 text-slate-900 flex flex-col justify-between p-4 md:p-8 font-sans selection:bg-pista-300">

      {/* Header Branding — DARK GREEN */}
      <header className="max-w-md mx-auto w-full bg-bottle-900 border border-bottle-800 rounded-md p-3 flex items-center justify-between shadow-md text-white">
        <div className="flex items-center">
          <img
            src="/cs-logo-white.png"
            alt="CivicSnap"
            className="h-9 w-auto object-contain"
          />
        </div>
        <span className="text-xs px-3 py-1 bg-bottle-800 text-pista-100 border border-bottle-700 rounded-full font-extrabold">
          Citizen Portal
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-pista-100 rounded-md p-8 shadow-2xl relative border border-pista-400 space-y-6">

          <div className="text-center">
            <h1 className="text-3xl font-black text-bottle-900 tracking-tight">Report Civic Issues</h1>
            <p className="text-slate-800 text-sm mt-2 font-semibold">Sign in to report potholes, garbage, water leaks, and streetlight failures.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-center w-full min-h-[44px]">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was closed or failed')}
                useOneTap
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="100%"
              />
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-pista-300 w-full"></div>
              <span className="bg-pista-100 px-3 text-xs text-bottle-800 font-extrabold uppercase tracking-wider absolute">or</span>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-bottle-800 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-bottle-800 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-pista-400 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-bottle-800 text-base font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-bottle-800 mb-2">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-bottle-800 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-pista-400 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-bottle-800 text-base font-semibold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-base rounded-md transition shadow-lg shadow-bottle-950/30 disabled:opacity-50 cursor-pointer border border-bottle-700"
              >
                {loading ? 'Signing In...' : 'Sign In to Account'}
              </button>
            </form>
          </div>

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
