import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CommunityMap from '../components/CommunityMap';
import ReportIssueModal from '../components/ReportIssueModal';
import NotificationsModal from '../components/NotificationsModal';
import ProfileModal from '../components/ProfileModal';
import { 
  Camera, 
  MapPin, 
  Bell, 
  User, 
  FileText, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (token) {
      setLoadingReports(true);
      fetch(`${BACKEND_URL}/api/reports/citizen`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.reports) setReports(data.reports);
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingReports(false));
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between pb-28 md:pb-12">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-[100] bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-2xl shadow-lg shadow-emerald-500/20">
            📸
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              CivicSnap
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Citizen Reporting Portal</p>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center space-x-2.5">
          
          {/* Notifications Bell Button */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition relative"
            aria-label="View notifications"
          >
            <Bell className="w-6 h-6 text-slate-300" />
            <span className="w-2.5 h-2.5 bg-sky-400 rounded-full absolute top-3 right-3 ring-2 ring-slate-950"></span>
          </button>

          {/* User Profile Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="h-12 min-h-[48px] px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 flex items-center gap-2 text-slate-200 transition"
            aria-label="View profile"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold">
              {user?.name ? user.name[0].toUpperCase() : 'C'}
            </div>
            <span className="text-xs font-bold hidden sm:inline text-white max-w-[100px] truncate">
              {user?.name || 'Citizen'}
            </span>
          </button>

        </div>

      </header>

      {/* 2. Main Content Layout */}
      <main className="max-w-5xl mx-auto w-full px-4 md:px-8 pt-6 space-y-8">
        
        {/* DOMINANT CORE HERO: Big Central Camera Action */}
        <section className="glass-card rounded-3xl p-6 md:p-8 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="space-y-3 text-center md:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-xs border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                1-Tap AI Reporting
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                See a Pothole or Trash? Report it Instant!
              </h2>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                Take a photo of any community problem. CivicSnap automatically detects the issue and routes it directly to your municipal authority.
              </p>
            </div>

            {/* DOMINANT CENTRAL CAMERA REPORT BUTTON */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full md:w-auto min-h-[64px] px-8 py-5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-lg rounded-2xl transition-all transform hover:scale-[1.03] active:scale-[0.98] shadow-2xl shadow-emerald-500/40 flex items-center justify-center gap-3 shrink-0 cursor-pointer"
            >
              <Camera className="w-8 h-8 text-slate-950 stroke-[2.5]" />
              <span>SNAP & REPORT ISSUE</span>
            </button>

          </div>
        </section>

        {/* Tab Navigation Content */}
        <div className="space-y-6">
          
          {/* Section Selector Pills */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('feed')}
              className={`min-h-[48px] px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'feed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Reports ({reports.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`min-h-[48px] px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'map'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Community Map</span>
            </button>
          </div>

          {/* My Reports Feed */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                /* Accessible Empty State */
                <div className="glass-card rounded-3xl p-10 md:p-14 border border-slate-800 text-center space-y-4 shadow-xl">
                  <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto shadow-inner">
                    <FileText className="w-8 h-8 text-slate-500" />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="text-xl font-extrabold text-white">You Haven't Reported Anything Yet</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Whenever you see potholes, garbage dumps, or water leaks, tap the Camera button to file a report.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="min-h-[48px] px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Camera className="w-4 h-4" />
                    Report Your First Issue Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports.map((report, i) => (
                    <div key={i} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{report.category}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-md font-semibold">
                          {report.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{report.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Community Map Tab */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              <CommunityMap reports={reports} />
            </div>
          )}

        </div>

      </main>

      {/* 3. ACCESSIBLE BOTTOM NAVIGATION BAR (Mobile-First, Min 48px Touch Targets) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-[2000] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 px-3 py-2 md:py-3 shadow-2xl"
        aria-label="Bottom Navigation"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          {/* Tab 1: My Reports */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-2xl transition ${
              activeTab === 'feed' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="My Reports tab"
          >
            <FileText className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Reports</span>
          </button>

          {/* Tab 2: Community Map */}
          <button
            onClick={() => setActiveTab('map')}
            className={`min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-2xl transition ${
              activeTab === 'map' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Community Map tab"
          >
            <MapPin className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Map</span>
          </button>

          {/* CENTRAL DOMINANT FLOATING ACTION CAMERA BUTTON (FAB) */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-16 h-16 min-h-[64px] min-w-[64px] -mt-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-2xl shadow-emerald-500/50 ring-4 ring-slate-950 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
            aria-label="Report an issue with camera"
          >
            <Camera className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </button>

          {/* Tab 3: Notifications */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-2xl text-slate-400 hover:text-slate-200 transition relative"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Alerts</span>
          </button>

          {/* Tab 4: Profile */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-2xl text-slate-400 hover:text-slate-200 transition"
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

    </div>
  );
}
