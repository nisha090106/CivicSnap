import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Sliders, 
  Users, 
  BarChart3, 
  Settings, 
  Building2, 
  ShieldCheck,
  Camera,
  AlertCircle
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const { complaints, setIsNewModalOpen } = useComplaints();

  if (!user) return null;

  // Filter complaints based on role for nav count badges
  const citizenCount = complaints.filter(c => c.reporterId === user.id || user.role === 'citizen').length;
  const deptCount = complaints.filter(c => c.department === user.department || user.role !== 'officer').length;
  const pendingDeptCount = complaints.filter(c => (c.department === user.department || user.role !== 'officer') && (c.status === 'pending' || c.status === 'in_progress')).length;

  const getNavItems = () => {
    if (user.role === 'citizen') {
      return [
        { id: 'overview', label: 'My Complaints', icon: FileText, badge: citizenCount },
        { id: 'new_report', label: 'Report Issue', icon: Camera, isAction: true },
        { id: 'public_feed', label: 'Public Ward Feed', icon: LayoutDashboard },
        { id: 'map_shell', label: 'Ward Map (Phase 2)', icon: MapPin }
      ];
    }

    if (user.role === 'officer') {
      return [
        { id: 'dept_queue', label: 'Department Queue', icon: FileText, badge: pendingDeptCount },
        { id: 'sla_monitor', label: 'SLA & Priority', icon: Clock },
        { id: 'resolved_history', label: 'Resolution Archive', icon: CheckCircle2 },
        { id: 'dept_analytics', label: 'Dept Analytics', icon: BarChart3 }
      ];
    }

    if (user.role === 'admin') {
      return [
        { id: 'admin_overview', label: 'City Command Overview', icon: LayoutDashboard },
        { id: 'dept_performance', label: 'Dept Leaderboard', icon: Building2 },
        { id: 'ai_toggles', label: 'AI Pipeline Flags', icon: Sliders, highlight: true },
        { id: 'officers_roster', label: 'Officer Roster', icon: Users },
        { id: 'system_settings', label: 'System Config', icon: Settings }
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <aside style={{
      width: 260,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between',
      padding: '1.25rem 1rem',
      flexShrink: 0
    }}>
      <div>
        {/* Active Role Badge Header */}
        <div style={{
          padding: '0.875rem',
          borderRadius: 'var(--radius-md)',
          background: user.role === 'admin' 
            ? 'rgba(99, 102, 241, 0.1)' 
            : user.role === 'officer' 
            ? 'rgba(245, 158, 11, 0.1)' 
            : 'rgba(16, 185, 129, 0.1)',
          border: '1px solid ' + (user.role === 'admin' ? 'rgba(99, 102, 241, 0.3)' : user.role === 'officer' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'),
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {user.role === 'admin' ? (
            <ShieldCheck size={24} color="#6366f1" />
          ) : user.role === 'officer' ? (
            <Building2 size={24} color="#f59e0b" />
          ) : (
            <Camera size={24} color="#10b981" />
          )}

          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: user.role === 'admin' ? '#818cf8' : user.role === 'officer' ? '#fbbf24' : '#34d399'
            }}>
              {user.role === 'officer' ? `${user.department} Dept` : user.role.toUpperCase() + ' PORTAL'}
            </div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user.role === 'officer' ? user.departmentName : user.ward || user.title || 'Municipal Center'}
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            padding: '0.25rem 0.5rem',
            letterSpacing: '0.05em'
          }}>
            Navigation
          </div>

          {navItems.map(item => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            if (item.isAction) {
              return (
                <button
                  key={item.id}
                  onClick={() => setIsNewModalOpen(true)}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justify: 'flex-start',
                    margin: '0.5rem 0',
                    padding: '0.75rem 1rem'
                  }}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '0.75rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                  background: isActive 
                    ? 'rgba(16, 185, 129, 0.12)' 
                    : item.highlight 
                    ? 'rgba(99, 102, 241, 0.08)' 
                    : 'transparent',
                  color: isActive ? 'var(--primary-500)' : 'var(--text-main)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <IconComponent size={18} color={isActive ? 'var(--primary-500)' : item.highlight ? '#818cf8' : 'var(--text-muted)'} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? 'var(--primary-500)' : 'var(--bg-surface-elevated)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info Box */}
      <div style={{
        padding: '0.875rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-app)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
          <AlertCircle size={14} color="var(--primary-500)" /> Phase 1 Foundation
        </div>
        Civic complaint reporting & authority dashboard shells active.
      </div>
    </aside>
  );
}
