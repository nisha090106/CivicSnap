import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import CitizenLogin from './pages/CitizenLogin';
import AuthorityLogin from './pages/AuthorityLogin';
import CitizenDashboard from './pages/CitizenDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import PendingApproval from './pages/PendingApproval';

function ProtectedRoute({ children, allowedRole, requireApproval = true }) {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Authenticating...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to={allowedRole === 'authority' ? '/login/authority' : '/'} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'citizen') return <Navigate to="/dashboard/citizen" replace />;
    if (user.role === 'authority') {
      return user.isApproved
        ? <Navigate to={`/dashboard/authority/${encodeURIComponent(user.department || 'Municipal Authority')}`} replace />
        : <Navigate to="/dashboard/pending-approval" replace />;
    }
  }

  if (allowedRole === 'authority' && requireApproval && !user.isApproved) {
    return <Navigate to="/dashboard/pending-approval" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Entry Points */}
          <Route path="/" element={<CitizenLogin />} />
          <Route path="/login/authority" element={<AuthorityLogin />} />

          {/* Protected Role Dashboards */}
          <Route
            path="/dashboard/citizen"
            element={
              <ProtectedRoute allowedRole="citizen">
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/authority/:department"
            element={
              <ProtectedRoute allowedRole="authority" requireApproval={true}>
                <AuthorityDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/pending-approval"
            element={
              <ProtectedRoute allowedRole="authority" requireApproval={false}>
                <PendingApproval />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
