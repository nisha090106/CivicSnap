import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  MapPin, 
  ChevronRight, 
  Filter, 
  Sparkles,
  Search
} from 'lucide-react';

export default function CitizenDashboard() {
  const { complaints, openComplaintDetails, setIsNewModalOpen } = useComplaints();
  const { user } = useAuth();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter complaints for citizen (either logged in user or all demo user complaints)
  const myComplaints = complaints.filter(c => {
    const matchesUser = user ? (c.reporterId === user.id || user.role === 'citizen') : true;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesQuery = searchQuery === '' || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUser && matchesStatus && matchesQuery;
  });

  const totalSubmitted = complaints.length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const pendingCount = complaints.filter(c => c.status === 'pending').length;

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
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '1.75rem 2rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.08))',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-priority-low">
              <Sparkles size={12} /> {user ? user.ward : 'Ward 14 (Central)'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Welcome back, {user ? user.name : 'Citizen Reporter'}!
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9375rem' }}>
            Snap a photo of potholes, trash, broken lights, or water leaks. AI will route it to authority.
          </p>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={() => setIsNewModalOpen(true)}
          style={{ boxShadow: 'var(--shadow-glow)' }}
        >
          <Camera size={20} />
          <span>Report New Civic Issue</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <FileText size={24} />
          </div>
          <div className="metric-info">
            <h4>Total Submitted</h4>
            <div className="value">{totalSubmitted}</div>
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

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <AlertCircle size={24} />
          </div>
          <div className="metric-info">
            <h4>Pending Action</h4>
            <div className="value">{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>My Submitted Complaints</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            Live status feed for your reported neighborhood concerns
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search complaint or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: 220, fontSize: '0.8125rem' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
          </div>

          {/* Filter Pill Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '0.2rem', borderRadius: 'var(--radius-sm)' }}>
            {['all', 'pending', 'in_progress', 'resolved'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.35rem 0.75rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: statusFilter === status ? 'var(--bg-surface)' : 'transparent',
                  color: statusFilter === status ? 'var(--primary-500)' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Complaints Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {myComplaints.map(item => (
          <div
            key={item.id}
            className="glass-card"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            onClick={() => openComplaintDetails(item)}
          >
            <div>
              <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1rem', height: 180 }}>
                <img
                  src={item.image}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.7rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>
                  {item.id}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className={`badge badge-priority-${item.priority}`}>
                  {item.priority} priority
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.category} Dept
                </span>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                {item.title}
              </h4>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <MapPin size={14} color="var(--primary-500)" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.location}
                </span>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.75rem',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <span>Reported {new Date(item.reportedAt).toLocaleDateString()}</span>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--primary-500)', fontWeight: 600 }}>
                View Audit Trail <ChevronRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
