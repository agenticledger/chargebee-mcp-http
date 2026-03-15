import { z } from 'zod';
import { ChargebeeClient } from './api-client.js';

interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  handler: (client: ChargebeeClient, args: any) => Promise<any>;
}

export const tools: ToolDef[] = [
  // --- Subscriptions ---
  {
    name: 'subscriptions_list',
    description: 'List subscriptions with filters',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      status: z.string().optional().describe('filter: active, cancelled, etc'),
      customer_id: z.string().optional().describe('filter by customer'),
      sort_by: z.string().optional().describe('sort field (e.g. created_at)'),
      sort_order: z.enum(['asc', 'desc']).optional().describe('sort direction'),
    }),
    handler: async (client, args: {
      limit?: number; offset?: string; status?: string;
      customer_id?: string; sort_by?: string; sort_order?: string;
    }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.status) params['status[is]'] = args.status;
      if (args.customer_id) params['customer_id[is]'] = args.customer_id;
      if (args.sort_by && args.sort_order) params[`sort_by[${args.sort_order}]`] = args.sort_by;
      return client.listSubscriptions(params);
    },
  },
  {
    name: 'subscription_get',
    description: 'Get subscription details by ID',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
    }),
    handler: async (client, args: { subscription_id: string }) =>
      client.getSubscription(args.subscription_id),
  },
  {
    name: 'subscription_create',
    description: 'Create subscription for a customer',
    inputSchema: z.object({
      customer_id: z.string().describe('customer ID'),
      data: z.string().describe('subscription JSON'),
    }),
    handler: async (client, args: { customer_id: string; data: string }) =>
      client.createSubscription(args.customer_id, JSON.parse(args.data)),
  },
  {
    name: 'subscription_update',
    description: 'Update a subscription',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
      data: z.string().describe('update JSON'),
    }),
    handler: async (client, args: { subscription_id: string; data: string }) =>
      client.updateSubscription(args.subscription_id, JSON.parse(args.data)),
  },
  {
    name: 'subscription_cancel',
    description: 'Cancel a subscription',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
      end_of_term: z.boolean().optional().describe('cancel at term end'),
    }),
    handler: async (client, args: { subscription_id: string; end_of_term?: boolean }) =>
      client.cancelSubscription(args.subscription_id, args.end_of_term !== undefined ? { end_of_term: args.end_of_term } : undefined),
  },
  {
    name: 'subscription_pause',
    description: 'Pause a subscription',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
      data: z.string().optional().describe('pause options JSON'),
    }),
    handler: async (client, args: { subscription_id: string; data?: string }) =>
      client.pauseSubscription(args.subscription_id, args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'subscription_resume',
    description: 'Resume a paused subscription',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
    }),
    handler: async (client, args: { subscription_id: string }) =>
      client.resumeSubscription(args.subscription_id),
  },
  {
    name: 'subscription_renewal_estimate',
    description: 'Get renewal estimate for subscription',
    inputSchema: z.object({
      subscription_id: z.string().describe('subscription ID'),
    }),
    handler: async (client, args: { subscription_id: string }) =>
      client.getSubscriptionRenewalEstimate(args.subscription_id),
  },

  // --- Customers ---
  {
    name: 'customers_list',
    description: 'List customers with filters',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      email: z.string().optional().describe('filter by email'),
      first_name: z.string().optional().describe('filter by first name'),
      sort_by: z.string().optional().describe('sort field'),
      sort_order: z.enum(['asc', 'desc']).optional().describe('sort direction'),
    }),
    handler: async (client, args: {
      limit?: number; offset?: string; email?: string;
      first_name?: string; sort_by?: string; sort_order?: string;
    }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.email) params['email[is]'] = args.email;
      if (args.first_name) params['first_name[is]'] = args.first_name;
      if (args.sort_by && args.sort_order) params[`sort_by[${args.sort_order}]`] = args.sort_by;
      return client.listCustomers(params);
    },
  },
  {
    name: 'customer_get',
    description: 'Get customer details by ID',
    inputSchema: z.object({
      customer_id: z.string().describe('customer ID'),
    }),
    handler: async (client, args: { customer_id: string }) =>
      client.getCustomer(args.customer_id),
  },
  {
    name: 'customer_create',
    description: 'Create a new customer',
    inputSchema: z.object({
      data: z.string().describe('customer JSON'),
    }),
    handler: async (client, args: { data: string }) =>
      client.createCustomer(JSON.parse(args.data)),
  },
  {
    name: 'customer_update',
    description: 'Update customer details',
    inputSchema: z.object({
      customer_id: z.string().describe('customer ID'),
      data: z.string().describe('update JSON'),
    }),
    handler: async (client, args: { customer_id: string; data: string }) =>
      client.updateCustomer(args.customer_id, JSON.parse(args.data)),
  },

  // --- Invoices ---
  {
    name: 'invoices_list',
    description: 'List invoices with filters',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      status: z.string().optional().describe('paid, payment_due, etc'),
      customer_id: z.string().optional().describe('filter by customer'),
      subscription_id: z.string().optional().describe('filter by subscription'),
      sort_by: z.string().optional().describe('sort field'),
      sort_order: z.enum(['asc', 'desc']).optional().describe('sort direction'),
    }),
    handler: async (client, args: {
      limit?: number; offset?: string; status?: string;
      customer_id?: string; subscription_id?: string;
      sort_by?: string; sort_order?: string;
    }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.status) params['status[is]'] = args.status;
      if (args.customer_id) params['customer_id[is]'] = args.customer_id;
      if (args.subscription_id) params['subscription_id[is]'] = args.subscription_id;
      if (args.sort_by && args.sort_order) params[`sort_by[${args.sort_order}]`] = args.sort_by;
      return client.listInvoices(params);
    },
  },
  {
    name: 'invoice_get',
    description: 'Get invoice details by ID',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
    }),
    handler: async (client, args: { invoice_id: string }) =>
      client.getInvoice(args.invoice_id),
  },
  {
    name: 'invoice_create',
    description: 'Create invoice for charge items',
    inputSchema: z.object({
      data: z.string().describe('invoice JSON'),
    }),
    handler: async (client, args: { data: string }) =>
      client.createInvoice(JSON.parse(args.data)),
  },
  {
    name: 'invoice_collect_payment',
    description: 'Collect payment for an invoice',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
    }),
    handler: async (client, args: { invoice_id: string }) =>
      client.collectInvoicePayment(args.invoice_id),
  },
  {
    name: 'invoice_void',
    description: 'Void an invoice',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
    }),
    handler: async (client, args: { invoice_id: string }) =>
      client.voidInvoice(args.invoice_id),
  },
  {
    name: 'invoice_refund',
    description: 'Refund an invoice',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
      data: z.string().describe('refund JSON (amount, etc)'),
    }),
    handler: async (client, args: { invoice_id: string; data: string }) =>
      client.refundInvoice(args.invoice_id, JSON.parse(args.data)),
  },
  {
    name: 'invoice_pdf',
    description: 'Get invoice PDF download URL',
    inputSchema: z.object({
      invoice_id: z.string().describe('invoice ID'),
    }),
    handler: async (client, args: { invoice_id: string }) =>
      client.getInvoicePdf(args.invoice_id),
  },

  // --- Credit Notes ---
  {
    name: 'credit_notes_list',
    description: 'List credit notes',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      customer_id: z.string().optional().describe('filter by customer'),
      status: z.string().optional().describe('filter by status'),
    }),
    handler: async (client, args: {
      limit?: number; offset?: string; customer_id?: string; status?: string;
    }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.customer_id) params['customer_id[is]'] = args.customer_id;
      if (args.status) params['status[is]'] = args.status;
      return client.listCreditNotes(params);
    },
  },
  {
    name: 'credit_note_get',
    description: 'Get credit note details',
    inputSchema: z.object({
      credit_note_id: z.string().describe('credit note ID'),
    }),
    handler: async (client, args: { credit_note_id: string }) =>
      client.getCreditNote(args.credit_note_id),
  },
  {
    name: 'credit_note_create',
    description: 'Create a credit note',
    inputSchema: z.object({
      data: z.string().describe('credit note JSON'),
    }),
    handler: async (client, args: { data: string }) =>
      client.createCreditNote(JSON.parse(args.data)),
  },

  // --- Transactions ---
  {
    name: 'transactions_list',
    description: 'List payment transactions',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      customer_id: z.string().optional().describe('filter by customer'),
      type: z.string().optional().describe('payment, refund, etc'),
      status: z.string().optional().describe('success, failure, etc'),
    }),
    handler: async (client, args: {
      limit?: number; offset?: string; customer_id?: string;
      type?: string; status?: string;
    }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.customer_id) params['customer_id[is]'] = args.customer_id;
      if (args.type) params['type[is]'] = args.type;
      if (args.status) params['status[is]'] = args.status;
      return client.listTransactions(params);
    },
  },
  {
    name: 'transaction_get',
    description: 'Get transaction details',
    inputSchema: z.object({
      transaction_id: z.string().describe('transaction ID'),
    }),
    handler: async (client, args: { transaction_id: string }) =>
      client.getTransaction(args.transaction_id),
  },
  {
    name: 'transaction_refund',
    description: 'Refund a payment transaction',
    inputSchema: z.object({
      transaction_id: z.string().describe('transaction ID'),
      data: z.string().describe('refund JSON (amount, etc)'),
    }),
    handler: async (client, args: { transaction_id: string; data: string }) =>
      client.refundTransaction(args.transaction_id, JSON.parse(args.data)),
  },

  // --- Items (Product Catalog) ---
  {
    name: 'items_list',
    description: 'List product catalog items',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      type: z.string().optional().describe('plan, addon, charge'),
      status: z.string().optional().describe('active, archived'),
    }),
    handler: async (client, args: {
      limit?: number; offset?: string; type?: string; status?: string;
    }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.type) params['type[is]'] = args.type;
      if (args.status) params['status[is]'] = args.status;
      return client.listItems(params);
    },
  },
  {
    name: 'item_get',
    description: 'Get item details by ID',
    inputSchema: z.object({
      item_id: z.string().describe('item ID'),
    }),
    handler: async (client, args: { item_id: string }) =>
      client.getItem(args.item_id),
  },
  {
    name: 'item_create',
    description: 'Create a product catalog item',
    inputSchema: z.object({
      data: z.string().describe('item JSON'),
    }),
    handler: async (client, args: { data: string }) =>
      client.createItem(JSON.parse(args.data)),
  },

  // --- Item Prices ---
  {
    name: 'item_prices_list',
    description: 'List item prices',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      item_id: z.string().optional().describe('filter by item'),
      item_type: z.string().optional().describe('plan, addon, charge'),
    }),
    handler: async (client, args: {
      limit?: number; offset?: string; item_id?: string; item_type?: string;
    }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.item_id) params['item_id[is]'] = args.item_id;
      if (args.item_type) params['item_type[is]'] = args.item_type;
      return client.listItemPrices(params);
    },
  },
  {
    name: 'item_price_get',
    description: 'Get item price details',
    inputSchema: z.object({
      item_price_id: z.string().describe('item price ID'),
    }),
    handler: async (client, args: { item_price_id: string }) =>
      client.getItemPrice(args.item_price_id),
  },
  {
    name: 'item_price_create',
    description: 'Create an item price',
    inputSchema: z.object({
      data: z.string().describe('item price JSON'),
    }),
    handler: async (client, args: { data: string }) =>
      client.createItemPrice(JSON.parse(args.data)),
  },

  // --- Item Families ---
  {
    name: 'item_families_list',
    description: 'List item families',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
    }),
    handler: async (client, args: { limit?: number; offset?: string }) =>
      client.listItemFamilies({ limit: args.limit, offset: args.offset }),
  },
  {
    name: 'item_family_get',
    description: 'Get item family details',
    inputSchema: z.object({
      item_family_id: z.string().describe('item family ID'),
    }),
    handler: async (client, args: { item_family_id: string }) =>
      client.getItemFamily(args.item_family_id),
  },

  // --- Coupons ---
  {
    name: 'coupons_list',
    description: 'List discount coupons',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      status: z.string().optional().describe('active, expired, etc'),
    }),
    handler: async (client, args: { limit?: number; offset?: string; status?: string }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.status) params['status[is]'] = args.status;
      return client.listCoupons(params);
    },
  },
  {
    name: 'coupon_get',
    description: 'Get coupon details by ID',
    inputSchema: z.object({
      coupon_id: z.string().describe('coupon ID'),
    }),
    handler: async (client, args: { coupon_id: string }) =>
      client.getCoupon(args.coupon_id),
  },
  {
    name: 'coupon_create',
    description: 'Create a discount coupon',
    inputSchema: z.object({
      data: z.string().describe('coupon JSON'),
    }),
    handler: async (client, args: { data: string }) =>
      client.createCoupon(JSON.parse(args.data)),
  },

  // --- Orders ---
  {
    name: 'orders_list',
    description: 'List orders',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      status: z.string().optional().describe('filter by status'),
      subscription_id: z.string().optional().describe('filter by subscription'),
    }),
    handler: async (client, args: {
      limit?: number; offset?: string; status?: string; subscription_id?: string;
    }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.status) params['status[is]'] = args.status;
      if (args.subscription_id) params['subscription_id[is]'] = args.subscription_id;
      return client.listOrders(params);
    },
  },
  {
    name: 'order_get',
    description: 'Get order details by ID',
    inputSchema: z.object({
      order_id: z.string().describe('order ID'),
    }),
    handler: async (client, args: { order_id: string }) =>
      client.getOrder(args.order_id),
  },

  // --- Quotes ---
  {
    name: 'quotes_list',
    description: 'List quotes',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      status: z.string().optional().describe('filter by status'),
    }),
    handler: async (client, args: { limit?: number; offset?: string; status?: string }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.status) params['status[is]'] = args.status;
      return client.listQuotes(params);
    },
  },
  {
    name: 'quote_get',
    description: 'Get quote details by ID',
    inputSchema: z.object({
      quote_id: z.string().describe('quote ID'),
    }),
    handler: async (client, args: { quote_id: string }) =>
      client.getQuote(args.quote_id),
  },

  // --- Payment Sources ---
  {
    name: 'payment_sources_list',
    description: 'List payment sources',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      customer_id: z.string().optional().describe('filter by customer'),
    }),
    handler: async (client, args: { limit?: number; offset?: string; customer_id?: string }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.customer_id) params['customer_id[is]'] = args.customer_id;
      return client.listPaymentSources(params);
    },
  },
  {
    name: 'payment_source_get',
    description: 'Get payment source details',
    inputSchema: z.object({
      payment_source_id: z.string().describe('payment source ID'),
    }),
    handler: async (client, args: { payment_source_id: string }) =>
      client.getPaymentSource(args.payment_source_id),
  },

  // --- Promotional Credits ---
  {
    name: 'promotional_credits_list',
    description: 'List promotional credits',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      customer_id: z.string().optional().describe('filter by customer'),
    }),
    handler: async (client, args: { limit?: number; offset?: string; customer_id?: string }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.customer_id) params['customer_id[is]'] = args.customer_id;
      return client.listPromotionalCredits(params);
    },
  },

  // --- Events ---
  {
    name: 'events_list',
    description: 'List webhook events',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
      event_type: z.string().optional().describe('filter by event type'),
    }),
    handler: async (client, args: { limit?: number; offset?: string; event_type?: string }) => {
      const params: Record<string, any> = { limit: args.limit, offset: args.offset };
      if (args.event_type) params['event_type[is]'] = args.event_type;
      return client.listEvents(params);
    },
  },
  {
    name: 'event_get',
    description: 'Get event details by ID',
    inputSchema: z.object({
      event_id: z.string().describe('event ID'),
    }),
    handler: async (client, args: { event_id: string }) =>
      client.getEvent(args.event_id),
  },

  // --- Exports ---
  {
    name: 'export_invoices',
    description: 'Export invoices as CSV',
    inputSchema: z.object({
      data: z.string().optional().describe('export filters JSON'),
    }),
    handler: async (client, args: { data?: string }) =>
      client.exportInvoices(args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'export_subscriptions',
    description: 'Export subscriptions as CSV',
    inputSchema: z.object({
      data: z.string().optional().describe('export filters JSON'),
    }),
    handler: async (client, args: { data?: string }) =>
      client.exportSubscriptions(args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'export_revenue',
    description: 'Export revenue recognition report',
    inputSchema: z.object({
      data: z.string().optional().describe('export filters JSON'),
    }),
    handler: async (client, args: { data?: string }) =>
      client.exportRevenue(args.data ? JSON.parse(args.data) : undefined),
  },
  {
    name: 'export_get',
    description: 'Get export status and download URL',
    inputSchema: z.object({
      export_id: z.string().describe('export ID'),
    }),
    handler: async (client, args: { export_id: string }) =>
      client.getExport(args.export_id),
  },

  // --- Webhooks ---
  {
    name: 'webhooks_list',
    description: 'List webhook endpoints',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results (1-100)'),
      offset: z.string().optional().describe('pagination cursor'),
    }),
    handler: async (client, args: { limit?: number; offset?: string }) =>
      client.listWebhooks({ limit: args.limit, offset: args.offset }),
  },
  {
    name: 'webhook_get',
    description: 'Get webhook endpoint details',
    inputSchema: z.object({
      webhook_id: z.string().describe('webhook endpoint ID'),
    }),
    handler: async (client, args: { webhook_id: string }) =>
      client.getWebhook(args.webhook_id),
  },
];
