const API_BASE = '/api';

// Helper to make API requests with Authorization header
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('hao_token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = data?.message || (typeof data === 'string' ? data : 'Request failed');
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
  // Finishes
  getFinishes: () => apiRequest('/attributes/finishes'),
  addFinish: (data) => apiRequest('/attributes/finishes', { method: 'POST', body: JSON.stringify(data) }),
  updateFinish: (id, data) => apiRequest(`/attributes/finishes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFinish: (id) => apiRequest(`/attributes/finishes/${id}`, { method: 'DELETE' }),
  // Colors
  getColors: () => apiRequest('/attributes/colors'),
  addColor: (data) => apiRequest('/attributes/colors', { method: 'POST', body: JSON.stringify(data) }),
  updateColor: (id, data) => apiRequest(`/attributes/colors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteColor: (id) => apiRequest(`/attributes/colors/${id}`, { method: 'DELETE' }),
  // Brands
  getBrands: () => apiRequest('/attributes/brands'),
  addBrand: (data) => apiRequest('/attributes/brands', { method: 'POST', body: JSON.stringify(data) }),
  updateBrand: (id, data) => apiRequest(`/attributes/brands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBrand: (id) => apiRequest(`/attributes/brands/${id}`, { method: 'DELETE' }),
  // Sizes
  getSizes: () => apiRequest('/attributes/sizes'),
  addSize: (data) => apiRequest('/attributes/sizes', { method: 'POST', body: JSON.stringify(data) }),
  updateSize: (id, data) => apiRequest(`/attributes/sizes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSize: (id) => apiRequest(`/attributes/sizes/${id}`, { method: 'DELETE' }),
  // Categories
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
  createOrder: (orderData) =>
    apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  getMyOrders: () => apiRequest('/orders/my-orders'),
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
  getStats: () => apiRequest('/orders/stats/summary'),
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
