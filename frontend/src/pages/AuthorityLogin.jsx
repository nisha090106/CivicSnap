import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Building2, Mail, Lock, ArrowRight } from 'lucide-react';

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
  const { emailSignIn } = useAuth();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Please enter both email and password');
    setError('');
    setLoading(true);
    try {
      const res = await emailSignIn({ email, password });
      if (res.success) {
        if (res.user.isApproved) {
          navigate(`/dashboard/authority/${encodeURIComponent(res.user.department || department)}`);
        } else {
          navigate('/dashboard/pending-approval');
        }
      } else {
        setError(res.error || 'Sign-in failed');
      }
    } catch (err) {
      setError('Connection error to Auth Service. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pista-200 text-slate-900 flex flex-col justify-between p-4 md:p-8 font-sans selection:bg-pista-300">

      {/* Header — DARK GREEN */}
      <header className="max-w-md mx-auto w-full bg-bottle-900 border border-bottle-800 rounded-md p-3 flex items-center justify-between shadow-md text-white">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-bottle-800 border border-bottle-700 flex items-center justify-center font-bold text-white text-xl shadow-inner">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">CivicSnap</span>
        </div>
        <span className="text-xs px-3 py-1 bg-bottle-800 text-pista-100 border border-bottle-700 rounded-full font-extrabold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-pista-300" /> Authority Portal
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-pista-100 rounded-md p-8 shadow-2xl relative border border-pista-400 space-y-6">

          <div className="text-center">
            <h1 className="text-2xl font-black text-bottle-900 tracking-tight">Official Authority Sign-In</h1>
            <p className="text-slate-800 text-xs mt-1.5 font-bold">For department officers and municipal authority personnel.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          {/* Department Selection (Required for Authority Login) */}
          <div>
            <label className="block text-xs font-black text-bottle-800 mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-bottle-800" />
              Select Municipal Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-pista-400 rounded-xl text-slate-900 font-extrabold focus:outline-none focus:border-bottle-800 text-sm cursor-pointer"
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-bottle-800 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-bottle-800 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="example@gmail.com"
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
              className="w-full py-4 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-sm rounded-md transition shadow-lg shadow-bottle-950/30 disabled:opacity-50 cursor-pointer border border-bottle-700 flex items-center justify-center gap-2 font-bold"
            >
              {loading ? 'Signing In...' : 'Sign In to Account'}
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </form>

        </div>
      </main>

      <footer className="max-w-md mx-auto w-full text-center pb-6">
        <Link
          to="/"
          className="text-xs text-bottle-800 hover:text-bottle-600 font-black transition"
        >
          &larr; Back to Public Landing Page
        </Link>
      </footer>

    </div>
  );
}
