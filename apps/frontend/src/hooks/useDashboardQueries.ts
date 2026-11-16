import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Cache Keys
 */
export const QUERY_KEYS = {
  inventory: (branchId?: string | null, params?: any) => ['inventory', branchId || 'all', params] as const,
  inventorySummary: (branchId?: string | null) => ['inventory-summary', branchId || 'all'] as const,
  records: (branchId?: string | null, params?: any) => ['records', branchId || 'all', params] as const,
  recordDetail: (id: string) => ['record-detail', id] as const,
  receipts: (branchId?: string | null, params?: any) => ['receipts', branchId || 'all', params] as const,
  invoices: (branchId?: string | null, search?: string) => ['invoices', branchId || 'all', search] as const,
  quotes: (branchId?: string | null, params?: any) => ['quotes', branchId || 'all', params] as const,
  customers: (search?: string) => ['customers', search] as const,
  adminSubscriptions: ['admin-subscriptions'] as const,
  adminMetrics: (timeRange?: string) => ['admin-metrics', timeRange] as const,
  adminLogs: ['admin-logs'] as const,
  publicPlans: ['public-plans'] as const,
  businessProfile: ['business-profile'] as const,
  dashboardMetrics: (timeRange?: string) => ['dashboard-metrics', timeRange] as const,
};

/**
 * Cached hook for Inventory list
 */
export function useInventory(params?: { search?: string; status?: string; brand?: string }) {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  return useQuery({
    queryKey: QUERY_KEYS.inventory(selectedBranchId, params),
    queryFn: async () => {
      const res = await api.getInventory(params);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000, // 60s instant cache
    refetchOnWindowFocus: false,
  });
}

/**
 * Cached hook for Inventory KPI & Summary
 */
export function useInventorySummary() {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  return useQuery({
    queryKey: QUERY_KEYS.inventorySummary(selectedBranchId),
    queryFn: async () => {
      return await api.getDashboardSummary();
    },
    staleTime: 60 * 1000, // 60s instant cache
    refetchOnWindowFocus: false,
  });
}

/**
 * Cached hook for Invoices
 */
export function useInvoices(search?: string) {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  return useQuery({
    queryKey: QUERY_KEYS.invoices(selectedBranchId, search),
    queryFn: async () => {
      const res = await api.getInvoices(search?.trim() || undefined);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Cached hook for Quotes
 */
export function useQuotes(params?: { search?: string; status?: string} | string) {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  const queryParams = typeof params === 'string' ? { search: params.trim() || undefined } : params;
  return useQuery({
    queryKey: QUERY_KEYS.quotes(selectedBranchId, queryParams),
    queryFn: async () => {
      const res = await api.getQuotes(queryParams);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Cached hook for Customers
 */
export function useCustomers(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.customers(search),
    queryFn: async () => {
      const res = await api.getCustomers();
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Cached hook for Phone Records Ledger
 */
export function usePhoneRecords(params?: any) {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  return useQuery({
    queryKey: QUERY_KEYS.records(selectedBranchId, params),
    queryFn: async () => {
      const res = await api.getInventory(params);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
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
    refetchOnWindowFocus: false,
  });
}

/**
 * Cached hook for Receipts Archive
 */
export function useReceipts(search?: string) {
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId);
  return useQuery({
    queryKey: QUERY_KEYS.receipts(selectedBranchId, search),
    queryFn: async () => {
      const res = await api.getReceipts(search);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Cached hook for Business Profile & Subscription
 */
export function useBusinessProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.businessProfile,
    queryFn: async () => {
      return await api.getBusinessProfile();
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Cached hook for Admin Overview Metrics
 */
export function useAdminMetrics(timeRange: 'today' | '7d' | '30d' | '90d' = 'today') {
  return useQuery({
    queryKey: QUERY_KEYS.adminMetrics(timeRange),
    queryFn: async () => {
      const res = await api.adminGetMetrics(timeRange);
      return res?.kpis || null;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Cached hook for Admin System Activity Logs
 */
export function useAdminSystemLogs() {
  return useQuery({
    queryKey: QUERY_KEYS.adminLogs,
    queryFn: async () => {
      const res = await api.adminGetSystemLogs();
      return Array.isArray(res?.logs) ? res.logs : [];
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
    staleTime: 10 * 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
    invalidateRecords: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    invalidateReceipts: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
    },
    invalidateInvoices: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
    },
    invalidateQuotes: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    invalidateCustomers: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    invalidateBusinessProfile: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businessProfile });
    },
    invalidateAdminSubscriptions: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminSubscriptions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.publicPlans });
    },
  };
}
