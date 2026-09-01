import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LogOut,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

function getFullImageUrl(url, backendUrl) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

function formatReportDate(isoString) {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return isoString;
  }
}

export default function AuthorityDashboard() {
  const { department: deptParam } = useParams();
  const { user, token, logout } = useAuth();

  const activeDepartment = decodeURIComponent(deptParam || user?.department || 'Municipal Corporation');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const fetchDepartmentReports = () => {
    if (token) {
      setLoading(true);
      fetch(`${BACKEND_URL}/api/reports/authority`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.reports) setReports(data.reports);
        })
        .catch(err => console.error('Error fetching authority reports:', err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchDepartmentReports();
  }, [token]);

  const updateStatus = async (reportId, newStatus) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${reportId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchDepartmentReports();
        if (selectedReport?.id === reportId) {
          setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const pendingCount = reports.filter(r => (r.status || '').toLowerCase() === 'pending').length;
  const resolvedCount = reports.filter(r => (r.status || '').toLowerCase() === 'resolved').length;

  return (
    <div className="min-h-screen bg-pista-200 text-slate-900 flex flex-col justify-between p-4 md:p-10 font-sans selection:bg-pista-300 overflow-y-auto w-full">
      <div className="max-w-6xl mx-auto w-full space-y-8">

        {/* Top Header Bar — DARK BOTTLE GREEN */}
        <header className="bg-bottle-900 border border-bottle-800 rounded-3xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md text-white">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-bottle-800 border border-bottle-700 flex items-center justify-center text-white font-bold text-2xl shadow-inner shrink-0">
              🏛️
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{activeDepartment}</h1>
                <span className="px-3 py-1 bg-bottle-800 text-pista-100 border border-bottle-700 text-xs font-extrabold rounded-full flex items-center gap-1 shadow-xs whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pista-300" /> Official Officer
                </span>
              </div>
              <p className="text-pista-300 text-xs mt-0.5 font-bold">Logged Officer: <span className="text-white font-black">{user?.name || 'Authorized Officer'}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDepartmentReports}
              className="p-2.5 bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 text-white rounded-xl transition text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Refresh Department Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={logout}
              className="px-4 py-2.5 bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 text-white rounded-xl transition text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4 text-white" /> Logout
            </button>
          </div>
        </header>

        {/* Department Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-pista-100 rounded-md p-6 border border-pista-400 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Assigned Reports</span>
              <FileText className="w-5 h-5 text-bottle-800" />
            </div>
            <div className="text-3xl font-black text-bottle-900">{reports.length}</div>
            <p className="text-xs text-slate-600 mt-2 font-bold">Total issues assigned to {activeDepartment}</p>
          </div>

          <div className="bg-pista-100 rounded-md p-6 border border-pista-400 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Pending Action</span>
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="text-3xl font-black text-amber-800">{pendingCount}</div>
            <p className="text-xs text-slate-600 mt-2 font-bold">Awaiting officer field dispatch</p>
          </div>

          <div className="bg-pista-100 rounded-md p-6 border border-pista-400 shadow-md">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Resolved Issues</span>
              <CheckCircle2 className="w-5 h-5 text-bottle-800" />
            </div>
            <div className="text-3xl font-black text-bottle-800">{resolvedCount}</div>
            <p className="text-xs text-slate-600 mt-2 font-bold">Closed and verified by department</p>
          </div>

        </div>

        {/* Main Queue & Report Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Report List */}
          <div className="lg:col-span-7 bg-pista-100 rounded-3xl p-6 border border-pista-400 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-pista-300">
              <div>
                <h3 className="font-black text-lg text-bottle-900">Department Issue Queue</h3>
                <p className="text-slate-700 text-xs mt-0.5 font-bold">Real-time incoming reports routed via AI multi-modal engine</p>
              </div>
              <span className="text-xs px-3 py-1 bg-bottle-900 text-pista-100 font-extrabold rounded-full border border-bottle-800">
                {reports.length} Total
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs font-bold text-slate-600">Loading department queue...</div>
            ) : reports.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-pista-400 rounded-2xl text-center space-y-3 bg-pista-200/50">
                <Building2 className="w-10 h-10 text-bottle-800 mx-auto" />
                <p className="text-bottle-900 font-black text-base">No active issues in {activeDepartment} queue</p>
                <p className="text-xs text-slate-700 max-w-md mx-auto font-semibold">When citizens snap and submit reports assigned to {activeDepartment}, they will appear here with SOAP transcripts and GPS coordinates.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${selectedReport?.id === report.id
                        ? 'bg-bottle-900 text-white border-bottle-800 shadow-md'
                        : 'bg-white border-pista-400 hover:bg-pista-200 text-slate-900'
                      }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${selectedReport?.id === report.id ? 'bg-bottle-800 text-pista-200' : 'bg-pista-300 text-bottle-900'
                          }`}>
                          {report.category}
                        </span>
                        <span className="text-[10px] font-bold opacity-80 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {report.city_name || 'Mumbai'}
                        </span>
                      </div>
                      <p className="text-xs font-bold line-clamp-1">{report.description || 'No description provided'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] px-2.5 py-1 rounded-md font-extrabold ${report.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : report.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                        {report.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Detailed SOAP & Audit Inspector */}
          <div className="lg:col-span-5 bg-pista-100 rounded-3xl p-6 border border-pista-400 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pista-300">
              <h3 className="font-black text-base text-bottle-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-bottle-800" /> Report Audit Inspector
              </h3>
            </div>

            {selectedReport ? (
              <div className="space-y-4 text-xs font-semibold">

                {/* Uploaded Evidence Image */}
                {selectedReport.image_url && (
                  <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-900 border border-pista-400 shadow-md">
                    <img
                      src={getFullImageUrl(selectedReport.image_url, BACKEND_URL)}
                      alt="Evidence"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        const reportId = selectedReport.id || selectedReport.report_id;
                        e.target.src = reportId ? `${BACKEND_URL}/api/reports/stream-image/${reportId}` : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                    <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-bottle-900/90 text-white text-[10px] font-bold rounded-lg border border-bottle-700 backdrop-blur-md">
                      📍 {selectedReport.city_name || 'Mumbai'}
                    </span>
                  </div>
                )}

                {/* Metadata & Timestamp */}
                <div className="p-3 bg-white border border-pista-300 rounded-xl space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-bottle-800" />
                      Reported: {formatReportDate(selectedReport.created_at)}
                    </span>
                    <span className="font-black text-bottle-800 uppercase">{selectedReport.category}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    GPS Coordinates: {selectedReport.latitude || 19.0760}°, {selectedReport.longitude || 72.8777}°
                  </div>
                </div>

                {/* Direct Google Maps Action Button */}
                <a
                  href={`https://www.google.com/maps?q=${selectedReport.latitude || 19.0760},${selectedReport.longitude || 72.8777}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-bottle-800 hover:bg-bottle-600 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 border border-bottle-700"
                >
                  <MapPin className="w-4 h-4 text-pista-300" />
                  <span>Open Location in Google Maps ↗</span>
                  <ExternalLink className="w-3.5 h-3.5 text-pista-300" />
                </a>

                {/* Report Body / Description */}
                {selectedReport.description && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-bottle-800 uppercase block">Citizen Description</span>
                    <p className="p-3 bg-white border border-pista-300 rounded-xl text-xs font-semibold text-slate-800 leading-relaxed">
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                {/* Official Formal Complaint Letter (Filed by Citizen) */}
                {selectedReport.complaint_report && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-bottle-800 uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-bottle-800" />
                      Official Complaint Letter (Filed by Citizen)
                    </span>
                    <div className="p-4 bg-white border border-pista-300 rounded-xl font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto shadow-inner leading-relaxed">
                      {selectedReport.complaint_report}
                    </div>
                  </div>
                )}

                {/* Status Update Actions */}
                <div className="p-3 bg-white border border-pista-300 rounded-xl space-y-2">
                  <span className="text-[11px] font-black text-bottle-800 uppercase block">Update Status</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(selectedReport.id, 'In Progress')}
                      className="flex-1 py-2 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => updateStatus(selectedReport.id, 'Resolved')}
                      className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>

                {/* Anti-Hallucination Critic Audit */}
                {selectedReport.critic_verdict && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-black text-emerald-900 uppercase block">Anti-Hallucination Critic Audit</span>
                    <p className="text-[11px] text-emerald-800 font-bold">{selectedReport.critic_verdict}</p>
                  </div>
                )}

                {/* SOAP Note Format Transcript */}
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-bottle-800 uppercase block">Structured SOAP Transcript</span>
                  <div className="p-3 bg-white border border-pista-300 rounded-xl font-mono text-[10px] text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner">
                    {selectedReport.soap_transcript || 'SOAP Note Transcript not available'}
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-600 font-bold">
                Select a report from the queue to inspect SOAP transcripts and update status.
              </div>
            )}

          </div>

        </div>

      </div>

      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-bottle-800 pt-8 border-t border-pista-400 font-bold">
        CivicSnap Official Portal &bull; Department: {activeDepartment} &bull; User ID: {user?.id}
      </footer>
    </div>
  );
}

