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
  invoices: (search?: string) => ['invoices', search] as const,
  quotes: (params?: any) => ['quotes', params] as const,
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
  return useQuery({
    queryKey: QUERY_KEYS.inventory(params),
    queryFn: async () => {
      const res = await api.getInventory(params);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Cached hook for Invoices
 */
export function useInvoices(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invoices(search),
    queryFn: async () => {
      const res = await api.getInvoices(search?.trim() || undefined);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Cached hook for Quotes
 */
export function useQuotes(params?: { search?: string; status?: string } | string) {
  const queryParams = typeof params === 'string' ? { search: params.trim() || undefined } : params;
  return useQuery({
    queryKey: QUERY_KEYS.quotes(queryParams),
    queryFn: async () => {
      const res = await api.getQuotes(queryParams);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
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
    invalidateInvoices: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventorySummary });
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
