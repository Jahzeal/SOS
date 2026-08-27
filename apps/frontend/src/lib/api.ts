// Unified API Client Service Layer for VerifyFlow NestJS API Backend

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_BASE_URL = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
  ? rawUrl.replace(/\/$/, '')
  : `https://${rawUrl.replace(/\/$/, '')}`;

export interface RegisterPhonePayload {
  imei1: string;
  imei2?: string;
  serialNumber?: string;
  brand: string;
  model: string;
  color?: string;
  storageCapacity?: string;
  condition?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  warrantyDurationMonths?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('vf_access_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (networkError: any) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const customMessage = isOffline
        ? 'Network connection lost. Please check your internet connection and try again.'
        : 'Unable to connect to VerifyFlow servers. Please check your connection or server status.';

      const err: any = new Error(customMessage);
      err.isNetworkError = true;
      err.isOffline = isOffline;
      throw err;
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('vf_access_token');
        localStorage.removeItem('vf_user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=true';
        }
      }
      const errorMessage = data?.message || response.statusText || 'An error occurred during API request';
      const err: any = new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      err.status = response.status;
      throw err;
    }

    return data as T;
  }

  // --- Auth & Profile Endpoints ---
  async login(email: string, password: string) {
    return this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async registerBusiness(data: any) {
    return this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendOtp(email: string, fullName?: string) {
    return this.request<{ success: boolean; message: string; devCode?: string; emailDelivery?: boolean }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, fullName }),
    });
  }

  async verifyOtp(email: string, code: string) {
    return this.request<{ success: boolean; verified: boolean }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string; resetUrl?: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // --- Dashboard Summary Endpoint ---
  async getDashboardSummary() {
    return this.request<{
      business: any;
      kpis: {
        totalRegistered: number;
        inStockCount: number;
        soldCount: number;
        inRepairCount: number;
        activeWarrantiesCount: number;
        stockValuation: number;
        totalSalesRevenue: number;
        totalSalesCount: number;
      };
      recentPhones: any[];
      recentSales: any[];
    }>('/dashboard/summary');
  }

  async getReports(range?: string) {
    const q = range ? `?range=${encodeURIComponent(range)}` : '';
    return this.request<any>(`/dashboard/reports${q}`);
  }

  async getBusinessProfile() {
    return this.request<any>('/business/profile');
  }

  async updateBusinessSettings(payload: any) {
    return this.request<any>('/business/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updateBusinessPlan(plan: string) {
    return this.request<any>('/business/plan', {
      method: 'PUT',
      body: JSON.stringify({ plan }),
    });
  }

  async getBusinessTemplates() {
    return this.request<any>('/business/templates');
  }

  async updateBusinessTemplates(payload: any) {
    return this.request<any>('/business/templates', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // --- Phone Registration & Inventory Endpoints ---
  async checkImei(imei: string) {
    return this.request<{ exists: boolean; record: any; message: string }>(`/phones/check-imei?imei=${encodeURIComponent(imei)}`);
  }

  async registerPhone(payload: RegisterPhonePayload) {
    return this.request<any>('/phones/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getInventory(params?: { search?: string; status?: string; brand?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.brand) query.append('brand', params.brand);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/phones${queryString}`);
  }

  async getPhoneById(id: string) {
    return this.request<any>(`/phones/${id}`);
  }

  // --- Express POS Checkout & Thermal Receipts Endpoints ---
  async checkoutSale(payload: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    items: { phoneRecordId: string; price: number }[];
  }) {
    return this.request<any>('/sales/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getReceipts(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<any[]>(`/sales/receipts${query}`);
  }

  async getReceiptById(id: string) {
    return this.request<any>(`/sales/receipts/${id}`);
  }

  // --- Customers Endpoints ---
  async getCustomers(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<any[]>(`/customers${query}`);
  }

  async getCustomerById(id: string) {
    return this.request<any>(`/customers/${id}`);
  }

  async createCustomer(payload: { name: string; phone: string; email?: string; address?: string; notes?: string }) {
    return this.request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Repairs Endpoints ---
  async getRepairs(params?: { search?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/repairs${queryString}`);
  }

  async getRepairById(id: string) {
    return this.request<any>(`/repairs/${id}`);
  }

  async createRepairTicket(payload: {
    customerName: string;
    customerPhone?: string;
    deviceModel: string;
    issueDescription: string;
    estimatedCost?: number;
    phoneRecordId?: string;
  }) {
    return this.request<any>('/repairs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateRepairStatus(id: string, status: string, technicianNotes?: string) {
    return this.request<any>(`/repairs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, technicianNotes }),
    });
  }

  // --- Public Verification Endpoint ---
  async verifyPublicImei(identifier: string) {
    return this.request<any>(`/verification/public/${encodeURIComponent(identifier)}`);
  }

  // ==========================================
  // --- HQ ADMIN ENDPOINTS ---
  // ==========================================

  // Dashboard
  async adminGetMetrics(timeRange: string = 'today') {
    return this.request<any>(`/admin/dashboard/metrics?timeRange=${timeRange}`);
  }

  async adminGetVerificationTraffic(timeRange: string = 'today') {
    return this.request<any>(`/admin/dashboard/chart?timeRange=${timeRange}`);
  }

  async adminGetSystemLogs() {
    return this.request<any>('/admin/dashboard/logs');
  }

  // Businesses Directory
  async adminGetBusinesses(params?: { search?: string; plan?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.plan && params.plan !== 'ALL') query.append('plan', params.plan);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any>(`/admin/businesses${qs}`);
  }

  async adminGetBusiness(id: string) {
    return this.request<any>(`/admin/businesses/${id}`);
  }

  async adminUpdateBusinessPlan(id: string, plan: string) {
    return this.request<any>(`/admin/businesses/${id}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    });
  }

  async adminToggleBusinessVerification(id: string) {
    return this.request<any>(`/admin/businesses/${id}/toggle-verification`, {
      method: 'PATCH',
    });
  }

  // Subscriptions & Plans
  async adminGetSubscriptions() {
    return this.request<any>('/admin/subscriptions');
  }

  async adminUpdateSubscriberPlan(id: string, plan: string) {
    return this.request<any>(`/admin/subscriptions/${id}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    });
  }

  // Transactions
  async adminGetTransactions(params?: { search?: string; status?: string; paymentMethod?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.paymentMethod && params.paymentMethod !== 'ALL') query.append('paymentMethod', params.paymentMethod);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any>(`/admin/transactions${qs}`);
  }

  // Support Tickets
  async adminGetSupportTickets(params?: { status?: string; priority?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.priority && params.priority !== 'ALL') query.append('priority', params.priority);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any>(`/admin/support/tickets${qs}`);
  }

  async adminGetSupportTicket(id: string) {
    return this.request<any>(`/admin/support/tickets/${id}`);
  }

  async adminUpdateSupportTicketStatus(id: string, status: string) {
    return this.request<any>(`/admin/support/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Notifications Center
  async adminGetNotifications(params?: { category?: string; status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any>(`/admin/notifications${qs}`);
  }

  async adminMarkNotificationRead(id: string) {
    return this.request<any>(`/admin/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async adminMarkAllNotificationsRead() {
    return this.request<any>('/admin/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async adminDeleteNotification(id: string) {
    return this.request<any>(`/admin/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Platform Settings
  async adminGetSettings() {
    return this.request<any>('/admin/settings');
  }

  async adminUpdateSettings(payload: any) {
    return this.request<any>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Dynamic Plans Management
  async getPlans() {
    return this.request<{ success: boolean; plans: any[] }>('/plans');
  }

  async adminGetPlans() {
    return this.request<{ success: boolean; plans: any[] }>('/admin/plans');
  }

  async adminCreatePlan(data: any) {
    return this.request<{ success: boolean; message: string; plan: any }>('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminUpdatePlan(id: string, data: any) {
    return this.request<{ success: boolean; message: string; plan: any }>(`/admin/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async adminDeletePlan(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/plans/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();

