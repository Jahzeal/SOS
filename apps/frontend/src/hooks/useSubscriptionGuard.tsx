'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export interface PlanDetails {
  id: string;
  code: string;
  name: string;
  description?: string;
  monthlyPriceNgn: number;
  annualPriceNgn?: number;
  maxDevices?: number;
  customBranding?: boolean;
  prioritySupport?: boolean;
  features?: string[];
}

interface SubscriptionGuardContextType {
  business: any | null;
  plans: PlanDetails[];
  selectedPlan: PlanDetails | null;
  isLoading: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  isPaidActive: boolean;
  isFreePlan: boolean;
  trialDaysRemaining: number;
  formattedTrialEndDate: string;
  isPaywallOpen: boolean;
  paywallContextAction: string | null;
  openPaywall: (actionContext?: string) => void;
  closePaywall: () => void;
  checkCanPerformAction: (actionName?: string) => boolean;
  switchToFreePlan: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionGuardContext = createContext<SubscriptionGuardContextType | undefined>(undefined);

export function SubscriptionGuardProvider({ children }: { children: React.ReactNode }) {
  const { user, setPlan } = useAuthStore();
  const [business, setBusiness] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('vf_business_profile');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [plans, setPlans] = useState<PlanDetails[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('vf_cached_plans');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallContextAction, setPaywallContextAction] = useState<string | null>(null);

  const fetchSubscriptionData = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('vf_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const [profileData, plansData] = await Promise.all([
        api.getBusinessProfile().catch(() => null),
        api.getPlans().catch(() => null),
      ]);

      if (profileData) {
        setBusiness(profileData);
        try {
          localStorage.setItem('vf_business_profile', JSON.stringify(profileData));
        } catch {}
      }
      if (plansData?.plans && Array.isArray(plansData.plans)) {
        setPlans(plansData.plans);
        try {
          localStorage.setItem('vf_cached_plans', JSON.stringify(plansData.plans));
        } catch {}
      }
    } catch (err) {
      console.warn('Subscription guard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  // Derive status with authoritative database fields
  const planCode = (business?.plan || user?.business?.plan || 'STARTER').toUpperCase();
  const subscriptionStatus = (business?.subscriptionStatus || (business ? 'FREE' : 'TRIAL')).toUpperCase();

  // Find matching plan object
  const selectedPlan: PlanDetails = plans.find(
    (p) => p.code.toUpperCase() === planCode || p.id === business?.planId
  ) || {
    id: 'default-starter',
    code: planCode,
    name: planCode === 'FREE' ? 'Free Forever' : planCode === 'STARTER' || planCode === 'STARTER101' ? 'Starter' : planCode,
    description: 'Onboarding store plan',
    monthlyPriceNgn: planCode === 'FREE' ? 0 : 5000,
    annualPriceNgn: planCode === 'FREE' ? 0 : 45000,
    maxDevices: planCode === 'FREE' ? 25 : 500,
    features: [],
  };

  const trialEndsAt = business?.trialEndsAt ? new Date(business.trialEndsAt) : null;
  const now = new Date();
  const hasValidTrialDate = trialEndsAt !== null && !isNaN(trialEndsAt.getTime());

  const isFreePlan = planCode === 'FREE' || subscriptionStatus === 'FREE';
  const isPaidActive = subscriptionStatus === 'ACTIVE';
  
  // Trial is expired ONLY if status is explicitly EXPIRED/PAST_DUE, or status is TRIAL and DB trial date has passed
  const isTrialExpired =
    !isFreePlan &&
    !isPaidActive &&
    (subscriptionStatus === 'EXPIRED' ||
      subscriptionStatus === 'PAST_DUE' ||
      (subscriptionStatus === 'TRIAL' && hasValidTrialDate && trialEndsAt.getTime() <= now.getTime()));

  // Trial is active ONLY if status is TRIAL AND we have a verified trial date from the DB that is in the future
  const isTrialActive =
    !isFreePlan &&
    !isPaidActive &&
    !isTrialExpired &&
    subscriptionStatus === 'TRIAL' &&
    hasValidTrialDate &&
    trialEndsAt.getTime() > now.getTime();

  const trialDaysRemaining =
    isTrialActive && hasValidTrialDate
      ? Math.max(1, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const formattedTrialEndDate =
    hasValidTrialDate
      ? trialEndsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'recently';

  const openPaywall = (actionContext?: string) => {
    setPaywallContextAction(actionContext || null);
    setIsPaywallOpen(true);
  };

  const closePaywall = () => {
    setIsPaywallOpen(false);
    setPaywallContextAction(null);
  };

  const checkCanPerformAction = (actionName?: string): boolean => {
    if (isTrialExpired) {
      openPaywall(actionName);
      return false;
    }
    return true;
  };

  const switchToFreePlan = async (): Promise<boolean> => {
    try {
      const res = await api.updateBusinessPlan('FREE');
      if (res) {
        setPlan('FREE');
        if (business) {
          setBusiness({
            ...business,
            plan: 'FREE',
            subscriptionStatus: 'FREE',
          });
        }
        closePaywall();
        await fetchSubscriptionData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to switch to free plan:', err);
      return false;
    }
  };

  return (
    <SubscriptionGuardContext.Provider
      value={{
        business,
        plans,
        selectedPlan,
        isLoading,
        isTrialActive,
        isTrialExpired,
        isPaidActive,
        isFreePlan,
        trialDaysRemaining,
        formattedTrialEndDate,
        isPaywallOpen,
        paywallContextAction,
        openPaywall,
        closePaywall,
        checkCanPerformAction,
        switchToFreePlan,
        refreshSubscription: fetchSubscriptionData,
      }}
    >
      {children}
    </SubscriptionGuardContext.Provider>
  );
}

export function useSubscriptionGuard() {
  const context = useContext(SubscriptionGuardContext);
  if (!context) {
    throw new Error('useSubscriptionGuard must be used within a SubscriptionGuardProvider');
  }
  return context;
}
