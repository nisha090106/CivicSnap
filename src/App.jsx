import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ComplaintProvider } from './context/ComplaintContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import AuthModal from './components/auth/AuthModal';
import NewComplaintModal from './components/complaints/NewComplaintModal';
import ComplaintDetailsModal from './components/complaints/ComplaintDetailsModal';
import CitizenDashboard from './components/dashboards/CitizenDashboard';
import OfficerDashboard from './components/dashboards/OfficerDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';

function MainAppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const renderDashboard = () => {
    if (!user) return <CitizenDashboard />;

    if (user.role === 'citizen') {
      return <CitizenDashboard />;
    }

    if (user.role === 'officer') {
      return <OfficerDashboard />;
    }

    if (user.role === 'admin') {
      return <AdminDashboard />;
    }

    return <CitizenDashboard />;
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        <Header />
        <main style={{ flex: 1, background: 'var(--bg-app)' }}>
          {renderDashboard()}
        </main>
      </div>

      {/* Global Modals */}
      <AuthModal />
      <NewComplaintModal />
      <ComplaintDetailsModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ComplaintProvider>
        <MainAppContent />
      </ComplaintProvider>
    </AuthProvider>
  );
}
