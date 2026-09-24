const envApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = (envApiUrl && envApiUrl.trim() !== '') ? envApiUrl.replace(/\/$/, '') : '/api';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper to make API requests with Authorization header and automatic token refresh
export async function apiRequest(endpoint, options = {}) {
  let token = localStorage.getItem('hao_token');
  const headers = { ...options.headers };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include', // Send httpOnly cookies (refresh token)
  };

  let response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

  // Handle 401: Token expired -> attempt refresh (except on auth endpoints to prevent loops)
  if (response.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/refresh') && !endpoint.startsWith('/auth/signup')) {
    if (isRefreshing) {
      try {
        const newToken = await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        headers['Authorization'] = `Bearer ${newToken}`;
        return await fetch(`${API_BASE}${endpoint}`, { ...fetchOptions, headers }).then((res) => res.json());
      } catch (err) {
        throw err;
      }
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData.accessToken || refreshData.token;
        if (newToken) {
          localStorage.setItem('hao_token', newToken);
          processQueue(null, newToken);
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(`${API_BASE}${endpoint}`, { ...fetchOptions, headers });
        }
      } else {
        processQueue(new Error('Session expired'), null);
        localStorage.removeItem('hao_token');
      }
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.removeItem('hao_token');
    } finally {
      isRefreshing = false;
    }
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMsg = data?.message || (typeof data === 'string' ? data : 'Request failed');
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const detailed = data.errors.map((e) => `${e.field || 'field'}: ${e.message}`).join(', ');
      errorMsg = `${errorMsg} — ${detailed}`;
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// API Service modules
export const authApi = {
  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  signup: (userData) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  googleAuth: (googleData) =>
    apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData),
    }),
  refreshToken: () =>
    apiRequest('/auth/refresh', {
      method: 'POST',
    }),
  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }),
  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (payload) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (profile) =>
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
};

export const attributeApi = {
  getAll: () => apiRequest('/attributes'),
  getFinishes: () => apiRequest('/attributes/finishes'),
  addFinish: (data) => apiRequest('/attributes/finishes', { method: 'POST', body: JSON.stringify(data) }),
  updateFinish: (id, data) => apiRequest(`/attributes/finishes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFinish: (id) => apiRequest(`/attributes/finishes/${id}`, { method: 'DELETE' }),
  getColors: () => apiRequest('/attributes/colors'),
  addColor: (data) => apiRequest('/attributes/colors', { method: 'POST', body: JSON.stringify(data) }),
  updateColor: (id, data) => apiRequest(`/attributes/colors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteColor: (id) => apiRequest(`/attributes/colors/${id}`, { method: 'DELETE' }),
  getBrands: () => apiRequest('/attributes/brands'),
  addBrand: (data) => apiRequest('/attributes/brands', { method: 'POST', body: JSON.stringify(data) }),
  updateBrand: (id, data) => apiRequest(`/attributes/brands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBrand: (id) => apiRequest(`/attributes/brands/${id}`, { method: 'DELETE' }),
  getSizes: () => apiRequest('/attributes/sizes'),
  addSize: (data) => apiRequest('/attributes/sizes', { method: 'POST', body: JSON.stringify(data) }),
  updateSize: (id, data) => apiRequest(`/attributes/sizes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSize: (id) => apiRequest(`/attributes/sizes/${id}`, { method: 'DELETE' }),
  getCategories: () => apiRequest('/attributes/categories'),
  addCategory: (data) => apiRequest('/attributes/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => apiRequest(`/attributes/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => apiRequest(`/attributes/categories/${id}`, { method: 'DELETE' }),
};

export const productApi = {
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/products${query ? `?${query}` : ''}`);
  },
  getProductById: (id) => apiRequest(`/products/${id}`),
  createProduct: (data) =>
    apiRequest('/products', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  updateProduct: (id, data) =>
    apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  deleteProduct: (id) =>
    apiRequest(`/products/${id}`, {
      method: 'DELETE',
    }),
};

export const orderApi = {
  createOrder: (orderData, idempotencyKey = null) => {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return apiRequest('/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });
  },
  getActiveDraft: () => apiRequest('/orders/draft'),
  getMyOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/orders/my-orders${query ? `?${query}` : ''}`);
  },
  getOrderById: (id) => apiRequest(`/orders/${id}`),
  getAllOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/orders${query ? `?${query}` : ''}`);
  },
  updateOrderStatus: (id, payload) =>
    apiRequest(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  convertQuote: (id) =>
    apiRequest(`/orders/${id}/convert-quote`, {
      method: 'POST',
    }),
  getBuyerAnalytics: () => apiRequest('/orders/buyer-analytics'),
  getStats: () => apiRequest('/orders/stats/overview'),
  getPdfUrl: (id) => {
    const token = localStorage.getItem('hao_token');
    return `/api/orders/${id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  downloadPdf: async (id, orderNumber = 'Document') => {
    const token = localStorage.getItem('hao_token');
    const response = await fetch(`/api/orders/${id}/pdf`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || 'Failed to download PDF');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HAO_Order_${orderNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const userApi = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/users${query ? `?${query}` : ''}`);
  },
  toggleStatus: (id) =>
    apiRequest(`/users/${id}/toggle-status`, {
      method: 'PATCH',
    }),
};

export const invoiceApi = {
  getInvoices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/invoices${query ? `?${query}` : ''}`);
  },
  getInvoiceById: (id) => apiRequest(`/invoices/${id}`),
  createInvoice: (data) =>
    apiRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateInvoice: (id, data) =>
    apiRequest(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  recordPayment: (id, paymentData) =>
    apiRequest(`/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  voidInvoice: (id, reason) =>
    apiRequest(`/invoices/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getPdfUrl: (id) => {
    const token = localStorage.getItem('hao_token');
    return `${API_BASE}/invoices/${id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  downloadPdf: async (id, invoiceNumber = 'Document') => {
    const token = localStorage.getItem('hao_token');
    const response = await fetch(`${API_BASE}/invoices/${id}/pdf`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) {
      let errMsg = 'Failed to download Invoice PDF';
      try {
        const errJson = await response.json();
        errMsg = errJson?.message || errMsg;
      } catch (e) {
        const text = await response.text();
        errMsg = text || errMsg;
      }
      throw new Error(errMsg);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HAO_Invoice_${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

