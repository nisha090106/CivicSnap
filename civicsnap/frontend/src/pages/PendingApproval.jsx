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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12">
      <div className="max-w-xl mx-auto w-full my-auto">
        <div className="glass-card rounded-3xl p-8 border border-amber-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-full">
              Account Pending Review
            </span>
            <h1 className="text-2xl font-extrabold text-white">Authority Verification Required</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Your official authority account for <strong className="text-amber-300 font-semibold">{user?.department || 'Municipal Department'}</strong> has been registered and is awaiting administrator verification.
            </p>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs text-slate-400 text-left space-y-1 font-mono">
            <div><span className="text-slate-500">Official ID:</span> {user?.id}</div>
            <div><span className="text-slate-500">Department:</span> {user?.department || 'Not specified'}</div>
            <div><span className="text-slate-500">Approval Status:</span> <span className="text-amber-400 font-semibold">false (Pending)</span></div>
          </div>

          {/* Dev Helper Quick-Approval Button */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={handleDevApprove}
              disabled={loading}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-2xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              {loading ? 'Approving Account...' : 'Dev Quick-Approve Authority Account'}
            </button>
            <p className="text-[11px] text-slate-500">
              (Developer helper: Click above to test approved authority flow)
            </p>
          </div>

          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1 mx-auto pt-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>

        </div>
      </div>

      <footer className="max-w-xl mx-auto w-full text-center text-xs text-slate-600 pt-4">
        CivicSnap Authority Verification System
      </footer>
    </div>
  );
}
