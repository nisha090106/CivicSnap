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
    <div className="min-h-screen bg-emerald-50/40 text-slate-900 flex flex-col justify-between pb-28 md:pb-12 font-sans selection:bg-emerald-200">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-950 text-2xl shadow-inner">
            📸
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-emerald-950 flex items-center gap-2">
              CivicSnap
            </h1>
            <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-widest">Citizen Reporting Portal</p>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center space-x-2.5">
          
          {/* Notifications Bell Button */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-2xl bg-emerald-100 hover:bg-emerald-200/80 border border-emerald-300 flex items-center justify-center text-emerald-900 transition relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-6 h-6 text-emerald-900" />
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full absolute top-3 right-3 ring-2 ring-white"></span>
          </button>

          {/* User Profile Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="h-12 min-h-[48px] px-3.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200/80 border border-emerald-300 flex items-center gap-2 text-emerald-900 transition cursor-pointer"
            aria-label="View profile"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {user?.name ? user.name[0].toUpperCase() : 'C'}
            </div>
            <span className="text-xs font-bold hidden sm:inline text-emerald-950 max-w-[120px] truncate">
              {user?.name || 'Citizen'}
            </span>
          </button>

        </div>

      </header>

      {/* 2. Main Content Layout */}
      <main className="max-w-5xl mx-auto w-full px-4 md:px-8 pt-6 space-y-8">
        
        {/* DOMINANT CORE HERO: Big Central Camera Action */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-200 relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="space-y-3 text-center md:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 font-bold rounded-full text-xs border border-emerald-300 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
                1-Tap AI Reporting
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold text-emerald-950 tracking-tight leading-tight">
                See a Pothole or Trash? <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900">
                  Report it Instantly!
                </span>
              </h2>
              <p className="text-slate-700 text-xs md:text-sm leading-relaxed font-medium">
                Take a photo of any community problem. CivicSnap automatically detects the issue and routes it directly to your municipal authority.
              </p>
            </div>

            {/* DOMINANT CENTRAL CAMERA REPORT BUTTON */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full md:w-auto min-h-[64px] px-8 py-5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-lg rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-900/25 flex items-center justify-center gap-3 shrink-0 cursor-pointer"
            >
              <Camera className="w-8 h-8 text-white stroke-[2.5]" />
              <span>SNAP & REPORT ISSUE</span>
            </button>

          </div>
        </section>

        {/* Tab Navigation Content */}
        <div className="space-y-6">
          
          {/* Section Selector Pills */}
          <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('feed')}
              className={`min-h-[48px] px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20'
                  : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Reports ({reports.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`min-h-[48px] px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20'
                  : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100/60'
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
                <div className="bg-white rounded-3xl p-10 md:p-14 border border-emerald-200 text-center space-y-4 shadow-md">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 mx-auto shadow-inner">
                    <FileText className="w-8 h-8 text-emerald-800" />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="text-xl font-extrabold text-emerald-950">You Haven't Reported Anything Yet</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Whenever you see potholes, garbage dumps, or water leaks, tap the Camera button to file a report.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="min-h-[48px] px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl transition inline-flex items-center gap-2 shadow-md shadow-emerald-900/20 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Report Your First Issue Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports.map((report, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-emerald-200 space-y-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">{report.category}</span>
                        <span className="text-[10px] px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-bold">
                          {report.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{report.description}</p>
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
        className="fixed bottom-0 left-0 right-0 z-[2000] bg-white/95 backdrop-blur-2xl border-t border-emerald-200 px-3 py-2 md:py-3 shadow-2xl"
        aria-label="Bottom Navigation"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          {/* Tab 1: My Reports */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-2xl transition cursor-pointer ${
              activeTab === 'feed' ? 'text-emerald-900 font-extrabold' : 'text-emerald-700 hover:text-emerald-950 font-semibold'
            }`}
            aria-label="My Reports tab"
          >
            <FileText className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Reports</span>
          </button>

          {/* Tab 2: Community Map */}
          <button
            onClick={() => setActiveTab('map')}
            className={`min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-2xl transition cursor-pointer ${
              activeTab === 'map' ? 'text-emerald-900 font-extrabold' : 'text-emerald-700 hover:text-emerald-950 font-semibold'
            }`}
            aria-label="Community Map tab"
          >
            <MapPin className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Map</span>
          </button>

          {/* CENTRAL DOMINANT FLOATING ACTION CAMERA BUTTON (FAB) */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-16 h-16 min-h-[64px] min-w-[64px] -mt-7 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xl shadow-emerald-900/40 ring-4 ring-emerald-50 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Report an issue with camera"
          >
            <Camera className="w-8 h-8 text-white stroke-[2.5]" />
          </button>

          {/* Tab 3: Notifications */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-2xl text-emerald-700 hover:text-emerald-950 font-semibold transition relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Alerts</span>
          </button>

          {/* Tab 4: Profile */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="min-h-[52px] min-w-[52px] flex flex-col items-center justify-center gap-1 rounded-2xl text-emerald-700 hover:text-emerald-950 font-semibold transition cursor-pointer"
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
