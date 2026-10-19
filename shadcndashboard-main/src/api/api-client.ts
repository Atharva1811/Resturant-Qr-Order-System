/**
 * Central API Client for Servora Restaurant SaaS
 *
 * Connects frontend components to the Node.js/Express backend.
 * Features:
 * - Real API requests to the configured backend.
 * - Authoritative JWT authentication and tenant header propagation.
 * - Actionable diagnostics for network failures (Mixed Content, connection refusal).
 * - Zero mock fallbacks: failed requests produce meaningful errors.
 */

import { BRAND_CONFIG } from 'src/config/brand.config';
import { getApiBaseUrl } from 'src/config/api.config';

export class ApiClientError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new ApiClientError(
      'Servora API URL is not configured. Set VITE_API_URL or VITE_API_BASE_URL in your environment to connect to the backend.',
      0
    );
  }

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = localStorage.getItem(BRAND_CONFIG.authTokenKey);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${response.status} Request Failed`;
      throw new ApiClientError(errorMessage, response.status, data?.details);
    }

    return (data?.data !== undefined ? data.data : data) as T;
  } catch (error: any) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Precise diagnosis of network failures
    const isHttpsToHttp =
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      baseUrl.startsWith('http:');

    let diagnosticMessage = error?.message || 'Network request failed';

    if (error?.name === 'TypeError' || diagnosticMessage === 'Failed to fetch') {
      if (isHttpsToHttp) {
        diagnosticMessage = `Mixed Content Block: The browser refused to connect from HTTPS (${window.location.origin}) to an unencrypted HTTP backend (${baseUrl}). Deploy the backend with HTTPS.`;
      } else {
        diagnosticMessage = `Cannot reach Servora API at "${baseUrl}". Verify the server is running and accessible (or check CORS settings).`;
      }
    }

    throw new ApiClientError(diagnosticMessage, 0);
  }
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const res = await request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res?.token) {
        localStorage.setItem(BRAND_CONFIG.authTokenKey, res.token);
      }
      return res;
    },

    registerRestaurant: async (payload: {
      restaurantName: string;
      slug?: string;
      cuisine?: string;
      address?: string;
      phone?: string;
      adminName: string;
      adminEmail: string;
      password: string;
      currency?: string;
      taxRate?: number;
    }) => {
      const res = await request<{ token: string; user: any; restaurant: any }>(
        '/auth/register-restaurant',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      if (res?.token) {
        localStorage.setItem(BRAND_CONFIG.authTokenKey, res.token);
      }
      return res;
    },

    getMe: async () => {
      return request('/auth/me');
    },

    logout: () => {
      localStorage.removeItem(BRAND_CONFIG.authTokenKey);
    },
  },

  // OTP Email Verification
  otp: {
    requestOtp: async (email: string, restaurantSlug: string, tableNumber?: string) => {
      return request<{ expiresAt: string; mockCode?: string }>('/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email, restaurantSlug, tableNumber }),
      });
    },

    verifyOtp: async (email: string, code: string, restaurantSlug: string, tableNumber?: string) => {
      return request<{ sessionToken: string; email: string; restaurantSlug: string; tableNumber: string }>(
        '/otp/verify',
        {
          method: 'POST',
          body: JSON.stringify({ email, code, restaurantSlug, tableNumber }),
        }
      );
    },
  },

  // Public Customer Endpoints
  public: {
    getRestaurant: async (slug: string) => {
      return request(`/public/restaurants/${slug}`);
    },

    verifyTable: async (slug: string, table: string, token?: string) => {
      const params = new URLSearchParams({ slug, table });
      if (token) params.set('token', token);
      return request(`/public/tables/verify?${params.toString()}`);
    },

    createOrder: async (payload: {
      restaurantSlug: string;
      tableNumber: string;
      tableToken?: string;
      customerName: string;
      customerEmail: string;
      sessionToken?: string;
      items: any[];
      paymentMethod: 'COUNTER' | 'ONLINE';
      notes?: string;
    }) => {
      return request('/public/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    trackOrder: async (orderId: string) => {
      return request(`/public/orders/${orderId}/track`);
    },
  },

  // Kitchen Display System
  kitchen: {
    getActiveOrders: async () => {
      return request('/kitchen/orders');
    },

    updateOrderStatus: async (orderId: string, status: string, notes?: string) => {
      return request(`/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    },
  },

  // Admin Restaurant Management
  admin: {
    // Categories
    getCategories: async () => {
      return request('/admin/categories');
    },
    createCategory: async (data: any) => {
      return request('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateCategory: async (id: string, data: any) => {
      return request(`/admin/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    deleteCategory: async (id: string) => {
      return request(`/admin/categories/${id}`, {
        method: 'DELETE',
      });
    },

    // Menu Items
    getMenuItems: async () => {
      return request('/admin/menu');
    },
    createMenuItem: async (data: any) => {
      return request('/admin/menu', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateMenuItem: async (id: string, data: any) => {
      return request(`/admin/menu/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    toggleItemAvailability: async (id: string) => {
      return request(`/admin/menu/${id}/toggle-availability`, {
        method: 'PATCH',
      });
    },
    deleteMenuItem: async (id: string) => {
      return request(`/admin/menu/${id}`, {
        method: 'DELETE',
      });
    },

    // Tables
    getTables: async () => {
      return request('/admin/tables');
    },
    createTable: async (data: any) => {
      return request('/admin/tables', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateTable: async (id: string, data: any) => {
      return request(`/admin/tables/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    regenerateTableQr: async (id: string) => {
      return request(`/admin/tables/${id}/regenerate-qr`, {
        method: 'POST',
      });
    },
    deleteTable: async (id: string) => {
      return request(`/admin/tables/${id}`, {
        method: 'DELETE',
      });
    },

    // Staff
    getStaff: async () => {
      return request('/admin/staff');
    },
    createStaff: async (data: any) => {
      return request('/admin/staff', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateStaff: async (id: string, data: any) => {
      return request(`/admin/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    deleteStaff: async (id: string) => {
      return request(`/admin/staff/${id}`, {
        method: 'DELETE',
      });
    },

    // Orders, Analytics & Settings
    getOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request(`/admin/orders?${q.toString()}`);
    },

    getAnalytics: async () => {
      return request('/admin/analytics');
    },

    updateSettings: async (data: any) => {
      return request('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // Superadmin Platform
  superadmin: {
    getTenants: async () => {
      return request('/superadmin/tenants');
    },
    createTenant: async (data: any) => {
      return request('/superadmin/tenants', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateTenantStatus: async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
      return request(`/superadmin/tenants/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    getMetrics: async () => {
      return request('/superadmin/metrics');
    },
  },

  // Payments
  payments: {
    initiate: async (orderId: string, method: 'COUNTER' | 'ONLINE', email?: string) => {
      return request('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({ orderId, method, email }),
      });
    },
    confirmCounterPay: async (orderId: string) => {
      return request(`/payments/orders/${orderId}/counter-pay`, {
        method: 'POST',
      });
    },
  },
};

export default api;
