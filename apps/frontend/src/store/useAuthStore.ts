import { create } from 'zustand';

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
  setPlan: (plan: PlanType) => void; // Quick toggle for demo/testing tier access
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'demo-user-1',
    email: 'owner@retailer.com',
    firstName: 'Alex',
    lastName: 'Dev',
    role: 'OWNER',
    business: {
      id: 'demo-biz-1',
      name: 'PhoneWorks Retail',
      slug: 'phoneworks',
      plan: 'ENTERPRISE', // Default demo plan
    },
  },
  token: 'demo-jwt-token',
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
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
