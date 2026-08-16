import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { X, MapPin, Clock, Calendar, User, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';

export default function ComplaintDetailsModal() {
  const { selectedComplaint, isDetailModalOpen, setIsDetailModalOpen, updateStatus } = useComplaints();
  const { user } = useAuth();

  const [newStatus, setNewStatus] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');

  if (!isDetailModalOpen || !selectedComplaint) return null;

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (!newStatus) return;
    updateStatus(
      selectedComplaint.id,
      newStatus,
      resolutionNote || `Status updated to ${newStatus.replace('_', ' ')} by ${user.name}`,
      user.name
    );
    setNewStatus('');
    setResolutionNote('');
  };

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
    <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <span className={`badge ${getStatusBadgeClass(selectedComplaint.status)}`}>
                {selectedComplaint.status.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontWeight: 600 }}>
                {selectedComplaint.id}
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedComplaint.title}</h3>
          </div>

          <button
            onClick={() => setIsDetailModalOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Left Image Box */}
            <div>
              <img
                src={selectedComplaint.image}
                alt={selectedComplaint.title}
                style={{
                  width: '100%',
                  height: 240,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              />
              
              <div style={{
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)'
              }}>
                <MapPin size={16} color="var(--primary-500)" />
                <span>{selectedComplaint.location}</span>
              </div>
            </div>

            {/* Right Meta Specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', uppercase: true, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  ISSUE DETAILS
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: 0 }}>
                  {selectedComplaint.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Reported By</div>
                  <div style={{ fontWeight: 600 }}>{selectedComplaint.reportedBy}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Department</div>
                  <div style={{ fontWeight: 600 }}>{selectedComplaint.department}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Priority Level</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize', color: selectedComplaint.priority === 'high' ? '#ef4444' : '#f59e0b' }}>
                    {selectedComplaint.priority} Priority
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Assigned Officer</div>
                  <div style={{ fontWeight: 600 }}>{selectedComplaint.assignedOfficer}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline History Section */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--primary-500)" /> Resolution Audit Timeline
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {selectedComplaint.timeline.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--primary-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </div>

                  <div style={{ flex: 1, background: 'var(--bg-app)', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'capitalize' }}>
                        {step.status.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(step.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                      {step.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Officer/Admin Status Action Form */}
          {user && (user.role === 'officer' || user.role === 'admin') && (
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#f59e0b" /> Authority Ticket Action
              </h4>

              <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    required
                  >
                    <option value="">Select New Status...</option>
                    <option value="in_progress">Mark as In Progress</option>
                    <option value="resolved">Mark as Resolved</option>
                    <option value="rejected">Mark as Rejected / Invalid</option>
                  </select>

                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter resolution notes, inspection details, or dispatch ID..."
                    value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary btn-sm">
                    <CheckCircle2 size={15} /> Save Ticket Update
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
