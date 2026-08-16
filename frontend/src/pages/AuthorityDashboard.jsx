import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, Building2, Layers, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function AuthorityDashboard() {
  const { department: deptParam } = useParams();
  const { user, logout } = useAuth();

  const activeDepartment = decodeURIComponent(deptParam || user?.department || 'Municipal Authority');

  return (
    <div className="min-h-screen bg-emerald-50/40 text-slate-900 flex flex-col justify-between p-6 md:p-12 font-sans selection:bg-emerald-200">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between border-b border-emerald-200 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-950 font-bold text-2xl shadow-inner">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">{activeDepartment}</h1>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" /> Approved Officer
                </span>
              </div>
              <p className="text-slate-600 text-xs mt-0.5 font-medium">Municipal Officer: <span className="text-emerald-950 font-bold">{user?.name || 'Authorized Officer'}</span></p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl text-emerald-900 transition text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4 text-emerald-800" /> Logout
          </button>
        </header>

        {/* Department Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Assigned Reports</span>
              <FileText className="w-5 h-5 text-emerald-800" />
            </div>
            <div className="text-3xl font-black text-emerald-950">0</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Active issues routed to {activeDepartment}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pending Resolution</span>
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-amber-700">0</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Awaiting department field verification</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Resolved Issues</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="text-3xl font-black text-emerald-800">0</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Closed and verified by department</p>
          </div>

        </div>

        {/* Report Queue Placeholder */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-emerald-100">
            <div>
              <h3 className="font-extrabold text-lg text-emerald-950">Department Issue Queue</h3>
              <p className="text-slate-600 text-xs mt-0.5 font-medium">Real-time incoming reports routed via AI image classification</p>
            </div>
            <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-900 font-bold rounded-full border border-emerald-300">
              Department Portal
            </span>
          </div>

          <div className="p-12 border-2 border-dashed border-emerald-200 rounded-2xl text-center space-y-3 bg-emerald-50/30">
            <Building2 className="w-10 h-10 text-emerald-800 mx-auto" />
            <p className="text-emerald-950 font-bold text-base">No active issues in {activeDepartment} queue</p>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">When citizens snap and submit reports assigned to {activeDepartment}, they will appear here with AI severity scores and GPS location coordinates.</p>
          </div>
        </div>

      </div>

      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-emerald-700 pt-8 border-t border-emerald-200/80 font-medium">
        CivicSnap Official Portal &bull; Department: {activeDepartment} &bull; User ID: {user?.id}
      </footer>
    </div>
  );
}
