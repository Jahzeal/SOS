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
}

export const api = new ApiClient();
