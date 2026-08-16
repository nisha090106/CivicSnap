import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4000';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('civicsnap_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('civicsnap_user') || 'null'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${AUTH_SERVICE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('civicsnap_user', JSON.stringify(data.user));
          } else {
            logout();
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const saveAuthSession = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('civicsnap_token', authToken);
    localStorage.setItem('civicsnap_user', JSON.stringify(userData));
  };

  const sendOtp = async (phoneNumber) => {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/phone/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    });
    return res.json();
  };

  const verifyOtp = async ({ phoneNumber, code, role, department, name }) => {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/phone/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, code, role, department, name })
    });
    const data = await res.json();
    if (data.success && data.token) {
      saveAuthSession(data.token, data.user);
    }
    return data;
  };

  const googleSignIn = async ({ email, name, role, department }) => {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/google/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role, department })
    });
    const data = await res.json();
    if (data.success && data.token) {
      saveAuthSession(data.token, data.user);
    }
    return data;
  };

  const approveAuthority = async () => {
    if (!user) return;
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/approve-authority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    const data = await res.json();
    if (data.success && data.user) {
      saveAuthSession(data.token, data.user);
    }
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('civicsnap_token');
    localStorage.removeItem('civicsnap_user');
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      sendOtp,
      verifyOtp,
      googleSignIn,
      approveAuthority,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
