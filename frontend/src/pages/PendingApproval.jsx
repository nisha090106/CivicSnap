import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, CheckCircle2, LogOut, Sparkles } from 'lucide-react';

export default function PendingApproval() {
  const { user, approveAuthority, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleDevApprove = async () => {
    setLoading(true);
    try {
      const res = await approveAuthority();
      if (res && res.success) {
        const dept = res.user.department || user?.department || 'Municipal Authority';
        navigate(`/dashboard/authority/${encodeURIComponent(dept)}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pista-200 text-slate-900 flex flex-col justify-between p-6 md:p-12 font-sans selection:bg-pista-300 overflow-y-auto w-full">
      <div className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-pista-100 rounded-3xl p-8 border border-pista-400 text-center space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 mx-auto shadow-md">
            <Clock className="w-8 h-8 animate-pulse text-amber-800" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-full">
              Account Pending Review
            </span>
            <h1 className="text-2xl font-black text-bottle-900">Authority Verification Required</h1>
            <p className="text-slate-800 text-sm max-w-md mx-auto font-semibold">
              Your official authority account for <strong className="text-bottle-900 font-black">{user?.department || 'Municipal Department'}</strong> has been registered and is awaiting administrator verification.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-pista-400 text-xs text-slate-800 text-left space-y-1 font-mono">
            <div><span className="text-bottle-800 font-black">Official ID:</span> {user?.id}</div>
            <div><span className="text-bottle-800 font-black">Department:</span> {user?.department || 'Not specified'}</div>
            <div><span className="text-bottle-800 font-black">Approval Status:</span> <span className="text-amber-800 font-bold">Pending Review</span></div>
          </div>

          {/* Dev Helper Quick-Approval Button */}
          <div className="pt-4 border-t border-pista-300 space-y-3">
            <button
              onClick={handleDevApprove}
              disabled={loading}
              className="w-full py-3.5 px-6 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-sm rounded-2xl transition shadow-lg shadow-bottle-800/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              {loading ? 'Approving Account...' : 'Dev Quick-Approve Authority Account'}
            </button>
            <p className="text-[11px] text-slate-700 font-semibold">
              (Developer helper: Click above to test approved authority flow)
            </p>
          </div>

          <button
            onClick={logout}
            className="text-xs text-bottle-800 hover:text-bottle-600 font-black transition flex items-center gap-1 mx-auto pt-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>

        </div>
      </div>

      <footer className="max-w-xl mx-auto w-full text-center text-xs text-bottle-800 font-bold pt-4">
        CivicSnap Authority Verification System
      </footer>
    </div>
  );
}
