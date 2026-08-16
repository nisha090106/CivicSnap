import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import RoleSwitcher from './RoleSwitcher';
import { 
  Sun, 
  Moon, 
  ShieldAlert, 
  Bell, 
  PlusCircle, 
  User, 
  LogOut, 
  Sparkles,
  Camera
} from 'lucide-react';

export default function Header() {
  const { user, theme, toggleTheme, logout, setIsAuthModalOpen } = useAuth();
  const { setIsNewModalOpen } = useComplaints();

  return (
    <header className="glass-panel" style={{
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '0.875rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Brand & Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
        }}>
          <ShieldAlert size={24} color="#ffffff" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
              Civic<span style={{ color: 'var(--primary-500)' }}>Snap</span>
            </h1>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <Sparkles size={10} /> PHASE 1 SHELL
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            AI-Powered Municipal Issue Reporting & Resolution Engine
          </p>
        </div>
      </div>

      {/* Middle Action & Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <RoleSwitcher />

        {user && user.role === 'citizen' && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsNewModalOpen(true)}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <Camera size={16} />
            <span>Report Civic Issue</span>
          </button>
        )}
      </div>

      {/* Right User Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-outline btn-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{ width: 38, height: 38, padding: 0, borderRadius: '50%' }}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* Notifications Icon */}
        <button
          className="btn btn-outline btn-sm"
          title="Notifications"
          style={{ width: 38, height: 38, padding: 0, borderRadius: '50%', position: 'relative' }}
        >
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--primary-500)',
            boxShadow: '0 0 6px var(--primary-500)'
          }} />
        </button>

        {/* User Account Pill */}
        {user ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)'
          }}>
            <img
              src={user.avatar}
              alt={user.name}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{user.name}</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user.role === 'officer' ? `${user.department} Officer` : user.role}
              </span>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn btn-outline btn-sm"
              title="Switch Account / Sign In"
              style={{ width: 28, height: 28, padding: 0, borderRadius: '50%', border: 'none', marginLeft: '0.25rem' }}
            >
              <User size={15} />
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => setIsAuthModalOpen(true)}>
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
}
