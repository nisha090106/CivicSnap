import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, Building2, Layers, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function AuthorityDashboard() {
  const { department: deptParam } = useParams();
  const { user, logout } = useAuth();

  const activeDepartment = decodeURIComponent(deptParam || user?.department || 'Municipal Authority');

  return (
    <div className="min-h-screen bg-pista-200 text-slate-900 flex flex-col justify-between p-6 md:p-12 font-sans selection:bg-pista-300">
      <div className="max-w-5xl mx-auto w-full space-y-8">

        {/* Top Header Bar — DARK BOTTLE GREEN */}
        <header className="bg-bottle-900 border border-bottle-800 rounded-md p-4 md:p-6 flex items-center justify-between shadow-md text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-md bg-bottle-800 border border-bottle-700 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{activeDepartment}</h1>
                <span className="px-3 py-1 bg-bottle-800 text-pista-100 border border-bottle-700 text-xs font-extrabold rounded-full flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pista-300" /> Approved Officer
                </span>
              </div>
              <p className="text-pista-300 text-xs mt-0.5 font-bold">Municipal Officer: <span className="text-white font-black">{user?.name || 'Authorized Officer'}</span></p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2.5 bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 text-white rounded-xl transition text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4 text-white" /> Logout
          </button>
        </header>

        {/* Department Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-pista-100 rounded-md p-6 border border-pista-400 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Assigned Reports</span>
              <FileText className="w-5 h-5 text-bottle-800" />
            </div>
            <div className="text-3xl font-black text-bottle-900">0</div>
            <p className="text-xs text-slate-600 mt-2 font-bold">Active issues routed to {activeDepartment}</p>
          </div>

          <div className="bg-pista-100 rounded-md p-6 border border-pista-400 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Pending Resolution</span>
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="text-3xl font-black text-amber-800">0</div>
            <p className="text-xs text-slate-600 mt-2 font-bold">Awaiting department field verification</p>
          </div>

          <div className="bg-pista-100 rounded-md p-6 border border-pista-400 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Resolved Issues</span>
              <CheckCircle2 className="w-5 h-5 text-bottle-800" />
            </div>
            <div className="text-3xl font-black text-bottle-800">0</div>
            <p className="text-xs text-slate-600 mt-2 font-bold">Closed and verified by department</p>
          </div>

        </div>

        {/* Report Queue Placeholder */}
        <div className="bg-pista-100 rounded-md p-6 border border-pista-400 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-pista-300">
            <div>
              <h3 className="font-black text-lg text-bottle-900">Department Issue Queue</h3>
              <p className="text-slate-700 text-xs mt-0.5 font-bold">Real-time incoming reports routed via AI image classification</p>
            </div>
            <span className="text-xs px-3 py-1 bg-bottle-900 text-pista-100 font-extrabold rounded-full border border-bottle-800">
              Department Portal
            </span>
          </div>

          <div className="p-12 border-2 border-dashed border-pista-400 rounded-md text-center space-y-3 bg-pista-200/50">
            <Building2 className="w-10 h-10 text-bottle-800 mx-auto" />
            <p className="text-bottle-900 font-black text-base">No active issues in {activeDepartment} queue</p>
            <p className="text-xs text-slate-700 max-w-md mx-auto font-semibold">When citizens snap and submit reports assigned to {activeDepartment}, they will appear here with AI severity scores and GPS location coordinates.</p>
          </div>
        </div>

      </div>

      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-bottle-800 pt-8 border-t border-pista-400 font-bold">
        CivicSnap Official Portal &bull; Department: {activeDepartment} &bull; User ID: {user?.id}
      </footer>
    </div>
  );
}
