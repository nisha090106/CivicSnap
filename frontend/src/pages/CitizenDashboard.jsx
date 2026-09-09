import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CommunityMap from '../components/CommunityMap';
import ReportIssueModal from '../components/ReportIssueModal';
import NotificationsModal from '../components/NotificationsModal';
import ProfileModal from '../components/ProfileModal';
import { getSystemLocation } from '../utils/locationHelper';
import {
  Camera,
  MapPin,
  Bell,
  User,
  FileText,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Clock,
  Building2,
  X
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

export default function CitizenDashboard() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [myReports, setMyReports] = useState([]);
  const [publicReports, setPublicReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedDetailReport, setSelectedDetailReport] = useState(null);
  const [currentCity, setCurrentCity] = useState('Detecting...');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const fetchReports = () => {
    setLoadingReports(true);

    // 1. Fetch strict citizen-isolated reports for "My Reports" feed
    fetch(`${BACKEND_URL}/api/reports/citizen`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.reports) setMyReports(data.reports);
      })
      .catch(err => console.error('[My Reports Fetch Error]:', err));

    // 2. Fetch public reports for Community GIS Map pins
    fetch(`${BACKEND_URL}/api/reports/public`)
      .then(res => res.json())
      .then(data => {
        if (data.reports) setPublicReports(data.reports);
      })
      .catch(err => console.error('[Public Map Fetch Error]:', err))
      .finally(() => setLoadingReports(false));
  };

  useEffect(() => {
    fetchReports();
    getSystemLocation().then((loc) => setCurrentCity(loc.city));
    const handleRefresh = () => fetchReports();
    window.addEventListener('civicsnap:reportSubmitted', handleRefresh);
    return () => window.removeEventListener('civicsnap:reportSubmitted', handleRefresh);
  }, [token]);

  return (
    <div className="min-h-screen bg-pista-200 text-slate-900 flex flex-col justify-between pb-36 md:pb-20 font-sans selection:bg-pista-300 overflow-y-auto w-full">

      {/* 1. TOP HEADER NAVIGATION BAR — DARK BOTTLE GREEN (#072818) */}
      <header className="sticky top-0 z-[100] bg-[#072818] border-b border-bottle-800 px-4 md:px-8 py-3 flex items-center justify-between shadow-md text-white">

        {/* Brand */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <img
              src="/cs-logo-white.png"
              alt="CivicSnap"
              className="h-8 md:h-9 w-auto object-contain transition hover:scale-105"
            />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-5 text-xs font-black text-slate-300">
            <button onClick={() => setActiveTab('map')} className={`hover:text-white transition cursor-pointer ${activeTab === 'map' ? 'text-white border-b-2 border-emerald-400 pb-0.5' : ''}`}>Map</button>
            <button onClick={() => setActiveTab('feed')} className={`hover:text-white transition cursor-pointer ${activeTab === 'feed' ? 'text-white border-b-2 border-emerald-400 pb-0.5' : ''}`}>My Reports</button>
            {/* <button onClick={() => setActiveTab('feed')} className={`hover:text-white transition cursor-pointer ${activeTab === 'feed' ? 'text-white border-b-2 border-emerald-400 pb-0.5' : ''}`}>Community Feed</button> */}
            {/* <button onClick={() => setIsNotifModalOpen(true)} className="hover:text-white transition cursor-pointer">Alerts</button> */}
            {/* <button onClick={() => setIsProfileModalOpen(true)} className="hover:text-white transition cursor-pointer">Profile</button> */}
          </nav>
        </div>

        {/* Top Right Quick Actions — Dark Green Buttons */}
        <div className="flex items-center space-x-3">

          {/* Notifications Bell Button */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="p-2 rounded-full bg-[#0C3D24] hover:bg-emerald-900 border border-emerald-800 flex items-center justify-center text-white transition relative cursor-pointer shadow-sm"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 text-white" />
            <span className="w-2 h-2 bg-emerald-400 rounded-full absolute top-1 right-1"></span>
          </button>

          {/* User Profile Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0C3D24] hover:bg-emerald-900 border border-emerald-800/60 rounded-full text-xs font-bold transition cursor-pointer shadow-sm"
            aria-label="View profile"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
              👤
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-black text-white leading-tight">{user?.name || 'Municipal Corporation'}</div>
              <div className="text-[9px] text-emerald-300 font-semibold leading-tight">{currentCity}</div>
            </div>
          </button>

        </div>

      </header>

      {/* 2. Main Content Layout */}
      <main className="max-w-5xl mx-auto w-full px-4 md:px-8 pt-6 space-y-8">

        {/* DOMINANT CORE HERO: Big Central Camera Action */}
        <section className="bg-pista-100 rounded-md p-6 md:p-8 border border-pista-400 relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            <div className="space-y-3 text-center md:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-bottle-900 text-pista-100 font-extrabold rounded-full text-xs border border-bottle-800 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-pista-300" />
                1-Tap AI Reporting
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-bottle-900 tracking-tight leading-tight">
                See a Pothole or Trash? <br />
                <span className="text-bottle-800">
                  Report it Instantly!
                </span>
              </h2>
              <p className="text-slate-800 text-xs md:text-sm leading-relaxed font-semibold">
                Take a photo of any community problem. CivicSnap automatically detects the issue and routes it directly to your municipal authority.
              </p>
            </div>

            {/* DOMINANT CENTRAL CAMERA REPORT BUTTON — DARK BOTTLE GREEN */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full md:w-auto min-h-[64px] px-8 py-5 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-lg rounded-md transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-bottle-950/40 flex items-center justify-center gap-3 shrink-0 cursor-pointer border border-bottle-700"
            >
              <Camera className="w-8 h-8 text-white stroke-[2.5]" />
              <span>SNAP & REPORT ISSUE</span>
            </button>

          </div>
        </section>

        {/* Tab Navigation Content */}
        <div className="space-y-6">

          {/* Section Selector Pills */}
          <div className="flex items-center gap-2 border-b border-pista-400 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('feed')}
              className={`min-h-[48px] px-5 py-2.5 rounded-md text-xs font-black flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'feed'
                ? 'bg-bottle-800 text-white shadow-md shadow-bottle-950/30 border border-bottle-700'
                : 'bg-bottle-900 text-white border border-bottle-800 hover:bg-bottle-800'
                }`}
            >
              <FileText className="w-4 h-4 text-white" />
              <span>My Reports ({myReports.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`min-h-[48px] px-5 py-2.5 rounded-md text-xs font-black flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'map'
                ? 'bg-bottle-800 text-white shadow-md shadow-bottle-950/30 border border-bottle-700'
                : 'bg-bottle-900 text-white border border-bottle-800 hover:bg-bottle-800'
                }`}
            >
              <MapPin className="w-4 h-4 text-white" />
              <span>Community Map</span>
            </button>
          </div>

          {/* My Reports Feed (STRICT CITIZEN ISOLATION) */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {myReports.length === 0 ? (
                /* Accessible Empty State */
                <div className="bg-pista-100 rounded-md p-10 md:p-14 border border-pista-400 text-center space-y-4 shadow-md">
                  <div className="w-16 h-16 rounded-md bg-bottle-900 border border-bottle-800 flex items-center justify-center text-pista-300 mx-auto shadow-inner">
                    <FileText className="w-8 h-8 text-pista-300" />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="text-xl font-black text-bottle-900">You Haven't Reported Anything Yet</h3>
                    <p className="text-slate-700 leading-relaxed font-semibold text-xs">
                      Whenever you see potholes, garbage dumps, or water leaks, tap the Camera button to file a report.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="min-h-[48px] px-6 py-3 bg-bottle-800 hover:bg-bottle-600 text-white font-extrabold text-xs rounded-xl transition inline-flex items-center gap-2 shadow-md shadow-bottle-950/30 cursor-pointer border border-bottle-700"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    Report Your First Issue Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {myReports.map((report, i) => {
                    const imageUrl = getFullImageUrl(report.image_url, BACKEND_URL);
                    const mapsUrl = `https://www.google.com/maps?q=${report.latitude || 19.0760},${report.longitude || 72.8777}`;

                    return (
                      <div key={i} className="bg-pista-100 rounded-3xl p-5 border border-pista-400 space-y-4 shadow-md flex flex-col justify-between hover:border-bottle-800 transition">

                        <div className="space-y-3">
                          {/* Card Header: Category & Status */}
                          <div className="flex items-start justify-between gap-2 border-b border-pista-300 pb-2.5">
                            <div>
                              <span className="text-xs font-black text-bottle-800 uppercase tracking-wider block">
                                {report.category || 'Civic Issue'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-bottle-800" /> {report.department || 'Municipal Corporation'}
                              </span>
                            </div>

                            <span className={`text-[10px] px-2.5 py-1 rounded-md font-extrabold shrink-0 ${report.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : report.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                              {report.status || 'Pending'}
                            </span>
                          </div>

                          {/* Uploaded Evidence Image */}
                          {imageUrl && (
                            <div
                              onClick={() => setSelectedDetailReport(report)}
                              className="relative w-full h-44 rounded-2xl bg-slate-900 border border-pista-400 overflow-hidden cursor-pointer group"
                            >
                              <img
                                src={imageUrl}
                                alt="Report Evidence"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  const reportId = report.id || report.report_id;
                                  e.target.src = reportId ? `${BACKEND_URL}/api/reports/stream-image/${reportId}` : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
                                }}
                              />
                              <div className="absolute inset-0 bg-bottle-950/20 group-hover:bg-bottle-950/10 transition"></div>
                              <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-bottle-900/90 text-white text-[10px] font-bold rounded-lg border border-bottle-700 backdrop-blur-md">
                                📍 {report.city_name || 'Mumbai'}
                              </span>
                            </div>
                          )}

                          {/* Report Body / Description */}
                          <div className="space-y-1">
                            <p className="text-xs text-slate-800 font-semibold leading-relaxed line-clamp-3">
                              {report.description || 'Reported civic issue requiring municipal attention.'}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer: Timestamp & Google Maps Link */}
                        <div className="pt-3 border-t border-pista-300 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-bottle-800" />
                            {formatReportDate(report.created_at)}
                          </span>

                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bottle-900 hover:bg-bottle-800 text-pista-100 font-extrabold text-[11px] rounded-xl border border-bottle-700 transition shadow-xs"
                            title="Open location in Google Maps"
                          >
                            <MapPin className="w-3.5 h-3.5 text-pista-300" />
                            <span>Google Maps</span>
                            <ExternalLink className="w-3 h-3 text-pista-300" />
                          </a>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Community Map Tab / Desktop Widescreen Layout */}
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left 2 Cols: Interactive GIS Map */}
              <div className="lg:col-span-2 space-y-4">
                <CommunityMap reports={publicReports} />
              </div>

              {/* Right Col: Live Reports Sidebar */}
              <div className="bg-white rounded-2xl p-4 border border-pista-400 shadow-md space-y-4 flex flex-col justify-between">

                <div className="space-y-4">
                  {/* Live Reports Header with + New Report Button */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#072818] tracking-tight">
                      Live Reports ({publicReports.length})
                    </h3>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="px-3 py-1.5 bg-[#072818] hover:bg-[#0D472B] text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1 cursor-pointer border border-bottle-700"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>+ New Report</span>
                    </button>
                  </div>

                  {/* Category Pills Selector */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-black">
                    {['All', 'Water', 'Garbage', 'Roads', 'Electricity', 'Drains', 'Parks', 'Others'].map((cat, i) => (
                      <button
                        key={cat}
                        className={`px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition ${i === 0
                          ? 'bg-[#072818] text-white shadow-2xs'
                          : 'bg-pista-100 text-slate-700 hover:bg-pista-200 border border-pista-300'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Sidebar Reports List */}
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {(publicReports.length > 0 ? publicReports : [
                      {
                        id: 'CS-2025-1483',
                        category: 'Water Leakage',
                        city_name: 'Andheri West, Mumbai',
                        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
                        status: 'In Progress',
                        image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80'
                      },
                      {
                        id: 'CS-2025-1482',
                        category: 'Garbage Overflow',
                        city_name: 'Bandra East, Mumbai',
                        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
                        status: 'Resolved',
                        image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80'
                      },
                      {
                        id: 'CS-2025-1481',
                        category: 'Street Light Not Working',
                        city_name: 'Powai, Mumbai',
                        created_at: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
                        status: 'Pending',
                        image_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&auto=format&fit=crop&q=80'
                      },
                      {
                        id: 'CS-2025-1480',
                        category: 'Pothole on Road',
                        city_name: 'Ghatkopar, Mumbai',
                        created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
                        status: 'In Progress',
                        image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'
                      }
                    ]).map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedDetailReport(item)}
                        className="p-2.5 bg-pista-50/70 hover:bg-pista-100 rounded-xl border border-pista-300 flex items-center justify-between gap-3 transition cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-pista-400">
                            <img
                              src={getFullImageUrl(item.image_url, BACKEND_URL) || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80'}
                              alt={item.category}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold text-slate-500">#{item.id}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${item.status === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-900'
                                : item.status === 'In Progress'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-800'
                                }`}>
                                {item.status}
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-[#072818] mt-0.5">{item.category}</h4>
                            <p className="text-[10px] text-slate-600 font-semibold">{item.city_name || 'Mumbai'}</p>
                          </div>
                        </div>

                        <span className="text-slate-400 font-black text-sm">&gt;</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Skyline Card inside Sidebar */}
                <div className="bg-[#E0F0DA] p-3 rounded-xl border border-pista-300 flex items-center justify-between text-[#072818] mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🍃</span>
                    <div>
                      <span className="font-black text-xs block leading-tight">CivicSnap</span>
                      <span className="text-[9px] font-semibold text-slate-700 block">Citizens Today, Better Cities Tomorrow</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      {/* 3. BOTTOM NAVIGATION BAR — DARK BOTTLE GREEN */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[2000] bg-bottle-900 border-t border-bottle-800 px-3 py-2 md:py-3 shadow-2xl text-white"
        aria-label="Bottom Navigation"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">

          {/* Tab 1: My Reports */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-md transition cursor-pointer ${activeTab === 'feed' ? 'text-white font-black bg-bottle-800/80 px-3 py-1' : 'text-pista-300/80 hover:text-white font-bold'
              }`}
            aria-label="My Reports tab"
          >
            <FileText className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Reports</span>
          </button>

          {/* Tab 2: Community Map */}
          <button
            onClick={() => setActiveTab('map')}
            className={`min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-md transition cursor-pointer ${activeTab === 'map' ? 'text-white font-black bg-bottle-800/80 px-3 py-1' : 'text-pista-300/80 hover:text-white font-bold'
              }`}
            aria-label="Community Map tab"
          >
            <MapPin className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Map</span>
          </button>

          {/* CENTRAL DOMINANT FLOATING ACTION CAMERA BUTTON (FAB) — DARK GREEN */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-16 h-16 min-h-[64px] min-w-[64px] -mt-7 rounded-full bg-bottle-800 hover:bg-bottle-600 text-white shadow-2xl shadow-bottle-950/60 ring-4 ring-bottle-950 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer border border-bottle-700"
            aria-label="Report an issue with camera"
          >
            <Camera className="w-8 h-8 text-white stroke-[2.5]" />
          </button>

          {/* Tab 3: Notifications */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-md text-pista-300/80 hover:text-white font-bold transition relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Alerts</span>
          </button>

          {/* Tab 4: Profile */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-md text-pista-300/80 hover:text-white font-bold transition cursor-pointer"
            aria-label="Profile and Settings"
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Profile</span>
          </button>

        </div>
      </nav>

      {/* Interactive Modals */}
      <ReportIssueModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
      <NotificationsModal isOpen={isNotifModalOpen} onClose={() => setIsNotifModalOpen(false)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      {/* Detailed Report Inspection Modal */}
      {selectedDetailReport && (
        <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-pista-100 max-w-xl w-full rounded-3xl border border-pista-400 shadow-2xl relative my-auto overflow-hidden">

            <div className="bg-bottle-900 text-white p-5 border-b border-bottle-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-white">{selectedDetailReport.category || 'Civic Issue Details'}</h3>
                <p className="text-xs text-pista-300 font-extrabold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-pista-300" />
                  Reported on {formatReportDate(selectedDetailReport.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetailReport(null)}
                className="w-9 h-9 rounded-full bg-bottle-800 hover:bg-bottle-700 border border-bottle-700 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* Evidence Image */}
              {selectedDetailReport.image_url && (
                <div className="relative h-56 rounded-2xl bg-slate-950 border border-pista-400 overflow-hidden shadow-inner">
                  <img
                    src={getFullImageUrl(selectedDetailReport.image_url, BACKEND_URL)}
                    alt="Report Evidence"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      const reportId = selectedDetailReport.id || selectedDetailReport.report_id;
                      e.target.src = reportId ? `${BACKEND_URL}/api/reports/stream-image/${reportId}` : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute bottom-2 left-2 px-3 py-1 bg-bottle-900/90 text-pista-200 text-xs font-black rounded-xl border border-bottle-700 backdrop-blur-md">
                    📍 {selectedDetailReport.city_name || 'Mumbai'}
                  </div>
                </div>
              )}

              {/* Department & Status */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-pista-300 text-xs">
                <div>
                  <span className="text-[10px] font-black text-bottle-800 uppercase block">Assigned Department</span>
                  <span className="font-bold text-slate-900">{selectedDetailReport.department || 'Municipal Corporation'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-bottle-800 uppercase block">Current Status</span>
                  <span className="font-bold text-emerald-800">{selectedDetailReport.status || 'Pending'}</span>
                </div>
              </div>

              {/* Report Body / Description */}
              <div className="space-y-1">
                <span className="text-[11px] font-black text-bottle-800 uppercase block">Report Body / Description</span>
                <p className="p-3 bg-white border border-pista-300 rounded-xl text-xs font-semibold text-slate-800 leading-relaxed">
                  {selectedDetailReport.description || 'Reported civic issue registered via CivicSnap.'}
                </p>
              </div>

              {/* SOAP Note Format Transcript */}
              {selectedDetailReport.soap_transcript && (
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-bottle-800 uppercase block">Structured SOAP Note Transcript</span>
                  <div className="p-3 bg-white border border-pista-300 rounded-xl font-mono text-[11px] text-slate-800 whitespace-pre-wrap shadow-inner max-h-40 overflow-y-auto">
                    {selectedDetailReport.soap_transcript}
                  </div>
                </div>
              )}

              {/* Direct Google Maps Action Button */}
              <a
                href={`https://www.google.com/maps?q=${selectedDetailReport.latitude || 19.0760},${selectedDetailReport.longitude || 72.8777}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-bottle-800 hover:bg-bottle-600 text-white font-black text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-2 border border-bottle-700"
              >
                <MapPin className="w-4 h-4 text-pista-300" />
                <span>Open Location in Google Maps ↗</span>
                <ExternalLink className="w-3.5 h-3.5 text-pista-300" />
              </a>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
