import { notify, confirmDialog } from '@/lib/feedback';
import { expiresSoon, getRefreshToken, refreshSession } from '@/lib/session';
// Unified API Client Service Layer for NoxGuarda NestJS API Backend

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_BASE_URL = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
  ? rawUrl.replace(/\/$/, '')
  : `https://${rawUrl.replace(/\/$/, '')}`;

export interface RegisterPhonePayload {
  imei1?: string;
  imei2?: string;
  serialNumber?: string;
  brand: string;
  model: string;
  color?: string;
  storageCapacity?: string;
  condition?: string;
  carrierStatus?: string;
  lockedCarrier?: string;
  activationStatus?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  warrantyDurationMonths?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deviceCategory?: 'PHONE' | 'LAPTOP' | 'PHONE_TABLET' | 'ACCESSORY';
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('vf_access_token');
  }

  /**
   * @param authToken  pass a token to use instead of the logged-in account token
   *                   (used by the public theft-report flow). `undefined` = account token.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authToken?: string | null,
    isRetry = false,
  ): Promise<T> {
    const usingAccountToken = authToken === undefined;
    let token = usingAccountToken ? this.getToken() : authToken;

    // "Keep me signed in": renew quietly shortly before the login token runs out.
    if (usingAccountToken && token && getRefreshToken() && expiresSoon(token)) {
      token = (await refreshSession()) || token;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (usingAccountToken && typeof window !== 'undefined') {
      const selectedBranchId = localStorage.getItem('vf_selected_branch_id');
      if (selectedBranchId) {
        headers['x-branch-id'] = selectedBranchId;
      }
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
        : 'Unable to connect to NoxGuarda servers. Please check your connection or server status.';

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
      // Staff switched off by the owner, or not covered by the store's plan any more.
      if (
        response.status === 403 &&
        usingAccountToken &&
        typeof window !== 'undefined' &&
        (data?.code === 'STAFF_DISABLED' || data?.code === 'STAFF_SEAT_PAUSED')
      ) {
        localStorage.removeItem('vf_access_token');
        localStorage.removeItem('vf_refresh_token');
        localStorage.removeItem('vf_user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?paused=${encodeURIComponent(data.code)}`;
        }
      }
      if (response.status === 401 && usingAccountToken && typeof window !== 'undefined') {
        // A signed-in request was refused: with "Keep me signed in", renew once and try again.
        if (token && !isRetry && getRefreshToken() && !endpoint.startsWith('/auth/')) {
          const renewed = await refreshSession();
          if (renewed) return this.request<T>(endpoint, options, authToken, true);
        }
        localStorage.removeItem('vf_access_token');
        localStorage.removeItem('vf_refresh_token');
        localStorage.removeItem('vf_user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=true';
        }
      }
      const errorMessage = data?.message || response.statusText || 'An error occurred during API request';
      const err: any = new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      err.status = response.status;
      err.code = data?.code;
      throw err;
    }

    return data as T;
  }

  // --- Staff, branches and joining a store ---
  async getMe() {
    return this.request<any>('/auth/me');
  }

  async getTeam() {
    return this.request<{
      limits: { planCode: string; planName: string; maxStaff: number; maxBranches: number; assignableRoles: string[] };
      seatsUsed: number;
      branchesUsed: number;
      members: Array<{ id: string; firstName: string; lastName: string; email: string; storeRole: string; isActive: boolean; createdAt: string; branch: { id: string; name: string } | null }>;
      invites: Array<{ id: string; email: string; firstName: string; lastName: string; storeRole: string; expiresAt: string; branch: { id: string; name: string } | null }>;
      branches: Array<{ id: string; name: string; address: string | null; phone: string | null; isMain: boolean; isActive: boolean }>;
      canManage: boolean;
      isOwner: boolean;
    }>('/team');
  }

  async inviteStaff(payload: { email: string; firstName: string; lastName: string; storeRole: string; branchId?: string | null }) {
    return this.request<{ id: string; email: string; inviteLink: string; emailSent: boolean; expiresAt: string }>('/team/invites', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async revokeStaffInvite(id: string) {
    return this.request<{ success: boolean }>(`/team/invites/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async updateStaffMember(id: string, payload: { storeRole?: string; branchId?: string | null; isActive?: boolean }) {
    return this.request<any>(`/team/members/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async getBranches() {
    return this.request<Array<{ id: string; name: string; address: string | null; phone: string | null; isMain: boolean; isActive: boolean }>>('/branches');
  }

  async createBranch(payload: { name: string; address?: string; phone?: string }) {
    return this.request<any>('/branches', { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateBranch(id: string, payload: { name?: string; address?: string; phone?: string; isActive?: boolean }) {
    return this.request<any>(`/branches/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
  }

  async describeInvite(token: string) {
    return this.request<{ storeName: string; firstName: string; lastName: string; email: string; role: string; branch: string | null }>(
      `/join/${encodeURIComponent(token)}`,
      {},
      null,
    );
  }

  async acceptInvite(token: string, password: string) {
    return this.request<{ accessToken: string; user: any }>('/join', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }, null);
  }

  // --- Auth & Profile Endpoints ---
  async login(email: string, password: string, rememberMe = false) {
    return this.request<{ accessToken: string; refreshToken?: string; user: any }>('/auth/login', {
      method: 'POST',
      // Sent only when ticked, so sign-in keeps working against a server that predates it.
      body: JSON.stringify({ email, password, ...(rememberMe ? { rememberMe: true } : {}) }),
    });
  }

  /** "Sign out other devices": ends every sign-in of this account except this one. */
  async logoutOtherDevices() {
    return this.request<{ success: boolean; signedOut: number }>('/auth/logout-others', { method: 'POST' });
  }

  async registerBusiness(data: any) {
    return this.request<{ accessToken: string; refreshToken: string; user: any; pendingPlan?: string | null }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async googleAuth(payload: {
    credential: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    phone?: string;
    plan?: string;
    rememberMe?: boolean;
  }) {
    return this.request<{ accessToken: string; refreshToken?: string; user: any; isNewUser?: boolean; pendingPlan?: string | null }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendOtp(email: string, fullName?: string) {
    return this.request<{ success: boolean; message: string; devCode?: string; emailDelivery?: boolean }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, fullName }),
    });
  }

  async verifyOtp(email: string, code: string) {
    return this.request<{ success: boolean; verified: boolean; emailVerificationToken?: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  /** Public Contact Us form. Emailed to the NoxGuarda team. */
  async sendContactMessage(payload: {
    name: string;
    email: string;
    phone?: string;
    storeName?: string;
    topic: string;
    message: string;
    website?: string;
  }) {
    return this.request<{ success: boolean }>('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
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

  async updateUserProfile(data: { firstName?: string; lastName?: string; password?: string; currentPassword?: string }) {
    return this.request<{ success: boolean; message: string; user: any; signedOutOthers?: number }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
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
        totalProfit?: number;
        profitMargin?: number;
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

  async deleteAccount(payload: { password?: string; confirmText?: string }) {
    return this.request<{ success: boolean }>('/business/account', {
      method: 'DELETE',
      body: JSON.stringify(payload),
    });
  }

  // --- Phone Registration & Inventory Endpoints ---
  async checkImei(imei: string) {
    return this.request<{ exists: boolean; record: any; message: string }>(`/phones/check-imei?imei=${encodeURIComponent(imei)}`);
  }

  async lookupDevice(identifier: string, category: 'LAPTOP' | 'PHONE' | 'ITEM' = 'LAPTOP') {
    return this.request<{
      found: boolean;
      brand?: string;
      model?: string;
      suggestedModels?: string[];
      specs?: string;
      deviceCategory?: 'PHONE_TABLET' | 'LAPTOP' | 'ACCESSORY';
      confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
      source?: string;
    }>(`/phones/lookup-device?identifier=${encodeURIComponent(identifier)}&category=${category}`);
  }

  async identifyDevice(payload: {
    identifier: string;
    deviceType?: 'laptop' | 'phone' | 'item' | 'accessory';
    identifierType?: 'serial' | 'imei' | 'barcode' | 'sku';
    productNumber?: string;
    brandHint?: string;
  }) {
    return this.request<{
      status: 'identified' | 'additional_information_required' | 'not_found' | 'provider_unavailable';
      device?: {
        deviceType: 'laptop' | 'phone' | 'item' | 'accessory';
        manufacturer: string;
        productName: string;
        modelNumber?: string | null;
        productNumber?: string | null;
        serialNumber: string;
        specs?: string | null;
        warrantyStatus?: 'active' | 'expired' | 'unknown' | null;
        warrantyStartDate?: string | null;
        warrantyEndDate?: string | null;
        suggestedModels?: string[];
      } | null;
      requiredFields?: string[];
      message?: string;
      source: string;
      confidence: 'high' | 'medium' | 'low';
    }>('/devices/lookup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getPriceSuggestion(params: { brand: string; model: string; storageCapacity?: string; condition?: string }) {
    const query = new URLSearchParams();
    if (params.brand) query.append('brand', params.brand);
    if (params.model) query.append('model', params.model);
    if (params.storageCapacity) query.append('storageCapacity', params.storageCapacity);
    if (params.condition) query.append('condition', params.condition);
    return this.request<{
      found: boolean;
      sellingPrice: number | null;
      purchasePrice: number | null;
      warrantyDurationMonths?: number;
      brand: string;
      model: string;
      storageCapacity?: string;
    }>(`/phones/price-suggestion?${query.toString()}`);
  }

  async registerPhone(payload: RegisterPhonePayload) {
    return this.request<any>('/phones/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getInventory(params?: { search?: string; status?: string; brand?: string; global?: boolean }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.brand) query.append('brand', params.brand);
    if (params?.global) query.append('global', 'true');

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/phones${queryString}`);
  }

  async getPhoneById(id: string) {
    return this.request<any>(`/phones/${id}`);
  }

  async updatePhone(id: string, data: any) {
    return this.request<any>(`/phones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePhone(id: string) {
    return this.request<any>(`/phones/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Express POS Checkout & Invoices / Receipts Endpoints ---
  async checkoutSale(payload: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    type?: 'RECEIPT' | 'INVOICE';
    dueDate?: string;
    paymentTerms?: string;
    billingAddress?: string;
    notes?: string;
    items: { phoneRecordId?: string; description?: string; price: number; quantity?: number }[];
  }) {
    return this.request<any>('/sales/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Swaps & Trade-ins ---
  async checkTradeInDevice(identifier: string, category: 'PHONE' | 'LAPTOP') {
    return this.request<TradeInCheck>(
      `/trade-ins/check?identifier=${encodeURIComponent(identifier)}&category=${category}`,
    );
  }

  async createTradeIn(payload: CreateTradeInPayload) {
    return this.request<{ tradeIn: any; sale: any | null }>('/trade-ins', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTradeIns(params?: { filter?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.filter) query.append('filter', params.filter);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ summary: { count: number; totalValue: number; blocked: number }; tradeIns: any[] }>(`/trade-ins${qs}`);
  }

  async getTradeIn(id: string) {
    return this.request<any>(`/trade-ins/${encodeURIComponent(id)}`);
  }

  // --- Daily summary ---
  async getDailySummaryToday() {
    return this.request<{ day: string; dayLabel: string; showAmounts?: boolean; summary: DailySummaryData }>('/daily-summary/today');
  }

  async getDailySummarySettings() {
    return this.request<DailySummarySettings>('/daily-summary/settings');
  }

  async updateDailySummarySettings(payload: { enabled?: boolean; extraEmails?: string[] }) {
    return this.request<DailySummarySettings>('/daily-summary/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // --- Push notifications ---
  async getPushPublicKey() {
    return this.request<{ publicKey: string | null; enabled: boolean }>('/push/public-key');
  }

  async savePushSubscription(subscription: any) {
    return this.request<{ success: boolean }>('/push/subscribe', { method: 'POST', body: JSON.stringify(subscription) });
  }

  async removePushSubscription(endpoint: string) {
    return this.request<{ success: boolean }>('/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) });
  }

  async adminGetPushCampaigns() {
    return this.request<{ campaigns: PushCampaign[]; devices: { total: number; byPlan: Record<string, number> }; enabled: boolean }>('/admin/push-campaigns');
  }

  async adminSavePushCampaign(input: PushCampaignInput, id?: string) {
    return this.request<PushCampaign>(id ? `/admin/push-campaigns/${id}` : '/admin/push-campaigns', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(input),
    });
  }

  async adminSetPushCampaignActive(id: string, isActive: boolean) {
    return this.request<PushCampaign>(`/admin/push-campaigns/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
  }

  async adminDeletePushCampaign(id: string) {
    return this.request<{ success: boolean }>(`/admin/push-campaigns/${id}`, { method: 'DELETE' });
  }

  async adminTestPushCampaign(id: string) {
    return this.request<{ recipients: number; delivered: number }>(`/admin/push-campaigns/${id}/test`, { method: 'POST' });
  }

  async adminSendPushCampaignNow(id: string) {
    return this.request<{ recipients: number; delivered: number }>(`/admin/push-campaigns/${id}/send-now`, { method: 'POST' });
  }

  async adminAddStarterPushCampaigns() {
    return this.request<any>('/admin/push-campaigns/starter', { method: 'POST' });
  }

  // --- Commercial Invoices Endpoints ---
  async getInvoices(search?: string, status?: string) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status && status !== 'ALL') params.set('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/sales/invoices${qs}`);
  }

  async getInvoiceById(id: string) {
    return this.request<any>(`/sales/invoices/${id}`);
  }

  async createInvoice(payload: any) {
    return this.request<any>('/sales/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateInvoice(id: string, payload: any) {
    return this.request<any>(`/sales/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async markInvoicePaid(
    id: string,
    payload?: { paymentMethod?: string; amount?: number; reference?: string; notes?: string } | string,
  ) {
    const body = typeof payload === 'string' ? { paymentMethod: payload } : payload;
    return this.request<any>(`/sales/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(body || {}),
    });
  }

  async payInvoice(
    id: string,
    payload?: { paymentMethod?: string; amount?: number; reference?: string; notes?: string } | string,
  ) {
    return this.markInvoicePaid(id, payload);
  }

  async deleteInvoice(id: string) {
    return this.request<{ success: boolean; message: string }>(`/sales/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  async sendInvoiceEmail(id: string, email?: string) {
    return this.request<{ success: boolean; message?: string; recipient?: string; dispatched?: boolean }>(
      `/sales/invoices/${id}/email`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    );
  }

  getInvoicePdfDownloadUrl(id: string): string {
    return `${API_BASE_URL}/sales/invoices/${id}/pdf`;
  }

  getPublicDocumentPdfUrl(type: 'INVOICE' | 'RECEIPT' | 'QUOTE', id: string): string {
    const slug = type === 'INVOICE' ? 'invoices' : type === 'RECEIPT' ? 'receipts' : 'quotes';
    return `${API_BASE_URL}/public/documents/${slug}/${id}/pdf`;
  }

  /**
   * PDFs need the login token, which must travel in a header (never in the URL,
   * where it would end up in browser history and server logs). So a PDF link
   * cannot be a plain href: fetch it, then hand the file to the browser.
   */
  async downloadPdf(url: string, filename: string): Promise<void> {
    const file = await this.fetchPdfFile(url, filename);
    const blobUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  }

  /** onClick handler for PDF links and buttons. */
  handlePdfLinkClick = (event: { preventDefault: () => void }, url: string, filename: string) => {
    event.preventDefault();
    this.downloadPdf(url, filename).catch((err: any) => {
      notify(err?.message || 'Could not download the PDF. Please try again.');
    });
  };

  async fetchPdfFile(url: string, filename: string): Promise<File> {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to generate PDF (${res.status} ${res.statusText})`);
    }
    const blob = await res.blob();
    return new File([blob], filename, { type: 'application/pdf' });
  }

  // --- Quotations & Estimates Endpoints ---
  async getQuotes(params?: { search?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/quotes${qs}`);
  }

  async getQuoteStats() {
    return this.request<{
      totalQuotesCount: number;
      totalQuotedAmount: number;
      acceptedAmount: number;
      acceptedCount: number;
      convertedCount: number;
      activeCount: number;
      totalDepositCollected: number;
      totalOutstandingCredit: number;
      conversionRate: number;
    }>('/quotes/stats');
  }

  async getQuoteById(id: string) {
    return this.request<any>(`/quotes/${id}`);
  }

  async getQuote(id: string) {
    return this.request<any>(`/quotes/${id}`);
  }

  async createQuote(payload: any) {
    return this.request<any>('/quotes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateQuote(id: string, payload: any) {
    return this.request<any>(`/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteQuote(id: string) {
    return this.request<any>(`/quotes/${id}`, {
      method: 'DELETE',
    });
  }

  async sendQuoteEmail(id: string, email?: string) {
    return this.request<{ success: boolean; messageId?: string; sentTo?: string }>(
      `/quotes/${id}/email`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    );
  }

  async recordQuotePayment(id: string, payload: { amount: number; paymentMethod?: string; reference?: string; notes?: string; installmentId?: string }) {
    return this.request<any>(`/quotes/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendQuoteInstallmentReminder(id: string, payload?: { installmentId?: string }) {
    return this.request<{
      success: boolean;
      emailSent: boolean;
      targetInstallment?: any;
      whatsappMsg?: string;
      whatsappUrl?: string;
      message?: string;
    }>(`/quotes/${id}/remind`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  async convertQuoteToSale(id: string, payload?: { paymentMethod?: string; notes?: string; asInvoice?: boolean }) {
    return this.request<{ sale: any; quote: any }>(`/quotes/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  getQuotePdfDownloadUrl(id: string): string {
    return `${API_BASE_URL}/quotes/${id}/pdf`;
  }

  // --- POS Receipts Endpoints ---
  async getReceipts(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<any[]>(`/sales/receipts${query}`);
  }

  async getReceiptById(id: string) {
    return this.request<any>(`/sales/receipts/${id}`);
  }

  async createReceipt(payload: any) {
    return this.request<any>('/sales/receipts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendReceiptEmail(id: string, email?: string) {
    return this.request<{ success: boolean; message?: string; recipient?: string; dispatched?: boolean }>(
      `/sales/receipts/${id}/email`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    );
  }

  getReceiptPdfDownloadUrl(id: string): string {
    return `${API_BASE_URL}/sales/receipts/${id}/pdf`;
  }

  async sendSaleEmail(id: string, email?: string) {
    return this.request<{ success: boolean; message?: string; recipient?: string; dispatched?: boolean }>(
      `/sales/${id}/email`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    );
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

  async adminCancelSubscriberPlan(id: string) {
    return this.request<any>(`/admin/subscriptions/${id}/cancel`, {
      method: 'PATCH',
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



  // Dynamic Plans Management
  async getPlans() {
    return this.request<{ success: boolean; plans: any[] }>('/plans');
  }

  // --- Marketers ---
  async adminListMarketers() {
    return this.request<any[]>('/admin/marketers');
  }

  async adminGetMarketer(id: string) {
    return this.request<any>(`/admin/marketers/${encodeURIComponent(id)}`);
  }

  async adminCreateMarketer(data: { firstName: string; lastName: string; email: string; phone?: string }) {
    return this.request<{ id: string; email: string; inviteLink: string; emailSent: boolean }>('/admin/marketers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminResendMarketerInvite(id: string) {
    return this.request<{ id: string; email: string; inviteLink: string; emailSent: boolean }>(
      `/admin/marketers/${encodeURIComponent(id)}/resend`,
      { method: 'POST' },
    );
  }

  async adminSetMarketerActive(id: string, active: boolean) {
    return this.request<{ id: string; status: string }>(`/admin/marketers/${encodeURIComponent(id)}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  }

  async adminCancelMarketerInvite(id: string) {
    return this.request<{ success: boolean }>(`/admin/marketers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async adminRemoveMarketerReferral(id: string, referralId: string) {
    return this.request<{ success: boolean }>(
      `/admin/marketers/${encodeURIComponent(id)}/referrals/${encodeURIComponent(referralId)}`,
      { method: 'DELETE' },
    );
  }

  async describeMarketerInvite(token: string) {
    return this.request<{ firstName: string; lastName: string; email: string }>(
      `/marketer-join/${encodeURIComponent(token)}`,
      {},
      null,
    );
  }

  async acceptMarketerInvite(token: string, password: string, storeName?: string) {
    return this.request<{ accessToken: string; user: any }>('/marketer-join', {
      method: 'POST',
      body: JSON.stringify({ token, password, storeName }),
    }, null);
  }

  async getMyOnboardedBusinesses() {
    return this.request<{ counts: { added: number; signedUp: number; paid: number }; referrals: any[] }>('/marketer/businesses');
  }

  async addOnboardedBusiness(data: { email: string; shopName?: string; phone?: string }) {
    return this.request<any>('/marketer/businesses', { method: 'POST', body: JSON.stringify(data) });
  }

  async removeOnboardedBusiness(id: string) {
    return this.request<{ success: boolean }>(`/marketer/businesses/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

  async adminReorderPlans(items: { id: string; sortOrder: number }[]) {
    return this.request<{ success: boolean; message: string }>('/admin/plans/reorder/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    });
  }

  async adminDeletePlan(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/plans/${id}`, {
      method: 'DELETE',
    });
  }

  // Paystack Subscription Billing
  async initializeSubscriptionPayment(payload: { planCode: string; billingCycle?: 'MONTHLY' | 'ANNUAL' }) {
    return this.request<{
      success: boolean;
      reference: string;
      accessCode: string;
      authorizationUrl: string;
      amountNgn: number;
      planCode: string;
      planName: string;
      billingCycle: string;
    }>('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifySubscriptionPayment(reference: string) {
    return this.request<{
      success: boolean;
      message: string;
      business: any;
    }>(`/payments/verify/${encodeURIComponent(reference)}`);
  }

  // --- Admin Platform & Email Template Settings ---
  async adminGetSettings() {
    return this.request<{
      success: boolean;
      data: {
        platformName?: string;
        maintenanceMode?: boolean;
        allowPublicRegistrations?: boolean;
        defaultTrialDays?: number;
        rateLimitPerMinute?: number;
        maxLookupsPerDayFree?: number;
        alertEmail?: string;
        webhookSecret?: string;
        paystackLiveEnabled?: boolean;
        welcomeEmailEnabled?: boolean;
        welcomeEmailSubject?: string;
        welcomeEmailHeading?: string;
        welcomeEmailSubheading?: string;
        welcomeEmailBody?: string;
        welcomeEmailCtaText?: string;
      };
    }>('/admin/settings');
  }

  async adminUpdateSettings(partial: any) {
    return this.request<{ success: boolean; data: any }>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(partial),
    });
  }

  async adminSendTestWelcomeEmail(payload: {
    email: string;
    template?: {
      subject?: string;
      heading?: string;
      subheading?: string;
      body?: string;
      ctaText?: string;
    };
  }) {
    return this.request<{
      success: boolean;
      messageId?: string;
      error?: string;
      recipient: string;
    }>('/admin/settings/test-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Dashboard Store Notifications ---
  async getDashboardNotifications() {
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        title: string;
        description: string;
        createdAt: string;
        icon: 'phone' | 'shield' | 'receipt' | 'bell';
        href: string;
      }>;
    }>('/dashboard/notifications');
  }

  // --- Theft & Blacklist Reporting ---
  async flagPhoneStolen(id: string, payload: { theftReason?: string; lostNote?: string; contactPhone?: string; policeCaseNo?: string }) {
    return this.request<any>(`/phones/${id}/flag-stolen`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async clearPhoneStolen(id: string) {
    return this.request<any>(`/phones/${id}/clear-stolen`, {
      method: 'PATCH',
    });
  }

  /** Exchanges a real Google sign-in for a reporter session (verified on the server). */
  async createTheftReporterSession(credential: string) {
    return this.request<{ token: string; email: string; name: string; avatarUrl?: string | null }>(
      '/theft-reports/session',
      {
        method: 'POST',
        body: JSON.stringify({ credential }),
      },
      null,
    );
  }

  async submitPublicTheftReport(
    payload: {
      imei1?: string;
      imei2?: string;
      serialNumber?: string;
      brand: string;
      model: string;
      color?: string;
      ownerName?: string;
      ownerPhone: string;
      lostNote?: string;
      bountyAmount?: number;
      policeCaseNo?: string;
    },
    reporterToken: string,
  ) {
    return this.request<any>(
      '/theft-reports/public-report',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      reporterToken,
    );
  }

  async resolveTheftReport(id: string, payload: { resolvedNote?: string }, reporterToken: string) {
    return this.request<any>(
      `/theft-reports/resolve/${id}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      reporterToken,
    );
  }

  async getUserTheftReports(reporterToken: string) {
    return this.request<any[]>('/theft-reports/user-reports', {}, reporterToken);
  }

  async publicVerifyDevice(identifier: string) {
    return this.request<any>(`/verification/verify/${encodeURIComponent(identifier)}`);
  }

  // --- Admin Error Logs Endpoints ---
  async getErrorLogs(params?: { search?: string; statusCode?: number; errorType?: string; limit?: number; page?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.statusCode) query.append('statusCode', params.statusCode.toString());
    if (params?.errorType) query.append('errorType', params.errorType);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.page) query.append('page', params.page.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{
      logs: any[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
      stats: { totalErrors: number; serverErrors500: number; clientErrors400: number };
    }>(`/admin/errors${qs}`);
  }

  async getErrorById(id: string) {
    return this.request<any>(`/admin/errors/${id}`);
  }

  async deleteErrorLog(id: string) {
    return this.request<any>(`/admin/errors/${id}`, { method: 'DELETE' });
  }

  async clearAllErrorLogs() {
    return this.request<any>('/admin/errors', { method: 'DELETE' });
  }
}

export const api = new ApiClient();

export interface TradeInCheck {
  identifier: string;
  stolen: boolean;
  stolenSince: string | null;
  alreadyInStock: boolean;
  soldByUsBefore: boolean;
  ownDevice: { brand: string; model: string; storageCapacity?: string | null; color?: string | null; status: string } | null;
  otherStore: { name: string; since: string } | null;
}

export interface CreateTradeInPayload {
  incoming: {
    category: 'PHONE' | 'LAPTOP';
    imei1?: string;
    imei2?: string;
    serialNumber?: string;
    brand: string;
    model: string;
    storageCapacity?: string;
    color?: string;
    condition: string;
    tradeInValue: number;
  };
  items?: { phoneRecordId?: string; description?: string; price: number; quantity?: number }[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  idType?: string;
  idNumber?: string;
  ownershipConfirmed: boolean;
  paymentMethod?: string;
}

export interface DailySummaryData {
  salesCount: number;
  revenue: number;
  profit?: number;
  itemsWithoutCost?: number;
  devicesSold: Array<{ description: string; price: number }>;
  devicesSoldCount: number;
  tradeInsCount: number;
  tradeInsValue: number;
  blockedCount: number;
  owed: number;
  topSeller: { name: string; sales: number } | null;
}

export interface DailySummarySettings {
  enabled: boolean;
  extraEmails: string[];
  includedInPlan: boolean;
  sendTime: string;
}

export interface PushCampaignMessage {
  title: string;
  body: string;
  url?: string;
}

export interface PushCampaignInput {
  name: string;
  kind: 'REMINDER' | 'PLAN_EXPIRY';
  messages: PushCampaignMessage[];
  targetPlans: string[];
  audience: 'OWNERS' | 'OWNERS_MANAGERS' | 'ALL_STAFF';
  timesOfDay: string[];
  daysOfWeek: number[];
  daysBeforeExpiry: number[];
  isActive: boolean;
}

export interface PushCampaign extends PushCampaignInput {
  id: string;
  sentCount: number;
  lastSentAt: string | null;
  createdAt: string;
}
