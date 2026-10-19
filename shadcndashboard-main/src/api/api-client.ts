/**
 * Central API Client for Sudarshan QR Restaurant SaaS
 * Connects frontend components to the Node.js/Express backend with mock fallback.
 */

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://sudarshan-qr-api.onrender.com/api'
    : 'http://localhost:5000/api');

const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

class ApiClientError extends Error {
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
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = localStorage.getItem('sudarshan_auth_token');
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
    // Network errors (e.g. backend server not running during standalone frontend testing)
    throw new ApiClientError(error.message || 'Network request failed. Is the backend server running?', 0);
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
        localStorage.setItem('sudarshan_auth_token', res.token);
      }
      return res;
    },
    getMe: () => request('/auth/me'),
    logout: () => {
      localStorage.removeItem('sudarshan_auth_token');
    },
  },

  // OTP Email Verification
  otp: {
    requestOtp: (email: string, restaurantSlug: string, tableNumber?: string) =>
      request<{ expiresAt: string; mockCode?: string }>('/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email, restaurantSlug, tableNumber }),
      }),
    verifyOtp: (email: string, code: string, restaurantSlug: string, tableNumber?: string) =>
      request<{ sessionToken: string; email: string; restaurantSlug: string; tableNumber: string }>('/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code, restaurantSlug, tableNumber }),
      }),
  },

  // Public Customer Endpoints
  public: {
    getRestaurant: (slug: string) => request(`/public/restaurants/${slug}`),
    verifyTable: (slug: string, table: string, token?: string) => {
      const params = new URLSearchParams({ slug, table });
      if (token) params.set('token', token);
      return request(`/public/tables/verify?${params.toString()}`);
    },
    createOrder: (payload: {
      restaurantSlug: string;
      tableNumber: string;
      tableToken?: string;
      customerName: string;
      customerEmail: string;
      sessionToken?: string;
      items: any[];
      paymentMethod: 'COUNTER' | 'ONLINE';
      notes?: string;
    }) =>
      request('/public/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    trackOrder: (orderId: string) => request(`/public/orders/${orderId}/track`),
  },

  // Kitchen Display System
  kitchen: {
    getActiveOrders: () => request('/kitchen/orders'),
    updateOrderStatus: (orderId: string, status: string, notes?: string) =>
      request(`/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
  },

  // Admin Restaurant Management
  admin: {
    // Categories
    getCategories: () => request('/admin/categories'),
    createCategory: (data: any) =>
      request('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateCategory: (id: string, data: any) =>
      request(`/admin/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteCategory: (id: string) =>
      request(`/admin/categories/${id}`, {
        method: 'DELETE',
      }),

    // Menu Items
    getMenuItems: () => request('/admin/menu'),
    createMenuItem: (data: any) =>
      request('/admin/menu', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateMenuItem: (id: string, data: any) =>
      request(`/admin/menu/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    toggleItemAvailability: (id: string) =>
      request(`/admin/menu/${id}/toggle-availability`, {
        method: 'PATCH',
      }),
    deleteMenuItem: (id: string) =>
      request(`/admin/menu/${id}`, {
        method: 'DELETE',
      }),

    // Tables
    getTables: () => request('/admin/tables'),
    createTable: (data: any) =>
      request('/admin/tables', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTable: (id: string, data: any) =>
      request(`/admin/tables/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    regenerateTableQr: (id: string) =>
      request(`/admin/tables/${id}/regenerate-qr`, {
        method: 'POST',
      }),
    deleteTable: (id: string) =>
      request(`/admin/tables/${id}`, {
        method: 'DELETE',
      }),

    // Staff
    getStaff: () => request('/admin/staff'),
    createStaff: (data: any) =>
      request('/admin/staff', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStaff: (id: string, data: any) =>
      request(`/admin/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteStaff: (id: string) =>
      request(`/admin/staff/${id}`, {
        method: 'DELETE',
      }),

    // Orders, Analytics & Settings
    getOrders: (params?: { status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request(`/admin/orders?${q.toString()}`);
    },
    getAnalytics: () => request('/admin/analytics'),
    updateSettings: (data: any) =>
      request('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Superadmin Platform
  superadmin: {
    getTenants: () => request('/superadmin/tenants'),
    createTenant: (data: any) =>
      request('/superadmin/tenants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTenantStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED') =>
      request(`/superadmin/tenants/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    getMetrics: () => request('/superadmin/metrics'),
  },

  // Payments
  payments: {
    initiate: (orderId: string, method: 'COUNTER' | 'ONLINE', email?: string) =>
      request('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({ orderId, method, email }),
      }),
    confirmCounterPay: (orderId: string) =>
      request(`/payments/orders/${orderId}/counter-pay`, {
        method: 'POST',
      }),
  },
};

export default api;
