import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const DEMO_USERS = {
  citizen: {
    id: 'usr-cit-101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    role: 'citizen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    ward: 'Ward 14 (Central Metro)',
    phone: '+91 98765 43210'
  },
  officer: {
    id: 'usr-off-202',
    name: 'Officer Rajesh Verma',
    email: 'rajesh.verma@civic.gov.in',
    role: 'officer',
    department: 'Sanitation',
    departmentName: 'Sanitation & Solid Waste Management',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    ward: 'Ward 14 (Central Metro)',
    badgeId: 'OFF-SANI-884'
  },
  admin: {
    id: 'usr-adm-303',
    name: 'Commissioner Vikramaditya',
    email: 'commissioner@civic.gov.in',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    jurisdiction: 'City Municipal Corporation',
    title: 'Chief Municipal Officer'
  }
};

export const DEPARTMENTS = [
  { id: 'Sanitation', name: 'Sanitation & Solid Waste', icon: 'Trash2', color: '#10b981' },
  { id: 'Roads', name: 'Roads & Infrastructure', icon: 'Construct', color: '#f59e0b' },
  { id: 'Electrical', name: 'Electrical & Streetlights', icon: 'Zap', color: '#eab308' },
  { id: 'Water', name: 'Water & Drainage Works', icon: 'Droplets', color: '#0ea5e9' },
  { id: 'PublicHealth', name: 'Public Health & Safety', icon: 'ShieldAlert', color: '#ef4444' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('civicsnap_user');
    return savedUser ? JSON.parse(savedUser) : DEMO_USERS.citizen;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('civicsnap_theme') || 'dark';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('civicsnap_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('civicsnap_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const switchDemoRole = (roleType, extraDept = null) => {
    if (roleType === 'citizen') {
      setUser(DEMO_USERS.citizen);
    } else if (roleType === 'officer') {
      const baseOfficer = { ...DEMO_USERS.officer };
      if (extraDept) {
        baseOfficer.department = extraDept;
        const deptObj = DEPARTMENTS.find(d => d.id === extraDept);
        baseOfficer.departmentName = deptObj ? deptObj.name : extraDept;
      }
      setUser(baseOfficer);
    } else if (roleType === 'admin') {
      setUser(DEMO_USERS.admin);
    }
  };

  const login = (userData) => {
    setUser(userData);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        theme,
        toggleTheme,
        switchDemoRole,
        login,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
