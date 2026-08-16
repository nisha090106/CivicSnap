'use client';

import React, { useState } from 'react';
import Header from '../../../components/common/Header';
import BottomNav from '../../../components/common/BottomNav';
import { useAccessibility } from '../../../context/AccessibilityContext';
import { playFeedback } from '../../../lib/feedback';
import { 
  Camera, 
  MapPin, 
  Bell, 
  User, 
  FileText, 
  Sparkles, 
  Map as MapIcon, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Clock,
  Wrench,
  Inbox,
  Layers,
  Volume2
} from 'lucide-react';

interface ComplaintItem {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  location: string;
  reportedAt: string;
  image: string;
}

export default function CitizenDashboardPage() {
  const { fontScale, audioAssist } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'reports' | 'map' | 'profile'>('reports');
  const [reports, setReports] = useState<ComplaintItem[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: 'Aarav Sharma',
    phone: '+91 98765 43210',
    email: 'aarav.sharma@example.com',
    ward: 'Ward 14 (Central Metro)',
    language: 'English',
  });

  const handleToggleSampleData = () => {
    if (showSampleData) {
      setReports([]);
      setShowSampleData(false);
      playFeedback('click', 'Cleared sample reports');
    } else {
      setReports([
        {
          id: 'CS-2026-901',
          title: 'Deep Asphalt Pothole on Outer Ring Road',
          category: 'Road & Transport Authority',
          status: 'in_progress',
          priority: 'high',
          location: 'Near Metro Pillar 142, Ward 14',
          reportedAt: '2026-08-15T09:30:00Z',
          image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
        },
        {
          id: 'CS-2026-902',
          title: 'Overflowing Waste Bin Outside Market',
          category: 'Garbage & Waste Management Authority',
          status: 'pending',
          priority: 'medium',
          location: 'Green Park Market Square, Ward 14',
          reportedAt: '2026-08-16T08:15:00Z',
          image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800',
        }
      ]);
      setShowSampleData(true);
      playFeedback('success', 'Sample reports loaded');
    }
  };

  const handleCreateMockReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: ComplaintItem = {
      id: `CS-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: 'Pothole & Damaged Surface',
      category: 'Road & Transport Authority',
      status: 'pending',
      priority: 'high',
      location: 'Block B Market Road, Ward 14',
      reportedAt: new Date().toISOString(),
      image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800'
    };
    setReports(prev => [newReport, ...prev]);
    setIsReportModalOpen(false);
    playFeedback('success', 'Issue report submitted successfully!');
  };

  // Helper for status badge pairing color AND distinct icon (for colorblind accessibility)
  const renderStatusBadge = (status: 'pending' | 'in_progress' | 'resolved') => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <Wrench className="w-3.5 h-3.5" />
            <span>In Progress</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pb-20 sm:pb-6">
      <Header userRole="citizen" userName={userProfile.name} />

      <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
        
        {/* 🌟 ICON-FIRST CORE ACTION HERO BUTTON (Min Touch Target 56px, 2-3 Taps to Report) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 border border-emerald-500/30 p-6 sm:p-10 shadow-2xl shadow-emerald-950/50 text-center">
          <div className="relative z-10 max-w-xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold border border-emerald-400/30">
              <Camera className="w-4 h-4" /> 1-TAP ISSUE REPORT
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight leading-tight">
              Spotted a Problem in Your Area?
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/90">
              Take a photo of potholes, trash, or water leaks. Simple icon navigation designed for everyone.
            </p>

            {/* GIANT THUMB-REACHABLE CAMERA BUTTON (Min 56px height) */}
            <div className="pt-2">
              <button
                onClick={() => {
                  playFeedback('click', 'Opening issue reporter');
                  setIsReportModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 sm:py-5 rounded-2xl bg-white text-emerald-950 font-extrabold text-base sm:text-lg shadow-2xl shadow-emerald-900/50 hover:bg-emerald-50 active:scale-[0.98] transition-all duration-200 min-h-[56px] cursor-pointer"
                aria-label="Report Civic Problem Now"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <span>Report an Issue Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Desktop view, Hidden on mobile bottom nav) */}
        <div className="hidden sm:flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playFeedback('click', 'My Reports');
                setActiveTab('reports');
              }}
              className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>My Reports ({reports.length})</span>
            </button>

            <button
              onClick={() => {
                playFeedback('click', 'Community Map');
                setActiveTab('map');
              }}
              className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'map'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-5 h-5" />
              <span>Community Map</span>
            </button>

            <button
              onClick={() => {
                playFeedback('click', 'Profile');
                setActiveTab('profile');
              }}
              className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile & Settings</span>
            </button>
          </div>

          <button
            onClick={handleToggleSampleData}
            className="text-xs font-semibold text-slate-500 hover:text-slate-300 underline min-h-[44px] px-2"
          >
            {showSampleData ? 'Clear Reports' : 'Load Sample Reports'}
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: MY REPORTS (WITH AUTHENTIC EMPTY STATE) */}
        {/* =================================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              /* ICON-FIRST EMPTY STATE */
              <div className="glass-card p-10 sm:p-14 text-center rounded-3xl border border-dashed border-slate-800 space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Inbox className="w-10 h-10 text-emerald-500/80" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-heading text-slate-100">
                    You haven't reported anything yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you notice potholes, garbage dumps, or broken lights, tap the camera button to report.
                  </p>
                </div>

                <button
                  onClick={() => {
                    playFeedback('click', 'Creating issue report');
                    setIsReportModalOpen(true);
                  }}
                  className="min-h-[48px] inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Camera className="w-5 h-5" />
                  <span>Report Your First Problem</span>
                </button>
              </div>
            ) : (
              /* REPORTS LIST WITH COLOR + ICON PAIRING FOR ACCESSIBILITY */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map(item => (
                  <div key={item.id} className="glass-card p-4 rounded-2xl flex gap-4 items-center">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-24 h-24 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        {renderStatusBadge(item.status)}
                        <span className="text-[10px] font-mono text-slate-500">{item.id}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 truncate">{item.title}</h4>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: COMMUNITY MAP (PLACEHOLDER LEAFLET MAP SHELL) */}
        {/* =================================================================== */}
        {activeTab === 'map' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-heading text-slate-200">
                  Ward 14 Community Map
                </h3>
                <p className="text-xs text-slate-400">
                  Placeholder Leaflet map layer (Spatial pins populated in Phase 2)
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> LEAFLET MAP
              </span>
            </div>

            <div className="relative w-full h-80 sm:h-96 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#10b981 1px, transparent 1px), radial-gradient(#6366f1 1px, #0f172a 1px)`,
                  backgroundSize: `40px 40px`,
                  backgroundPosition: `0 0, 20px 20px`
                }}
              />

              <div className="relative z-10 text-center space-y-3 max-w-xs p-6 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                  <MapIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">
                  Ward 14 Map Placeholder
                </h4>
                <p className="text-xs text-slate-400">
                  Leaflet map layer initialized. GIS pins will display reported issues in Phase 2.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: PROFILE / SETTINGS */}
        {/* =================================================================== */}
        {activeTab === 'profile' && (
          <div className="glass-card p-6 rounded-3xl max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
                {userProfile.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">{userProfile.name}</h3>
                <p className="text-xs text-slate-400">Citizen Reporter • {userProfile.ward}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={e => setUserProfile({ ...userProfile, name: e.target.value })}
                  className="w-full min-h-[48px] px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={userProfile.phone}
                  onChange={e => setUserProfile({ ...userProfile, phone: e.target.value })}
                  className="w-full min-h-[48px] px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  App Language (i18n Ready)
                </label>
                <select
                  value={userProfile.language}
                  onChange={e => setUserProfile({ ...userProfile, language: e.target.value })}
                  className="w-full min-h-[48px] px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="English">English (Default)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb reachable min 48x48px targets) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        reportsCount={reports.length}
      />

      {/* PLACEHOLDER MODAL FOR REPORT AN ISSUE */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-6 h-6 text-emerald-500" />
                <h3 className="text-base font-bold font-heading text-slate-100">
                  Report Problem
                </h3>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI Photo Classification (Phase 2)
              </div>
              <p className="text-[11px] text-emerald-300/80">
                In Phase 2, taking a photo will automatically classify the category and department.
              </p>
            </div>

            <form onSubmit={handleCreateMockReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Photo Evidence
                </label>
                <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center bg-slate-950 hover:border-emerald-500/50 transition-colors cursor-pointer">
                  <Camera className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-200">Tap camera to take photo</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[52px] px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base transition-colors shadow-lg shadow-emerald-600/20"
              >
                Submit Issue Report
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
