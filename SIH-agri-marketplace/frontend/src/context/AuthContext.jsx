import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, getMeApi } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = {
  ADMIN: {
    label: 'Platform Admin',
    name: 'Kiran Pokuri',
    phone: '+919999999999',
    pass: 'AdminPass123!',
    role: 'ADMIN',
    badge: 'Superadmin Access',
    color: 'purple',
  },
  FARMER: {
    label: 'Farmer',
    name: 'Ramesh Patel',
    phone: '+919876543210',
    pass: 'FarmerPass123!',
    role: 'FARMER',
    badge: 'Harvest & Listings',
    color: 'emerald',
  },
  TRANSPORTER: {
    label: 'Transporter',
    name: 'Suresh Logistics',
    phone: '+919876543211',
    pass: 'TransportPass123!',
    role: 'TRANSPORTER',
    badge: 'Fleet & Dispatch',
    color: 'blue',
  },
  COLLECTION_CENTER: {
    label: 'Collection Hub',
    name: 'Kisan Agri Hub',
    phone: '+919876543212',
    pass: 'StoragePass123!',
    role: 'COLLECTION_CENTER',
    badge: 'Cold Storage (25t)',
    color: 'amber',
  },
  CONSUMER: {
    label: 'Consumer',
    name: 'Ananya Sharma',
    phone: '+919876543213',
    pass: 'ConsumerPass123!',
    role: 'CONSUMER',
    badge: 'Direct Buyer',
    color: 'rose',
  },
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sih_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize authenticated user profile on token change
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userData = await getMeApi(token);
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error('Session expired or invalid token:', err);
        setToken(null);
        setUser(null);
        localStorage.removeItem('sih_token');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  async function login(phoneNumber, password) {
    try {
      setLoading(true);
      setError(null);
      const data = await loginApi(phoneNumber, password);
      localStorage.setItem('sih_token', data.access_token);
      setToken(data.access_token);
      const profile = await getMeApi(data.access_token);
      setUser(profile);
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function quickSwitch(roleKey) {
    if (roleKey === 'UNAUTHENTICATED') {
      logout();
      return;
    }
    const acc = DEMO_ACCOUNTS[roleKey];
    if (!acc) return;
    await login(acc.phone, acc.pass);
  }

  function logout() {
    localStorage.removeItem('sih_token');
    setToken(null);
    setUser(null);
    setError(null);
  }

  async function reloadUser() {
    if (token) {
      const refreshed = await getMeApi(token);
      setUser(refreshed);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        error,
        login,
        logout,
        quickSwitch,
        reloadUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
