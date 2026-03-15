export class ChargebeeClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, site: string) {
    this.apiKey = apiKey;
    this.baseUrl = `https://${site}.chargebee.com/api/v2`;
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`;
  }

  /**
   * Flatten nested object into form-encoded bracket notation.
   * { subscription: { plan_id: "basic" } } → subscription[plan_id]=basic
   */
  private flattenToForm(obj: Record<string, any>, prefix = ''): URLSearchParams {
    const params = new URLSearchParams();
    const flatten = (o: any, p: string) => {
      if (o === null || o === undefined) return;
      if (typeof o === 'object' && !Array.isArray(o)) {
        for (const [k, v] of Object.entries(o)) {
          flatten(v, p ? `${p}[${k}]` : k);
        }
      } else if (Array.isArray(o)) {
        o.forEach((v, i) => {
          if (typeof v === 'object') {
            flatten(v, `${p}[${i}]`);
          } else {
            params.append(`${p}[${i}]`, String(v));
          }
        });
      } else {
        params.append(p, String(o));
      }
    };
    flatten(obj, prefix);
    return params;
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: Record<string, any>;
      params?: Record<string, string | number | boolean | undefined>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params } = options;
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Authorization': this.getAuthHeader(),
      'Accept': 'application/json',
    };

    let requestBody: string | undefined;
    if (body) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      requestBody = this.flattenToForm(body).toString();
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      ...(requestBody ? { body: requestBody } : {}),
    });

    if (response.status === 204) return {} as T;

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error ${response.status}: ${text}`);
    }

    return response.json();
  }

  // --- Subscriptions ---

  async listSubscriptions(params?: {
    limit?: number;
    offset?: string;
    'status[is]'?: string;
    'customer_id[is]'?: string;
    'sort_by[asc]'?: string;
    'sort_by[desc]'?: string;
  }) {
    return this.request<any>('/subscriptions', { params });
  }

  async getSubscription(subscriptionId: string) {
    return this.request<any>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
  }

  async createSubscription(customerId: string, data: Record<string, any>) {
    return this.request<any>(`/customers/${encodeURIComponent(customerId)}/subscription_for_items`, {
      method: 'POST',
      body: data,
    });
  }

  async updateSubscription(subscriptionId: string, data: Record<string, any>) {
    return this.request<any>(`/subscriptions/${encodeURIComponent(subscriptionId)}/update_for_items`, {
      method: 'POST',
      body: data,
    });
  }

  async cancelSubscription(subscriptionId: string, data?: Record<string, any>) {
    return this.request<any>(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel_for_items`, {
      method: 'POST',
      body: data || {},
    });
  }

  async pauseSubscription(subscriptionId: string, data?: Record<string, any>) {
    return this.request<any>(`/subscriptions/${encodeURIComponent(subscriptionId)}/pause`, {
      method: 'POST',
      body: data || {},
    });
  }

  async resumeSubscription(subscriptionId: string, data?: Record<string, any>) {
    return this.request<any>(`/subscriptions/${encodeURIComponent(subscriptionId)}/resume`, {
      method: 'POST',
      body: data || {},
    });
  }

  async getSubscriptionRenewalEstimate(subscriptionId: string) {
    return this.request<any>(`/subscriptions/${encodeURIComponent(subscriptionId)}/renewal_estimate`);
  }

  // --- Customers ---

  async listCustomers(params?: {
    limit?: number;
    offset?: string;
    'email[is]'?: string;
    'first_name[is]'?: string;
    'sort_by[asc]'?: string;
    'sort_by[desc]'?: string;
  }) {
    return this.request<any>('/customers', { params });
  }

  async getCustomer(customerId: string) {
    return this.request<any>(`/customers/${encodeURIComponent(customerId)}`);
  }

  async createCustomer(data: Record<string, any>) {
    return this.request<any>('/customers', { method: 'POST', body: data });
  }

  async updateCustomer(customerId: string, data: Record<string, any>) {
    return this.request<any>(`/customers/${encodeURIComponent(customerId)}`, {
      method: 'POST',
      body: data,
    });
  }

  // --- Invoices ---

  async listInvoices(params?: {
    limit?: number;
    offset?: string;
    'status[is]'?: string;
    'customer_id[is]'?: string;
    'subscription_id[is]'?: string;
    'sort_by[asc]'?: string;
    'sort_by[desc]'?: string;
  }) {
    return this.request<any>('/invoices', { params });
  }

  async getInvoice(invoiceId: string) {
    return this.request<any>(`/invoices/${encodeURIComponent(invoiceId)}`);
  }

  async createInvoice(data: Record<string, any>) {
    return this.request<any>('/invoices/create_for_charge_items_and_charges', {
      method: 'POST',
      body: data,
    });
  }

  async collectInvoicePayment(invoiceId: string, data?: Record<string, any>) {
    return this.request<any>(`/invoices/${encodeURIComponent(invoiceId)}/collect_payment`, {
      method: 'POST',
      body: data || {},
    });
  }

  async voidInvoice(invoiceId: string, data?: Record<string, any>) {
    return this.request<any>(`/invoices/${encodeURIComponent(invoiceId)}/void`, {
      method: 'POST',
      body: data || {},
    });
  }

  async refundInvoice(invoiceId: string, data: Record<string, any>) {
    return this.request<any>(`/invoices/${encodeURIComponent(invoiceId)}/refund`, {
      method: 'POST',
      body: data,
    });
  }

  async getInvoicePdf(invoiceId: string) {
    return this.request<any>(`/invoices/${encodeURIComponent(invoiceId)}/pdf`, {
      method: 'POST',
      body: {},
    });
  }

  // --- Credit Notes ---

  async listCreditNotes(params?: {
    limit?: number;
    offset?: string;
    'customer_id[is]'?: string;
    'status[is]'?: string;
  }) {
    return this.request<any>('/credit_notes', { params });
  }

  async getCreditNote(creditNoteId: string) {
    return this.request<any>(`/credit_notes/${encodeURIComponent(creditNoteId)}`);
  }

  async createCreditNote(data: Record<string, any>) {
    return this.request<any>('/credit_notes', { method: 'POST', body: data });
  }

  // --- Transactions ---

  async listTransactions(params?: {
    limit?: number;
    offset?: string;
    'customer_id[is]'?: string;
    'type[is]'?: string;
    'status[is]'?: string;
  }) {
    return this.request<any>('/transactions', { params });
  }

  async getTransaction(transactionId: string) {
    return this.request<any>(`/transactions/${encodeURIComponent(transactionId)}`);
  }

  async refundTransaction(transactionId: string, data: Record<string, any>) {
    return this.request<any>(`/transactions/${encodeURIComponent(transactionId)}/refund`, {
      method: 'POST',
      body: data,
    });
  }

  // --- Items (Product Catalog) ---

  async listItems(params?: {
    limit?: number;
    offset?: string;
    'type[is]'?: string;
    'status[is]'?: string;
  }) {
    return this.request<any>('/items', { params });
  }

  async getItem(itemId: string) {
    return this.request<any>(`/items/${encodeURIComponent(itemId)}`);
  }

  async createItem(data: Record<string, any>) {
    return this.request<any>('/items', { method: 'POST', body: data });
  }

  // --- Item Prices ---

  async listItemPrices(params?: {
    limit?: number;
    offset?: string;
    'item_id[is]'?: string;
    'item_type[is]'?: string;
  }) {
    return this.request<any>('/item_prices', { params });
  }

  async getItemPrice(itemPriceId: string) {
    return this.request<any>(`/item_prices/${encodeURIComponent(itemPriceId)}`);
  }

  async createItemPrice(data: Record<string, any>) {
    return this.request<any>('/item_prices', { method: 'POST', body: data });
  }

  // --- Item Families ---

  async listItemFamilies(params?: { limit?: number; offset?: string }) {
    return this.request<any>('/item_families', { params });
  }

  async getItemFamily(itemFamilyId: string) {
    return this.request<any>(`/item_families/${encodeURIComponent(itemFamilyId)}`);
  }

  // --- Coupons ---

  async listCoupons(params?: {
    limit?: number;
    offset?: string;
    'status[is]'?: string;
  }) {
    return this.request<any>('/coupons', { params });
  }

  async getCoupon(couponId: string) {
    return this.request<any>(`/coupons/${encodeURIComponent(couponId)}`);
  }

  async createCoupon(data: Record<string, any>) {
    return this.request<any>('/coupons/create_for_items', { method: 'POST', body: data });
  }

  // --- Orders ---

  async listOrders(params?: {
    limit?: number;
    offset?: string;
    'status[is]'?: string;
    'subscription_id[is]'?: string;
  }) {
    return this.request<any>('/orders', { params });
  }

  async getOrder(orderId: string) {
    return this.request<any>(`/orders/${encodeURIComponent(orderId)}`);
  }

  // --- Quotes ---

  async listQuotes(params?: {
    limit?: number;
    offset?: string;
    'status[is]'?: string;
  }) {
    return this.request<any>('/quotes', { params });
  }

  async getQuote(quoteId: string) {
    return this.request<any>(`/quotes/${encodeURIComponent(quoteId)}`);
  }

  // --- Payment Sources ---

  async listPaymentSources(params?: {
    limit?: number;
    offset?: string;
    'customer_id[is]'?: string;
  }) {
    return this.request<any>('/payment_sources', { params });
  }

  async getPaymentSource(paymentSourceId: string) {
    return this.request<any>(`/payment_sources/${encodeURIComponent(paymentSourceId)}`);
  }

  // --- Promotional Credits ---

  async listPromotionalCredits(params?: {
    limit?: number;
    offset?: string;
    'customer_id[is]'?: string;
  }) {
    return this.request<any>('/promotional_credits', { params });
  }

  // --- Events ---

  async listEvents(params?: {
    limit?: number;
    offset?: string;
    'event_type[is]'?: string;
  }) {
    return this.request<any>('/events', { params });
  }

  async getEvent(eventId: string) {
    return this.request<any>(`/events/${encodeURIComponent(eventId)}`);
  }

  // --- Exports ---

  async exportInvoices(data?: Record<string, any>) {
    return this.request<any>('/exports/invoices', { method: 'POST', body: data || {} });
  }

  async exportSubscriptions(data?: Record<string, any>) {
    return this.request<any>('/exports/subscriptions', { method: 'POST', body: data || {} });
  }

  async exportRevenue(data?: Record<string, any>) {
    return this.request<any>('/exports/revenue_recognition', { method: 'POST', body: data || {} });
  }

  async getExport(exportId: string) {
    return this.request<any>(`/exports/${encodeURIComponent(exportId)}`);
  }

  // --- Webhooks ---

  async listWebhooks(params?: { limit?: number; offset?: string }) {
    return this.request<any>('/webhook_endpoints', { params });
  }

  async getWebhook(webhookId: string) {
    return this.request<any>(`/webhook_endpoints/${encodeURIComponent(webhookId)}`);
  }
}
