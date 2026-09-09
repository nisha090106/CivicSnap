import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSystemLocation } from '../utils/locationHelper';
import CommunityMap from '../components/CommunityMap';
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
  ExternalLink,
  ChevronDown,
  SlidersHorizontal,
  Layers,
  BarChart3,
  Users,
  Search
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
  const [activeTab, setActiveTab] = useState('recent');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [currentCity, setCurrentCity] = useState('Detecting...');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const displayReports = reports.filter(report => {
    if (activeTab === 'assigned') {
      const repDept = (report.department || '').toLowerCase();
      const actDept = (activeDepartment || '').toLowerCase();
      return repDept.includes(actDept) || actDept.includes(repDept);
    }
    if (activeTab === 'priority') {
      const sev = (report.severity_level || '').toLowerCase();
      const st = (report.status || '').toLowerCase();
      return sev === 'high' || sev === 'critical' || st === 'pending';
    }
    return true;
  });

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
    getSystemLocation().then((loc) => setCurrentCity(loc.city));
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

  const totalCount = reports.length;
  const pendingCount = reports.filter(r => (r.status || '').toLowerCase() === 'pending').length;
  const inProgressCount = reports.filter(r => (r.status || '').toLowerCase() === 'in progress').length;
  const resolvedCount = reports.filter(r => (r.status || '').toLowerCase() === 'resolved').length;

  return (
    <div className="min-h-screen bg-[#EAF5E5] text-slate-900 flex flex-col justify-between font-sans selection:bg-pista-300">
      
      {/* 1. TOP NAVBAR HEADER — DARK BOTTLE GREEN (#072818) */}
      <header className="bg-[#072818] text-white px-6 py-3.5 flex items-center justify-between shadow-lg border-b border-bottle-800">
        <div className="flex items-center space-x-8">
          
          {/* Brand Logo */}
          <div className="flex items-center">
            <img
              src="/cs-logo-white.png"
              alt="CivicSnap"
              className="h-8 md:h-9 w-auto object-contain transition hover:scale-105"
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-black">
            <button
              onClick={() => setActiveTab('recent')}
              className={`transition cursor-pointer ${activeTab === 'recent' || activeTab === 'dashboard' ? 'text-white border-b-2 border-emerald-400 pb-1' : 'text-slate-300 hover:text-white'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`transition cursor-pointer ${activeTab === 'assigned' ? 'text-white border-b-2 border-emerald-400 pb-1' : 'text-slate-300 hover:text-white'}`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`transition cursor-pointer ${activeTab === 'map' ? 'text-white border-b-2 border-emerald-400 pb-1' : 'text-slate-300 hover:text-white'}`}
            >
              Map
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`transition cursor-pointer ${activeTab === 'analytics' ? 'text-white border-b-2 border-emerald-400 pb-1' : 'text-slate-300 hover:text-white'}`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('citizens')}
              className={`transition cursor-pointer ${activeTab === 'citizens' ? 'text-white border-b-2 border-emerald-400 pb-1' : 'text-slate-300 hover:text-white'}`}
            >
              Citizens
            </button>
          </nav>
        </div>

        {/* Right Officer Profile Pill */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0C3D24] border border-emerald-800/60 rounded-full text-xs font-bold shadow-inner">
            <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-black">
              👤
            </div>
            <div className="text-left">
              <div className="text-[11px] font-black text-white leading-tight">{user?.name || 'Municipal Officer'}</div>
              <div className="text-[9px] text-emerald-300 font-semibold leading-tight">{activeDepartment} ({currentCity})</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 bg-[#0C3D24] hover:bg-emerald-900 border border-emerald-800 text-white rounded-full transition cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6">

        {/* Dashboard Title & Time Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#072818] tracking-tight">Authority Dashboard</h2>
            <p className="text-xs text-slate-700 font-bold mt-0.5">Monitor, manage and resolve civic issues in real-time</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDepartmentReports}
              className="p-2 bg-white hover:bg-pista-100 border border-pista-400 text-[#072818] rounded-xl transition cursor-pointer shadow-xs text-xs font-bold flex items-center gap-1"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none px-4 py-2 bg-white border border-pista-400 rounded-xl text-xs font-black text-[#072818] pr-8 cursor-pointer shadow-xs focus:outline-none"
              >
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>All Time</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 4 KPI METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Total Reports */}
          <div className="bg-white rounded-2xl p-4 border border-pista-400 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Total Reports</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#072818]">{totalCount.toLocaleString()}</div>
              <div className="text-[11px] font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
                <span>+12% this month</span>
              </div>
            </div>
          </div>

          {/* Card 2: Pending */}
          <div className="bg-[#FFF7ED] rounded-2xl p-4 border border-amber-200 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider">Pending</span>
              <div className="w-8 h-8 rounded-xl bg-amber-200/60 text-amber-800 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-amber-950">{pendingCount}</div>
              <div className="text-[11px] font-extrabold text-amber-800 mt-1">
                <span>Needs Attention</span>
              </div>
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="bg-[#EFF6FF] rounded-2xl p-4 border border-blue-200 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider">In Progress</span>
              <div className="w-8 h-8 rounded-xl bg-blue-200/60 text-blue-800 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-blue-950">{inProgressCount}</div>
              <div className="text-[11px] font-extrabold text-blue-800 mt-1">
                <span>Under Resolution</span>
              </div>
            </div>
          </div>

          {/* Card 4: Resolved */}
          <div className="bg-[#F0FDF4] rounded-2xl p-4 border border-emerald-200 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">Resolved</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-200/60 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-950">{resolvedCount}</div>
              <div className="text-[11px] font-extrabold text-emerald-800 mt-1">
                <span>Successfully Closed</span>
              </div>
            </div>
          </div>

        </div>

        {/* MAIN REPORTS SECTION */}
        <div className="bg-white rounded-3xl p-5 border border-pista-400 shadow-md space-y-4">
          
          {/* Sub Navigation Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-pista-300 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                activeTab === 'recent' || activeTab === 'dashboard'
                  ? 'bg-[#072818] text-white shadow-xs'
                  : 'bg-pista-100 text-slate-700 hover:bg-pista-200'
              }`}
            >
              Recent Reports
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                activeTab === 'assigned'
                  ? 'bg-[#072818] text-white shadow-xs'
                  : 'bg-pista-100 text-slate-700 hover:bg-pista-200'
              }`}
            >
              My Assigned ({reports.filter(r => (r.department || '').toLowerCase().includes(activeDepartment.toLowerCase())).length})
            </button>
            <button
              onClick={() => setActiveTab('priority')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                activeTab === 'priority'
                  ? 'bg-[#072818] text-white shadow-xs'
                  : 'bg-pista-100 text-slate-700 hover:bg-pista-200'
              }`}
            >
              Priority
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-[#072818] text-white shadow-xs'
                  : 'bg-pista-100 text-slate-700 hover:bg-pista-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" /> Interactive GIS Map
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-[#072818] text-white shadow-xs'
                  : 'bg-pista-100 text-slate-700 hover:bg-pista-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </button>
            <button
              onClick={() => setActiveTab('citizens')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'citizens'
                  ? 'bg-[#072818] text-white shadow-xs'
                  : 'bg-pista-100 text-slate-700 hover:bg-pista-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Citizens Hub
            </button>
          </div>

          {/* TAB 1: INTERACTIVE GIS MAP VIEW */}
          {activeTab === 'map' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#072818]">Department Live GIS Heatmap</h3>
                  <p className="text-xs text-slate-600 font-bold">Geospatial location pins of all reports routed to {activeDepartment}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-extrabold">
                  📍 {reports.length} Active Pins
                </span>
              </div>
              <CommunityMap reports={reports} />
            </div>
          )}

          {/* TAB 2: ANALYTICS DASHBOARD VIEW */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 py-2">
              <div>
                <h3 className="text-base font-black text-[#072818]">Performance Analytics & SLA Monitoring</h3>
                <p className="text-xs text-slate-600 font-bold">Real-time metrics for {activeDepartment}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-pista-50 border border-pista-300 rounded-2xl space-y-2">
                  <span className="text-xs font-black text-slate-500 uppercase">Resolution Efficiency Rate</span>
                  <div className="text-3xl font-black text-emerald-800">
                    {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}%
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-pista-50 border border-pista-300 rounded-2xl space-y-2">
                  <span className="text-xs font-black text-slate-500 uppercase">Avg Response SLA</span>
                  <div className="text-3xl font-black text-blue-900">2.4 Days</div>
                  <p className="text-[11px] text-blue-700 font-bold">⚡ 18% faster than SLA benchmark</p>
                </div>

                <div className="p-4 bg-pista-50 border border-pista-300 rounded-2xl space-y-2">
                  <span className="text-xs font-black text-slate-500 uppercase">Citizen Satisfaction</span>
                  <div className="text-3xl font-black text-amber-900">4.8 / 5.0</div>
                  <p className="text-[11px] text-amber-700 font-bold">⭐ Based on 142 citizen reviews</p>
                </div>
              </div>

              {/* Department Category Distribution */}
              <div className="p-5 bg-pista-50 border border-pista-300 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-[#072818] uppercase tracking-wider">Top Reported Categories</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Pothole & Road Damage', count: 48, pct: 40, color: 'bg-emerald-600' },
                    { label: 'Garbage & Waste Accumulation', count: 32, pct: 27, color: 'bg-amber-600' },
                    { label: 'Water Leakage & Drainage', count: 24, pct: 20, color: 'bg-blue-600' },
                    { label: 'Street Lights & Electrical', count: 16, pct: 13, color: 'bg-purple-600' }
                  ].map(cat => (
                    <div key={cat.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>{cat.label}</span>
                        <span>{cat.count} reports ({cat.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className={`${cat.color} h-full rounded-full`} style={{ width: `${cat.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CITIZENS HUB VIEW */}
          {activeTab === 'citizens' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#072818]">Citizen Reporters Directory</h3>
                  <p className="text-xs text-slate-600 font-bold">Active civic participants reporting issues to {activeDepartment}</p>
                </div>
                <button
                  onClick={fetchDepartmentReports}
                  className="px-3.5 py-1.5 bg-[#072818] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh List
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(reports.length > 0 ? reports : [
                  { reporter_name: 'Apurv P.', city_name: 'Pune', created_at: new Date().toISOString(), category: 'Road Damage' },
                  { reporter_name: 'Nisha S.', city_name: 'Mumbai', created_at: new Date().toISOString(), category: 'Garbage Overflow' },
                  { reporter_name: 'Rahul M.', city_name: 'Navi Mumbai', created_at: new Date().toISOString(), category: 'Water Leak' }
                ]).map((rep, idx) => (
                  <div key={idx} className="p-3.5 bg-pista-50 border border-pista-300 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-xs">
                        👤
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#072818]">{rep.reporter_name || rep.citizen_name || 'Verified Citizen'}</h4>
                        <p className="text-[11px] text-slate-600 font-semibold">{rep.city_name || 'Pune'} &bull; {rep.category || 'Civic Issue'}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-[10px] font-extrabold">
                      Active Reporter
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS LIST (FOR RECENT, ASSIGNED, PRIORITY) */}
          {(activeTab === 'recent' || activeTab === 'assigned' || activeTab === 'priority' || activeTab === 'dashboard') && (
          <div className="space-y-3">
            {displayReports.length === 0 ? (
              <div className="p-8 text-center bg-pista-50 border border-pista-300 rounded-2xl text-xs font-semibold text-slate-600">
                No reports found in this category.
              </div>
            ) : displayReports.map((report) => {
              const statusClass = 
                report.status === 'Resolved'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : report.status === 'In Progress'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-800 border-slate-300';

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="p-4 bg-pista-50/60 hover:bg-pista-100 rounded-2xl border border-pista-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    {/* Image Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-pista-400 overflow-hidden shrink-0">
                      <img
                        src={getFullImageUrl(report.image_url, BACKEND_URL) || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80'}
                        alt={report.category}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* Report Metadata */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-500">#{report.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold border ${statusClass}`}>
                          {report.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-[#072818]">{report.category}</h4>
                      
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-800" /> {report.city_name || 'Mumbai'}
                        </span>
                        <span>&bull;</span>
                        <span>Reported {formatReportDate(report.created_at)} by {report.reporter_name || 'Citizen'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Department Pill & View Details Button */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[11px] font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-pista-300 flex items-center gap-1 shadow-2xs">
                      🏢 {report.department}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReport(report);
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-pista-200 border border-pista-400 text-[#072818] text-xs font-black rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      View Details &gt;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}

        </div>

      </main>

      {/* 3. FOOTER SKYLINE BANNER */}
      <footer className="w-full bg-[#E0F0DA] border-t border-pista-400 py-6 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-[#072818]">
            <span className="text-lg">🍃</span>
            <span className="font-black text-sm tracking-tight">Cleaner Cities, Greener Tomorrows</span>
          </div>

          <div className="text-xs font-bold text-slate-600">
            CivicSnap Official Authority Portal &bull; Department: {activeDepartment}
          </div>
        </div>
      </footer>

      {/* Report Inspector Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-white max-w-2xl w-full rounded-3xl border border-pista-400 shadow-2xl relative my-auto overflow-hidden">
            
            <div className="bg-[#072818] text-white p-5 border-b border-bottle-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-white">{selectedReport.category}</h3>
                <p className="text-xs text-emerald-300 font-bold">Report #{selectedReport.id} &bull; {selectedReport.department}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full bg-bottle-800 text-white flex items-center justify-center hover:bg-bottle-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs font-semibold">
              
              {/* Evidence Photo */}
              <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-900 border border-pista-400 shadow-md">
                <img
                  src={getFullImageUrl(selectedReport.image_url, BACKEND_URL) || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80'}
                  alt="Evidence"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-3 py-1 bg-[#072818]/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-md">
                  📍 {selectedReport.city_name || 'Mumbai'}
                </span>
              </div>

              {/* Status Updater Buttons */}
              <div className="p-4 bg-pista-50 rounded-2xl border border-pista-300 space-y-2">
                <span className="text-[11px] font-black text-[#072818] uppercase block">Update Report Status (Dispatches email to citizen)</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(selectedReport.id, 'In Progress')}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition cursor-pointer"
                  >
                    Set In Progress 🟡
                  </button>
                  <button
                    onClick={() => updateStatus(selectedReport.id, 'Resolved')}
                    className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl transition cursor-pointer"
                  >
                    Mark Resolved 🟢
                  </button>
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-[#072818] uppercase block">Citizen Description</span>
                  <p className="p-3 bg-pista-50 border border-pista-300 rounded-xl text-xs font-semibold text-slate-800 leading-relaxed">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              {/* Complaint Report Letter */}
              {selectedReport.complaint_report && (
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-[#072818] uppercase block">Official Formal Letter</span>
                  <div className="p-4 bg-pista-50 border border-pista-300 rounded-xl font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner leading-relaxed">
                    {selectedReport.complaint_report}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
