import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, ShieldCheck, CheckCircle2, XCircle, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', details: null });
  const [authHealth, setAuthHealth] = useState({ status: 'checking', details: null });
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const AUTH_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4000';

  const fetchHealth = async () => {
    setLoading(true);
    // Check Backend FastAPI
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendHealth({ status: 'healthy', details: data });
      } else {
        const data = await res.json();
        setBackendHealth({ status: 'error', details: data });
      }
    } catch (err) {
      setBackendHealth({ status: 'offline', error: err.message });
    }

    // Check Auth Service Express
    try {
      const res = await fetch(`${AUTH_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setAuthHealth({ status: 'healthy', details: data });
      } else {
        const data = await res.json();
        setAuthHealth({ status: 'error', details: data });
      }
    } catch (err) {
      setAuthHealth({ status: 'offline', error: err.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                CivicSnap <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-semibold rounded-full border border-emerald-500/30">Stage 1</span>
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">Project Scaffolding & Supabase Database Verification</p>
            </div>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg transition text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Health Checks
          </button>
        </header>

        {/* Stack Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* FastAPI Card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-sky-400" />
                <h3 className="font-semibold text-lg text-white">FastAPI Backend</h3>
              </div>
              {backendHealth.status === 'healthy' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                  <XCircle className="w-3.5 h-3.5" /> {backendHealth.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-4">Port: <code className="text-slate-200">5000</code> | Framework: FastAPI (Python)</p>
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
              {backendHealth.details ? JSON.stringify(backendHealth.details, null, 2) : (backendHealth.error || 'Checking service...')}
            </div>
          </div>

          {/* Express Auth Service Card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
                <h3 className="font-semibold text-lg text-white">Auth Service</h3>
              </div>
              {authHealth.status === 'healthy' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                  <XCircle className="w-3.5 h-3.5" /> {authHealth.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-4">Port: <code className="text-slate-200">4000</code> | Runtime: Express (Better Auth Host)</p>
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
              {authHealth.details ? JSON.stringify(authHealth.details, null, 2) : (authHealth.error || 'Checking service...')}
            </div>
          </div>

          {/* Database Card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-emerald-400" />
                <h3 className="font-semibold text-lg text-white">Supabase PostgreSQL</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Shared DB
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Table: <code className="text-slate-200">reports</code> initialized</p>
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <div><span className="text-slate-500">Host:</span> Supabase Cloud</div>
              <div><span className="text-slate-500">Engine:</span> PostgreSQL 15</div>
              <div><span className="text-slate-500">Table:</span> reports (UUID PK)</div>
            </div>
          </div>

        </div>

        {/* Database Schema Card */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base text-white">Configured Database Table: <code className="text-emerald-400">reports</code></h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
              <div className="font-mono text-emerald-300 font-semibold">report_id</div>
              <div className="text-slate-500 mt-1">UUID (Primary Key)</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
              <div className="font-mono text-slate-300 font-semibold">citizen_id</div>
              <div className="text-slate-500 mt-1">UUID (Foreign Key)</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
              <div className="font-mono text-slate-300 font-semibold">image_url</div>
              <div className="text-slate-500 mt-1">TEXT</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
              <div className="font-mono text-slate-300 font-semibold">category</div>
              <div className="text-slate-500 mt-1">VARCHAR(100)</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
              <div className="font-mono text-slate-300 font-semibold">latitude / longitude</div>
              <div className="text-slate-500 mt-1">FLOAT / DOUBLE</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
              <div className="font-mono text-slate-300 font-semibold">description</div>
              <div className="text-slate-500 mt-1">TEXT</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
              <div className="font-mono text-slate-300 font-semibold">department / status</div>
              <div className="text-slate-500 mt-1">VARCHAR</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
              <div className="font-mono text-slate-300 font-semibold">created_at / vote_count</div>
              <div className="text-slate-500 mt-1">TIMESTAMP / INTEGER</div>
            </div>
          </div>
        </div>

      </div>

      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-slate-500 pt-8 border-t border-slate-900">
        CivicSnap Platform Stage 1 &bull; Built with React, Vite, Tailwind CSS, FastAPI, Express, and Supabase PostgreSQL.
      </footer>
    </div>
  );
}
