'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  business: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage if available
    const savedToken = localStorage.getItem('vf_access_token');
    const savedUser = localStorage.getItem('vf_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse cached user session:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('vf_access_token', res.accessToken);
    localStorage.setItem('vf_user', JSON.stringify(res.user));
  };

  const register = async (payload: any) => {
    const res = await api.registerBusiness(payload);
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('vf_access_token', res.accessToken);
    localStorage.setItem('vf_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vf_access_token');
    localStorage.removeItem('vf_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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
