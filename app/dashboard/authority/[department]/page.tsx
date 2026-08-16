'use client';

import React, { useState } from 'react';
import Header from '../../../../components/common/Header';
import { useAccessibility } from '../../../../context/AccessibilityContext';
import { playFeedback } from '../../../../lib/feedback';
import { 
  Building2, 
  Truck, 
  Trash2, 
  Utensils, 
  Trees, 
  Landmark, 
  Home, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Filter, 
  ShieldCheck, 
  Search,
  Map as MapIcon,
  FileText,
  User,
  Settings,
  Inbox,
  Layers,
  Sparkles,
  MapPin,
  X,
  Wrench,
  ChevronRight
} from 'lucide-react';

interface AuthorityDeptConfig {
  name: string;
  shortName: string;
  icon: React.ElementType;
  color: string;
  badge: string;
}

const DEPARTMENT_CONFIGS: Record<string, AuthorityDeptConfig> = {
  'road-and-transport-authority': {
    name: 'Road & Transport Authority',
    shortName: 'Road & Transport',
    icon: Truck,
    color: 'amber',
    badge: 'RTA-DEPT-101'
  },
  'garbage-and-waste-management-authority': {
    name: 'Garbage & Waste Management Authority',
    shortName: 'Garbage & Waste',
    icon: Trash2,
    color: 'emerald',
    badge: 'GWMA-DEPT-202'
  },
  'food-and-drug-authority': {
    name: 'Food & Drug Authority',
    shortName: 'Food & Drug',
    icon: Utensils,
    color: 'rose',
    badge: 'FDA-DEPT-303'
  },
  'forest-department': {
    name: 'Forest Department',
    shortName: 'Forest Dept',
    icon: Trees,
    color: 'green',
    badge: 'FD-DEPT-404'
  },
  'municipal-corporation': {
    name: 'Municipal Corporation',
    shortName: 'Municipal Corp',
    icon: Building2,
    color: 'indigo',
    badge: 'MC-DEPT-505'
  },
  'nagar-panchayat': {
    name: 'Nagar Panchayat',
    shortName: 'Nagar Panchayat',
    icon: Landmark,
    color: 'sky',
    badge: 'NP-DEPT-606'
  },
  'gram-panchayat': {
    name: 'Gram Panchayat',
    shortName: 'Gram Panchayat',
    icon: Home,
    color: 'purple',
    badge: 'GP-DEPT-707'
  }
};

interface ReportItem {
  id: string;
  issue: string;
  location: string;
  reportedDate: string;
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  reportedBy: string;
}

