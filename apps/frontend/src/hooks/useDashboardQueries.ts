import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Cache Keys
 */
export const QUERY_KEYS = {
  inventory: (params?: any) => ['inventory', params] as const,
  inventorySummary: ['inventory-summary'] as const,
  records: (params?: any) => ['records', params] as const,
  recordDetail: (id: string) => ['record-detail', id] as const,
  receipts: (params?: any) => ['receipts', params] as const,
  adminSubscriptions: ['admin-subscriptions'] as const,
  publicPlans: ['public-plans'] as const,
  businessProfile: ['business-profile'] as const,
};

/**
 * Cached hook for Inventory list
 */
export function useInventory(params?: { search?: string; status?: string; brand?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory(params),
    queryFn: async () => {
      const res = await api.getInventory(params);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000, // 1 minute fresh
  });
}

/**
 * Cached hook for Inventory KPI & Summary
 */
export function useInventorySummary() {
  return useQuery({
    queryKey: QUERY_KEYS.inventorySummary,
    queryFn: async () => {
      return await api.getDashboardSummary();
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Cached hook for Phone Records Ledger
 */
export function usePhoneRecords(params?: any) {
  return useQuery({
    queryKey: QUERY_KEYS.records(params),
    queryFn: async () => {
      const res = await api.getInventory(params);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Cached hook for single Device Record detail
 */
export function usePhoneRecordDetail(id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.recordDetail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await api.getPhoneById(id);
      return res || null;
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

/**
 * Cached hook for Receipts Archive
 */
export function useReceipts(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.receipts(search),
    queryFn: async () => {
      const res = await api.getReceipts(search);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Cached hook for Admin Subscriptions & Plans
 */
export function useAdminSubscriptions() {
  return useQuery({
    queryKey: QUERY_KEYS.adminSubscriptions,
    queryFn: async () => {
      return await api.adminGetSubscriptions();
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Cached hook for Public Plans
 */
export function usePublicPlans() {
  return useQuery({
    queryKey: QUERY_KEYS.publicPlans,
    queryFn: async () => {
      const res = await api.getPlans();
      return res?.plans || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
  });
}

/**
 * Cache invalidation utilities for instant UI sync on mutations
 */
export function useDashboardCacheUtils() {
  const queryClient = useQueryClient();

  return {
    invalidateInventory: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventorySummary });
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
    invalidateRecords: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    invalidateReceipts: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventorySummary });
    },
    invalidateAdminSubscriptions: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminSubscriptions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.publicPlans });
    },
  };
}
