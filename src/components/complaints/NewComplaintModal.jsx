import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth, DEPARTMENTS } from '../../context/AuthContext';
import { X, Camera, MapPin, AlertTriangle, UploadCloud, Sparkles, CheckCircle2 } from 'lucide-react';

export default function NewComplaintModal() {
  const { isNewModalOpen, setIsNewModalOpen, addComplaint, openComplaintDetails } = useComplaints();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sanitation');
  const [priority, setPriority] = useState('medium');
  const [location, setLocation] = useState('Block B, Ward 14 Metro Zone');
  const [description, setDescription] = useState('');
  const [previewImage, setPreviewImage] = useState('https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800');
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);

  if (!isNewModalOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSimulatingAI(true);

    setTimeout(() => {
      const created = addComplaint({
        title: title || `${category} issue near ${location}`,
        category,
        priority,
        location,
        description: description || 'Citizen reported issue via mobile photo capture.',
        image: previewImage,
        reportedBy: user ? user.name : 'Aarav Sharma',
        reporterId: user ? user.id : 'usr-cit-101'
      });

      setIsSimulatingAI(false);
      setIsNewModalOpen(false);
      openComplaintDetails(created);
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsNewModalOpen(false)}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Report New Civic Issue</h3>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--primary-500)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                <Sparkles size={10} /> AI DRAFTING READY
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Upload photo evidence and location. Auto-assigned to department.
            </p>
          </div>
          <button
            onClick={() => setIsNewModalOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Image Upload Zone Placeholder */}
            <div className="form-group">
              <label className="form-label">Photo Evidence</label>
              <div style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
                background: 'var(--bg-app)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {previewImage ? (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={previewImage} 
                      alt="Complaint Preview" 
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(4px)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <Camera size={14} /> Change Photo
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem 0' }}>
                    <UploadCloud size={36} color="var(--primary-500)" style={{ margin: '0 auto 0.5rem auto' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Drag & drop issue photo or click to browse</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports JPG, PNG (AI classification ready)</div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Issue Title & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category / Department</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Urgency Priority</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="low">Low (Standard SLA 72 hrs)</option>
                  <option value="medium">Medium (Normal SLA 48 hrs)</option>
                  <option value="high">High (Urgent SLA 24 hrs)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Issue Summary / Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Overflowing garbage bin outside Ward 14 market"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Exact Location / Landmark</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Opposite Pillar 142, Main Road, Ward 14"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{ paddingLeft: '2.25rem' }}
                  required
                />
                <MapPin size={16} color="var(--primary-500)" style={{ position: 'absolute', left: 10, top: 12 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe the severity, duration, and safety risk associated with this issue..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSimulatingAI}
            >
              {isSimulatingAI ? (
                <span>Routing to Department...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
