import { create } from 'zustand';
import { isTokenExpired } from '@/lib/jwt-utils';

export type PlanType = 'STARTER' | 'BUSINESS' | 'ENTERPRISE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  business: {
    id: string;
    name: string;
    slug: string;
    plan: PlanType;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setPlan: (plan: PlanType) => void;
}

const getInitialAuthState = (): { user: User | null; token: string | null } => {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }

  const savedToken = localStorage.getItem('vf_access_token');
  const savedUserStr = localStorage.getItem('vf_user');

  if (savedToken && !isTokenExpired(savedToken) && savedUserStr) {
    try {
      const savedUser = JSON.parse(savedUserStr);
      return { user: savedUser, token: savedToken };
    } catch (e) {
      console.warn('Failed to parse cached user:', e);
    }
  }

  // Token is missing, invalid, or expired
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vf_access_token');
    localStorage.removeItem('vf_user');
  }
  return { user: null, token: null };
};

const initialAuth = getInitialAuthState();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  setAuth: (user, token) => set({ user, token }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vf_access_token');
      localStorage.removeItem('vf_user');
    }
    set({ user: null, token: null });
  },
  setPlan: (plan) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            business: {
              ...state.user.business,
              plan,
            },
          }
        : null,
    })),
}));
