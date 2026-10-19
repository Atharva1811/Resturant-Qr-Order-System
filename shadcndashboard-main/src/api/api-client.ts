/**
 * Central API Client for Servora Restaurant SaaS
 *
 * Connects frontend components to the Node.js/Express backend.
 * Features:
 * - Real API requests when backend is configured and test mode is disabled.
 * - Actionable diagnostics for connection failures (Mixed content, CORS, offline).
 * - Isolated Frontend Test Mode for offline previewing without fake backend claims.
 */

import { BRAND_CONFIG } from 'src/config/brand.config';
import { getApiBaseUrl, isTestMode } from 'src/config/api.config';
import {
  mockService,
  INITIAL_TEST_RESTAURANT,
  INITIAL_TEST_CATEGORIES,
  INITIAL_TEST_MENU_ITEMS,
} from './mock-service';

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
      'Servora API URL is not configured. Set VITE_API_URL in your environment, or enable Frontend Test Mode to preview the UI without a backend.',
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
        diagnosticMessage = `Cannot reach Servora API at "${baseUrl}". Verify the server is running and accessible (or check CORS settings). Enable Frontend Test Mode to preview the application offline.`;
      }
    }

    throw new ApiClientError(diagnosticMessage, 0);
  }
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      if (isTestMode()) {
        const previewUser = {
          id: 'u-preview-01',
          name: 'Preview Administrator',
          email,
          role: 'RESTAURANT_ADMIN',
          restaurantSlug: 'rustic-hearth',
          isTestMode: true,
        };
        const token = 'test_preview_token';
        localStorage.setItem(BRAND_CONFIG.authTokenKey, token);
        return { token, user: previewUser, isTestMode: true };
      }

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
      if (isTestMode()) {
        const previewUser = {
          id: 'u-preview-new',
          name: payload.adminName,
          email: payload.adminEmail,
          role: 'RESTAURANT_ADMIN',
          restaurantSlug: payload.slug || 'preview-bistro',
          isTestMode: true,
        };
        const token = 'test_preview_token';
        localStorage.setItem(BRAND_CONFIG.authTokenKey, token);
        return {
          token,
          user: previewUser,
          restaurant: {
            id: 'rest-preview-new',
            name: payload.restaurantName,
            slug: payload.slug || 'preview-bistro',
          },
          isTestMode: true,
        };
      }

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
      if (isTestMode()) {
        return {
          id: 'u-preview-01',
          name: 'Preview Administrator',
          email: 'admin@rustichearth.test',
          role: 'RESTAURANT_ADMIN',
          restaurant: INITIAL_TEST_RESTAURANT,
          isTestMode: true,
        };
      }
      return request('/auth/me');
    },

    logout: () => {
      localStorage.removeItem(BRAND_CONFIG.authTokenKey);
    },
  },

  // OTP Email Verification
  otp: {
    requestOtp: async (email: string, restaurantSlug: string, tableNumber?: string) => {
      if (isTestMode()) {
        return {
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          mockCode: '123456',
          isTestMode: true,
        };
      }
      return request<{ expiresAt: string; mockCode?: string }>('/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email, restaurantSlug, tableNumber }),
      });
    },

    verifyOtp: async (email: string, code: string, restaurantSlug: string, tableNumber?: string) => {
      if (isTestMode()) {
        return {
          sessionToken: `test-ses-${Date.now()}`,
          email,
          restaurantSlug,
          tableNumber: tableNumber || 'Table 1',
          isTestMode: true,
        };
      }
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
      if (isTestMode()) {
        return mockService.getRestaurantProfile(slug);
      }
      return request(`/public/restaurants/${slug}`);
    },

    verifyTable: async (slug: string, table: string, token?: string) => {
      if (isTestMode()) {
        const res = mockService.verifyTable(slug, table, token);
        if (!res.isValid) {
          throw new ApiClientError(res.error || 'Test Mode: Table verification failed', 400);
        }
        return res;
      }

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
      if (isTestMode()) {
        return mockService.createOrder(payload);
      }
      return request('/public/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    trackOrder: async (orderId: string) => {
      if (isTestMode()) {
        return {
          order: {
            id: orderId,
            orderNumber: 'TEST-ORD-1011',
            status: 'NEW',
            customerName: 'Preview Guest',
            tableNumberSnapshot: 'Table 1',
            subtotal: 23.0,
            tax: 1.95,
            total: 24.95,
            paymentMethod: 'COUNTER',
            paymentStatus: 'PENDING',
            items: [],
            isTestMode: true,
          },
        };
      }
      return request(`/public/orders/${orderId}/track`);
    },
  },

  // Kitchen Display System
  kitchen: {
    getActiveOrders: async () => {
      if (isTestMode()) {
        return [];
      }
      return request('/kitchen/orders');
    },

    updateOrderStatus: async (orderId: string, status: string, notes?: string) => {
      if (isTestMode()) {
        return { success: true, orderId, status };
      }
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
      if (isTestMode()) return INITIAL_TEST_CATEGORIES;
      return request('/admin/categories');
    },
    createCategory: async (data: any) => {
      if (isTestMode()) return { id: `cat-${Date.now()}`, ...data };
      return request('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateCategory: async (id: string, data: any) => {
      if (isTestMode()) return { id, ...data };
      return request(`/admin/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    deleteCategory: async (id: string) => {
      if (isTestMode()) return { success: true };
      return request(`/admin/categories/${id}`, {
        method: 'DELETE',
      });
    },

    // Menu Items
    getMenuItems: async () => {
      if (isTestMode()) return INITIAL_TEST_MENU_ITEMS;
      return request('/admin/menu');
    },
    createMenuItem: async (data: any) => {
      if (isTestMode()) return { id: `item-${Date.now()}`, ...data };
      return request('/admin/menu', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateMenuItem: async (id: string, data: any) => {
      if (isTestMode()) return { id, ...data };
      return request(`/admin/menu/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    toggleItemAvailability: async (id: string) => {
      if (isTestMode()) return { id, isAvailable: true };
      return request(`/admin/menu/${id}/toggle-availability`, {
        method: 'PATCH',
      });
    },
    deleteMenuItem: async (id: string) => {
      if (isTestMode()) return { success: true };
      return request(`/admin/menu/${id}`, {
        method: 'DELETE',
      });
    },

    // Tables
    getTables: async () => {
      if (isTestMode()) return mockService.getTables();
      return request('/admin/tables');
    },
    createTable: async (data: any) => {
      if (isTestMode()) return mockService.createTable(data);
      return request('/admin/tables', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateTable: async (id: string, data: any) => {
      if (isTestMode()) return { id, ...data };
      return request(`/admin/tables/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    regenerateTableQr: async (id: string) => {
      if (isTestMode()) return mockService.regenerateTableQr(id);
      return request(`/admin/tables/${id}/regenerate-qr`, {
        method: 'POST',
      });
    },
    deleteTable: async (id: string) => {
      if (isTestMode()) return mockService.deleteTable(id);
      return request(`/admin/tables/${id}`, {
        method: 'DELETE',
      });
    },

    // Staff
    getStaff: async () => {
      if (isTestMode()) {
        return [
          {
            id: 's-preview-1',
            restaurantSlug: 'rustic-hearth',
            name: 'Chef Pierre [Preview Staff]',
            email: 'pierre@rustic.test',
            role: 'RESTAURANT_ADMIN',
            status: 'ACTIVE',
            joinedDate: '2026-01-01',
          },
        ];
      }
      return request('/admin/staff');
    },
    createStaff: async (data: any) => {
      if (isTestMode()) return { id: `staff-${Date.now()}`, ...data };
      return request('/admin/staff', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateStaff: async (id: string, data: any) => {
      if (isTestMode()) return { id, ...data };
      return request(`/admin/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    deleteStaff: async (id: string) => {
      if (isTestMode()) return { success: true };
      return request(`/admin/staff/${id}`, {
        method: 'DELETE',
      });
    },

    // Orders, Analytics & Settings
    getOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
      if (isTestMode()) return [];
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request(`/admin/orders?${q.toString()}`);
    },

    getAnalytics: async () => {
      if (isTestMode()) {
        return {
          totalRevenue: 840.5,
          totalOrders: 18,
          activeTables: 3,
          revenueChange: 12.5,
          ordersChange: 8.2,
          tablesChange: 0,
          averageOrderValue: 46.69,
          peakHour: '7:00 PM - 9:00 PM',
          chartData: [
            { day: 'Mon', revenue: 120, orders: 4 },
            { day: 'Tue', revenue: 95, orders: 3 },
            { day: 'Wed', revenue: 140, orders: 5 },
            { day: 'Thu', revenue: 110, orders: 4 },
            { day: 'Fri', revenue: 210, orders: 8 },
            { day: 'Sat', revenue: 290, orders: 11 },
            { day: 'Sun', revenue: 240, orders: 9 },
          ],
        };
      }
      return request('/admin/analytics');
    },

    updateSettings: async (data: any) => {
      if (isTestMode()) return { ...INITIAL_TEST_RESTAURANT, ...data };
      return request('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // Superadmin Platform
  superadmin: {
    getTenants: async () => {
      if (isTestMode()) return [INITIAL_TEST_RESTAURANT];
      return request('/superadmin/tenants');
    },
    createTenant: async (data: any) => {
      if (isTestMode()) return { id: `tenant-${Date.now()}`, ...data };
      return request('/superadmin/tenants', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateTenantStatus: async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
      if (isTestMode()) return { id, status };
      return request(`/superadmin/tenants/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    getMetrics: async () => {
      if (isTestMode()) {
        return {
          totalRestaurants: 1,
          activeRestaurants: 1,
          suspendedRestaurants: 0,
          totalOrdersAllTime: 18,
          totalGrossVolume: 840.5,
        };
      }
      return request('/superadmin/metrics');
    },
  },

  // Payments
  payments: {
    initiate: async (orderId: string, method: 'COUNTER' | 'ONLINE', email?: string) => {
      if (isTestMode()) {
        return {
          paymentId: `pay-test-${Date.now()}`,
          orderId,
          method,
          status: method === 'ONLINE' ? 'INITIATED' : 'PENDING',
          isTestMode: true,
        };
      }
      return request('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({ orderId, method, email }),
      });
    },
    confirmCounterPay: async (orderId: string) => {
      if (isTestMode()) {
        return { success: true, orderId, paymentStatus: 'PAID' };
      }
      return request(`/payments/orders/${orderId}/counter-pay`, {
        method: 'POST',
      });
    },
  },
};

export default api;