export default function AuthorityDepartmentDashboardPage({
  params
}: {
  params: { department: string }
}) {
  const deptSlug = params?.department || 'road-and-transport-authority';
  const deptConfig: AuthorityDeptConfig = DEPARTMENT_CONFIGS[deptSlug] || {
    name: deptSlug.replace(/-/g, ' ').toUpperCase(),
    shortName: deptSlug.replace(/-/g, ' '),
    icon: Building2,
    color: 'amber',
    badge: 'DEPT-STAFF-99'
  };

  const DeptIcon = deptConfig.icon;

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [showSampleData, setShowSampleData] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const [staffProfile, setStaffProfile] = useState({
    name: 'Officer Rajesh Verma',
    badgeId: deptConfig.badge,
    phone: '+91 98765 00000',
    email: `officer@${deptSlug}.gov.in`,
    department: deptConfig.name,
    jurisdiction: 'Ward 14 (Central Metro)'
  });

  const handleToggleSampleData = () => {
    if (showSampleData) {
      setReports([]);
      setShowSampleData(false);
      playFeedback('click', 'Cleared department reports');
    } else {
      setReports([
        {
          id: 'CS-2026-801',
          issue: 'Damaged Highway Asphalt & Culvert Hazard',
          location: 'Sector 4 Metro Corridor, Ward 14',
          reportedDate: '2026-08-15T09:30:00Z',
          status: 'in_progress',
          priority: 'high',
          reportedBy: 'Aarav Sharma'
        },
        {
          id: 'CS-2026-802',
          issue: 'Uncollected Industrial Waste Spill',
          location: 'Industrial Zone Gate 2, Ward 14',
          reportedDate: '2026-08-16T08:15:00Z',
          status: 'pending',
          priority: 'high',
          reportedBy: 'Priya Sundaram'
        },
        {
          id: 'CS-2026-803',
          issue: 'Routine Ground Inspection Ticket',
          location: 'Central Market Lane 5, Ward 09',
          reportedDate: '2026-08-12T11:00:00Z',
          status: 'resolved',
          priority: 'medium',
          reportedBy: 'Vikram Mehta'
        }
      ]);
      setShowSampleData(true);
      playFeedback('success', 'Loaded department reports');
    }
  };

  const updateReportStatus = (id: string, newStatus: 'in_progress' | 'resolved') => {
    setReports(prev =>
      prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
    );
    playFeedback('success', `Status updated to ${newStatus.replace('_', ' ')}`);
  };

  const renderStatusBadge = (status: 'pending' | 'in_progress' | 'resolved') => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <Wrench className="w-3 h-3" />
            <span>In Progress</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesPriority = filterPriority === 'all' || r.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      r.issue.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const totalCount = reports.length;
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const inProgressCount = reports.filter(r => r.status === 'in_progress').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header 
        userRole="authority" 
        userName={staffProfile.name} 
        departmentName={deptConfig.name} 
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Prominent Header Banner */}
        <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-800 to-indigo-500/10 border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-amber-500/10">
              <DeptIcon className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Approved Staff
                </span>
                <span className="text-xs text-slate-400 font-mono">Badge: {deptConfig.badge}</span>
              </div>
              
              <h2 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center gap-2">
                <span>{deptConfig.name}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Departmental ticket queue & SLA resolution monitoring.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSampleData}
              className="text-xs font-semibold text-amber-400 hover:underline min-h-[44px] px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
              {showSampleData ? 'Clear Reports' : 'Load Sample Reports'}
            </button>
          </div>
        </div>

        {/* Overview Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Reports</div>
              <div className="text-xl font-bold font-heading text-slate-100">{totalCount}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending</div>
              <div className="text-xl font-bold font-heading text-slate-100">{pendingCount}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Progress</div>
              <div className="text-xl font-bold font-heading text-slate-100">{inProgressCount}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolved</div>
              <div className="text-xl font-bold font-heading text-slate-100">{resolvedCount}</div>
            </div>
          </div>
        </div>

        {/* 🌟 RESPONSIVE DESKTOP SIDE-BY-SIDE LAYOUT (Table left 7 cols, Map right 5 cols on lg:) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: INCOMING REPORTS TABLE (lg:col-span-7) */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold font-heading text-slate-100">
                  {deptConfig.shortName} Incoming Queue
                </h3>
                <p className="text-xs text-slate-400">
                  Manage ticket allocation & dispatch field crews
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search ticket..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="px-3 py-2 pl-8 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-36"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Issue & Location</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <div className="text-xs font-bold text-slate-400">No reports in queue</div>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map(item => (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-bold font-heading text-slate-200">{item.id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{item.issue}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {renderStatusBadge(item.status)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.status === 'pending' && (
                              <button
                                onClick={() => updateReportStatus(item.id, 'in_progress')}
                                className="min-h-[36px] px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] transition-colors"
                              >
                                Dispatch
                              </button>
                            )}
                            {item.status === 'in_progress' && (
                              <button
                                onClick={() => updateReportStatus(item.id, 'resolved')}
                                className="min-h-[36px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                              >
                                Resolve
                              </button>
                            )}
                            {item.status === 'resolved' && (
                              <span className="text-[11px] text-emerald-400 font-bold">Done</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT COLUMN: DEPARTMENT LEAFLET GIS MAP (lg:col-span-5) */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-heading text-slate-200">
                  {deptConfig.shortName} GIS Map
                </h3>
                <p className="text-xs text-slate-500">Spatial view for field dispatch</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Layers className="w-3 h-3" /> LEAFLET MAP
              </span>
            </div>

            <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#f59e0b 1px, transparent 1px), radial-gradient(#6366f1 1px, #0f172a 1px)`,
                  backgroundSize: `40px 40px`,
                  backgroundPosition: `0 0, 20px 20px`
                }}
              />

              <div className="relative z-10 text-center space-y-3 max-w-xs p-5 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <DeptIcon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">
                  {deptConfig.shortName} Spatial Layer
                </h4>
                <p className="text-[11px] text-slate-400">
                  Leaflet map layer ready to render geo-tagged tickets for desktop office staff.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
