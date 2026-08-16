import React from 'react';
import { useAuth, DEPARTMENTS } from '../../context/AuthContext';
import { User, Shield, Building2, ChevronDown } from 'lucide-react';

export default function RoleSwitcher() {
  const { user, switchDemoRole } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) return null;

  const currentRoleLabel = () => {
    if (user.role === 'citizen') return 'Citizen Portal';
    if (user.role === 'admin') return 'Super Admin Center';
    if (user.role === 'officer') return `${user.department} Officer View`;
    return 'Demo Mode';
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--primary-500)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#10b981',
          boxShadow: '0 0 8px #10b981'
        }} />
        <span>View as: <strong>{currentRoleLabel()}</strong></span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
            onClick={() => setIsOpen(false)} 
          />
          <div className="glass-panel" style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: 280,
            zIndex: 100,
            padding: '0.75rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              letterSpacing: '0.05em'
            }}>
              Switch Demo Persona
            </div>

            {/* Citizen Persona Button */}
            <button
              onClick={() => {
                switchDemoRole('citizen');
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: user.role === 'citizen' ? '1px solid var(--primary-500)' : '1px solid transparent',
                background: user.role === 'citizen' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '0.35rem'
              }}
            >
              <User size={18} color="#10b981" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Citizen (Aarav Sharma)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Report issues & track status</div>
              </div>
            </button>

            {/* Department Officer Submenu */}
            <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                DEPARTMENT OFFICERS
              </div>
              {DEPARTMENTS.slice(0, 4).map(dept => (
                <button
                  key={dept.id}
                  onClick={() => {
                    switchDemoRole('officer', dept.id);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.45rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: (user.role === 'officer' && user.department === dept.id) ? '1px solid var(--primary-500)' : '1px solid transparent',
                    background: (user.role === 'officer' && user.department === dept.id) ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '0.78125rem',
                    textAlign: 'left',
                    marginBottom: '0.2rem'
                  }}
                >
                  <Building2 size={15} color={dept.color} />
                  <span>{dept.name} Officer</span>
                </button>
              ))}
            </div>

            {/* Admin Persona Button */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <button
                onClick={() => {
                  switchDemoRole('admin');
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: user.role === 'admin' ? '1px solid var(--primary-500)' : '1px solid transparent',
                  background: user.role === 'admin' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Shield size={18} color="#6366f1" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Super Admin</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>City analytics & AI toggles</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
