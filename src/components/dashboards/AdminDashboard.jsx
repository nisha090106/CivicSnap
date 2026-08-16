import React from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth, DEPARTMENTS } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Building2, 
  Sliders, 
  Users, 
  BarChart3, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ToggleLeft, 
  ToggleRight,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { complaints, aiFeatureFlags, toggleAiFlag, updateAiThreshold, openComplaintDetails } = useComplaints();
  const { user } = useAuth();

  const totalCityTickets = complaints.length;
  const totalResolved = complaints.filter(c => c.status === 'resolved').length;
  const totalInProgress = complaints.filter(c => c.status === 'in_progress').length;
  const totalPending = complaints.filter(c => c.status === 'pending').length;

  const slaPercentage = Math.round((totalResolved / (totalCityTickets || 1)) * 100);

  return (
    <div className="page-wrapper">
      {/* Super Admin Command Banner */}
      <div className="glass-panel" style={{
        padding: '1.75rem 2rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.08))',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: '#818cf8'
          }}>
            <ShieldCheck size={32} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span className="badge badge-priority-medium" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                <Sparkles size={12} /> City Super Admin Command Center
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                All 24 Municipal Wards
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              {user?.name || 'Commissioner Vikramaditya'}
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
              Cross-departmental oversight, SLA monitoring, and Phase 2 AI Pipeline Configuration.
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1.25rem',
          background: 'var(--bg-surface)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>City Resolution Rate</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-500)' }}>{slaPercentage}%</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>AI Pipeline Status</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#818cf8' }}>Active (Phase 1 Shell)</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <BarChart3 size={24} />
          </div>
          <div className="metric-info">
            <h4>City Total Complaints</h4>
            <div className="value">{totalCityTickets}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <h4>In Resolution</h4>
            <div className="value">{totalInProgress}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <h4>Resolved Tickets</h4>
            <div className="value">{totalResolved}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="metric-info">
            <h4>Pending Action</h4>
            <div className="value">{totalPending}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Department Leaderboard, Right = AI Pipeline Toggles */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Department Leaderboard Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Department Performance Leaderboard
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Real-time workload distribution and SLA completion metrics across municipal departments
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {DEPARTMENTS.map(dept => {
              const deptItems = complaints.filter(c => c.department === dept.id);
              const deptResolved = deptItems.filter(c => c.status === 'resolved').length;
              const deptTotal = deptItems.length || 1;
              const pct = Math.round((deptResolved / deptTotal) * 100);

              return (
                <div key={dept.id} style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        color: dept.color
                      }}>
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{dept.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {deptItems.length} Total Complaints ({deptResolved} Resolved)
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.125rem', color: dept.color }}>{pct}%</span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SLA Score</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    background: 'var(--bg-app)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: dept.color,
                      borderRadius: 3,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Pipeline Feature Flags Configuration Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(180deg, var(--bg-glass), rgba(99, 102, 241, 0.05))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Cpu size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Phase 2 AI Pipeline Toggles</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Configure upcoming Phase 2 AI classification & duplicate detection engine flags.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Flag 1: AI Auto Image Classification */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '0.75rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Auto Image Classification</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vision AI image category drafting</div>
              </div>
              <button
                onClick={() => toggleAiFlag('aiClassification')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: aiFeatureFlags.aiClassification ? 'var(--primary-500)' : 'var(--text-muted)' }}
              >
                {aiFeatureFlags.aiClassification ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            {/* Flag 2: Duplicate Issue Detection */}
            <div style={{
              padding: '0.75rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Duplicate Detection</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GIS similarity clustering model</div>
                </div>
                <button
                  onClick={() => toggleAiFlag('duplicateDetection')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: aiFeatureFlags.duplicateDetection ? 'var(--primary-500)' : 'var(--text-muted)' }}
                >
                  {aiFeatureFlags.duplicateDetection ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              {aiFeatureFlags.duplicateDetection && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <span>Similarity Threshold</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-500)' }}>{aiFeatureFlags.duplicateThreshold}% match</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="98"
                    value={aiFeatureFlags.duplicateThreshold}
                    onChange={e => updateAiThreshold(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary-500)' }}
                  />
                </div>
              )}
            </div>

            {/* Flag 3: Auto Department Routing */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '0.75rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Auto Department Routing</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Instant ticket auto-dispatch</div>
              </div>
              <button
                onClick={() => toggleAiFlag('autoDepartmentRouting')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: aiFeatureFlags.autoDepartmentRouting ? 'var(--primary-500)' : 'var(--text-muted)' }}
              >
                {aiFeatureFlags.autoDepartmentRouting ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            {/* Flag 4: GIS Live Layer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '0.75rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>GIS Heatmap Overlay</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Public GIS map spatial view</div>
              </div>
              <button
                onClick={() => toggleAiFlag('gisLiveMapping')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: aiFeatureFlags.gisLiveMapping ? 'var(--primary-500)' : 'var(--text-muted)' }}
              >
                {aiFeatureFlags.gisLiveMapping ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* City Wide Complaints Roster */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Recent Municipal System Complaints Log
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Complete audit directory across all wards and municipal departments
        </p>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Category</th>
                <th>Title</th>
                <th>Status</th>
                <th>Assigned Officer</th>
                <th>Reported Date</th>
                <th>Audit</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{item.id}</td>
                  <td style={{ fontWeight: 600 }}>{item.category}</td>
                  <td>{item.title}</td>
                  <td>
                    <span className={`badge badge-${item.status}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{item.assignedOfficer}</td>
                  <td style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                    {new Date(item.reportedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openComplaintDetails(item)}
                    >
                      <Eye size={14} /> Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
