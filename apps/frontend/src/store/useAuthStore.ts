import { create } from 'zustand';
import { isTokenExpired } from '@/lib/jwt-utils';
import { clearAuthSessionAndCaches } from '@/lib/auth-cleanup';

export type PlanType = 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  /** Role inside the store. Missing on older saved sessions = owner. */
  storeRole?: 'OWNER' | 'MANAGER' | 'SALES' | 'TECHNICIAN';
  /** The branch this person works in; empty = all branches. */
  branch?: { id: string; name: string } | null;
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
  selectedBranchId: string | null;
  selectedBranchName: string | null;
  setAuth: (user: User, token: string) => void;
  setSelectedBranch: (id: string | null, name?: string | null) => void;
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
  selectedBranchId: typeof window !== 'undefined' ? localStorage.getItem('vf_selected_branch_id') : null,
  selectedBranchName: typeof window !== 'undefined' ? localStorage.getItem('vf_selected_branch_name') : null,
  setAuth: (user, token) => set({ user, token }),
  setSelectedBranch: (id, name = null) => {
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('vf_selected_branch_id', id);
        if (name) localStorage.setItem('vf_selected_branch_name', name);
      } else {
        localStorage.removeItem('vf_selected_branch_id');
        localStorage.removeItem('vf_selected_branch_name');
      }
    }
    set({ selectedBranchId: id, selectedBranchName: name });
  },
  logout: () => {
    clearAuthSessionAndCaches();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vf_selected_branch_id');
      localStorage.removeItem('vf_selected_branch_name');
    }
    set({ user: null, token: null, selectedBranchId: null, selectedBranchName: null });
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
