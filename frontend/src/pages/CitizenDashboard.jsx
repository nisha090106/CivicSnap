import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, PlusCircle, CheckCircle2, MapPin, Clock } from 'lucide-react';

export default function CitizenDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Top Bar */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              📸
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Citizen Dashboard</h1>
              <p className="text-slate-400 text-xs mt-0.5">Welcome, <span className="text-white font-medium">{user?.name || 'Citizen'}</span></p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Citizen
            </span>
            <button
              onClick={logout}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition text-xs font-medium flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        {/* Hero Report Banner */}
        <div className="glass-card rounded-3xl p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 relative overflow-hidden">
          <div className="max-w-xl space-y-4">
            <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-semibold rounded-full border border-emerald-500/30">
              Civic Engagement Platform
            </span>
            <h2 className="text-3xl font-extrabold text-white">Report a New Civic Problem</h2>
            <p className="text-slate-400 text-sm">Snap a picture of potholes, trash accumulation, broken street lights, or water leaks for automatic department routing.</p>
            <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <PlusCircle className="w-5 h-5" /> Snap & Report Issue (Coming in Next Stage)
            </button>
          </div>
        </div>

        {/* My Reports List Placeholder */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800">
          <h3 className="font-semibold text-lg text-white mb-4">My Submitted Reports</h3>
          <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-sm space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p>You haven't submitted any civic reports yet.</p>
            <p className="text-xs text-slate-600">Reports submitted by you will appear here with live tracking updates.</p>
          </div>
        </div>

      </div>

      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-600 pt-8 border-t border-slate-900">
        CivicSnap Citizen Portal &bull; Logged in as {user?.phoneNumber || user?.email || user?.id}
      </footer>
    </div>
  );
}
