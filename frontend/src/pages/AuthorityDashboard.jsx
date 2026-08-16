import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, Building2, Layers, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function AuthorityDashboard() {
  const { department: deptParam } = useParams();
  const { user, logout } = useAuth();

  const activeDepartment = decodeURIComponent(deptParam || user?.department || 'Municipal Authority');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-2xl shadow-lg shadow-indigo-500/20">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{activeDepartment}</h1>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved Officer
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">Municipal Officer: <span className="text-white font-medium">{user?.name || 'Authorized Officer'}</span></p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 transition text-xs font-semibold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 text-slate-400" /> Logout
          </button>
        </header>

        {/* Department Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-medium text-slate-400">Assigned Reports</span>
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">0</div>
            <p className="text-xs text-slate-500 mt-2">Active issues routed to {activeDepartment}</p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-medium text-slate-400">Pending Resolution</span>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400">0</div>
            <p className="text-xs text-slate-500 mt-2">Awaiting department field verification</p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-medium text-slate-400">Resolved Issues</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">0</div>
            <p className="text-xs text-slate-500 mt-2">Closed and verified by department</p>
          </div>

        </div>

        {/* Report Queue Placeholder */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-lg text-white">Department Issue Queue</h3>
              <p className="text-slate-400 text-xs mt-0.5">Real-time incoming reports routed via AI image classification</p>
            </div>
            <span className="text-xs px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/30">
              Department Portal
            </span>
          </div>

          <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold text-base">No active issues in {activeDepartment} queue</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">When citizens snap and submit reports assigned to {activeDepartment}, they will appear here with AI severity scores and GPS location coordinates.</p>
          </div>
        </div>

      </div>

      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-slate-600 pt-8 border-t border-slate-900">
        CivicSnap Official Portal &bull; Department: {activeDepartment} &bull; User ID: {user?.id}
      </footer>
    </div>
  );
}
