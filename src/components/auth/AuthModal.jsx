import React, { useState } from 'react';
import { useAuth, DEMO_USERS, DEPARTMENTS } from '../../context/AuthContext';
import { X, User, Building2, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login, switchDemoRole } = useAuth();
  const [activeTab, setActiveTab] = useState('citizen'); // 'citizen' | 'officer' | 'admin'
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Sanitation');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      id: `usr-${activeTab}-${Math.floor(100 + Math.random() * 900)}`,
      name: name || (activeTab === 'citizen' ? 'Citizens Reporter' : activeTab === 'officer' ? `Officer (${department})` : 'Municipal Admin'),
      email: email || `${activeTab}@civic.gov.in`,
      role: activeTab,
      department: activeTab === 'officer' ? department : undefined,
      departmentName: activeTab === 'officer' ? DEPARTMENTS.find(d => d.id === department)?.name : undefined,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      ward: 'Ward 14 (Central Metro)'
    };
    login(newUser);
  };

  const selectPreset = (presetKey) => {
    switchDemoRole(presetKey);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {isSignUp ? 'Create CivicSnap Account' : 'Sign In to CivicSnap'}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Access citizen reporting or municipal officer portal
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Quick Persona Selector Preset Cards */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              Quick Demo Login Presets
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => selectPreset('citizen')}
                style={{
                  padding: '0.875rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <User size={22} color="#10b981" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Citizen</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Aarav S.</span>
              </button>

              <button
                type="button"
                onClick={() => selectPreset('officer')}
                style={{
                  padding: '0.875rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <Building2 size={22} color="#f59e0b" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Officer</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Rajesh V.</span>
              </button>

              <button
                type="button"
                onClick={() => selectPreset('admin')}
                style={{
                  padding: '0.875rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <Shield size={22} color="#6366f1" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Admin</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Commissioner</span>
              </button>
            </div>
          </div>

          <div style={{
            position: 'relative',
            textAlign: 'center',
            margin: '1.5rem 0',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <span style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-surface)',
              padding: '0 0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 600
            }}>
              OR CUSTOM AUTHENTICATION
            </span>
          </div>

          {/* Role Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-app)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('citizen')}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'citizen' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'citizen' ? 'var(--primary-500)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              Citizen
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('officer')}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'officer' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'officer' ? '#f59e0b' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              Officer
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'admin' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'admin' ? '#6366f1' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              Municipal Admin
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder={activeTab === 'citizen' ? 'name@example.com' : 'officer@civic.gov.in'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {activeTab === 'officer' && (
              <div className="form-group">
                <label className="form-label">Department Allocation</label>
                <select
                  className="form-select"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <span>{isSignUp ? 'Create Account & Enter' : `Sign In as ${activeTab}`}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Footer Toggle */}
        <div className="modal-footer" style={{ justifyContent: 'center', background: 'var(--bg-app)' }}>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', border: 'none', color: 'var(--primary-500)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
