import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  ChevronRight, 
  Filter, 
  ShieldCheck,
  Search,
  ArrowUpRight
} from 'lucide-react';

export default function OfficerDashboard() {
  const { complaints, openComplaintDetails, updateStatus } = useComplaints();
  const { user } = useAuth();

  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Department complaints
  const currentDepartment = user ? user.department : 'Sanitation';
  
  const deptComplaints = complaints.filter(c => {
    const matchesDept = user && user.role === 'officer' ? (c.department === currentDepartment) : true;
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesPriority && matchesStatus && matchesSearch;
  });

  const totalDeptTickets = complaints.filter(c => user?.role === 'officer' ? c.department === currentDepartment : true).length;
  const pendingCount = deptComplaints.filter(c => c.status === 'pending').length;
  const inProgressCount = deptComplaints.filter(c => c.status === 'in_progress').length;
  const resolvedCount = deptComplaints.filter(c => c.status === 'resolved').length;
  const highPriorityCount = deptComplaints.filter(c => c.priority === 'high' && c.status !== 'resolved').length;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'in_progress': return 'badge-in_progress';
      case 'resolved': return 'badge-resolved';
      case 'rejected': return 'badge-rejected';
      default: return 'badge-pending';
    }
  };

  return (
    <div className="page-wrapper">
      {/* Department Banner Header */}
      <div className="glass-panel" style={{
        padding: '1.75rem 2rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(16, 185, 129, 0.08))',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: '#f59e0b'
          }}>
            <Building2 size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span className="badge badge-priority-medium">
                Badge ID: {user?.badgeId || 'OFF-MUNI-992'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Ward 14 Jurisdiction
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              {user?.departmentName || `${currentDepartment} Department Queue`}
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
              Managing municipal resolution SLA, dispatching field crews, & updating ticket statuses.
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1.5rem',
          background: 'var(--bg-surface)',
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>SLA Target</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-500)' }}>94.2%</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: true }}>Avg Resolution</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>18.4 hrs</div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Building2 size={24} />
          </div>
          <div className="metric-info">
            <h4>Dept Workload</h4>
            <div className="value">{totalDeptTickets}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="metric-info">
            <h4>Urgent Priority</h4>
            <div className="value">{highPriorityCount}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <h4>In Progress</h4>
            <div className="value">{inProgressCount}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <h4>Resolved Tickets</h4>
            <div className="value">{resolvedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Department Active Queue</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Review reported issues and advance workflow state
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search ticket, location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', width: 220, fontSize: '0.8125rem' }}
              />
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            </div>

            <select
              className="form-select"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              style={{ width: 140, fontSize: '0.8125rem' }}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              className="form-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ width: 140, fontSize: '0.8125rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Issue Summary</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Location / Ward</th>
                <th>SLA Due Date</th>
                <th>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {deptComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No complaints found matching current filters.
                  </td>
                </tr>
              ) : (
                deptComplaints.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                      {item.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Reported by {item.reportedBy}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-priority-${item.priority}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.location}
                    </td>
                    <td style={{ fontSize: '0.78125rem' }}>
                      {new Date(item.slaDueDate).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.status === 'pending' && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => updateStatus(item.id, 'in_progress', 'Officer assigned crew for site dispatch', user?.name)}
                            style={{ borderColor: '#0ea5e9', color: '#0ea5e9' }}
                          >
                            Start Work
                          </button>
                        )}
                        {item.status === 'in_progress' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => updateStatus(item.id, 'resolved', 'Issue resolved and verified by officer on ground', user?.name)}
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openComplaintDetails(item)}
                          title="View Full Ticket Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
