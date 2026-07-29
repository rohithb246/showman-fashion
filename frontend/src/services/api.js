import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  completeRegistration: (data) => api.post('/auth/register/complete/', data),
  googleLogin: (credential) => api.post('/auth/google/', { credential }),
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  updateProfileDetails: (data) => api.patch('/auth/profile/details/', data),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
  verifyEmail: (email, token) => api.post('/auth/verify-email/', { email, token }),
  resendVerificationCode: (email) => api.post('/auth/verify-email/resend/', { email }),
  changePassword: (data) => api.post('/auth/change-password/', data),
  addresses: () => api.get('/auth/addresses/'),
  createAddress: (data) => api.post('/auth/addresses/', data),
  updateAddress: (id, data) => api.patch(`/auth/addresses/${id}/`, data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}/`),
};

export const productAPI = {
  list: (params) => api.get('/products/', { params }),
  get: (slug, params) => api.get(`/products/${slug}/`, { params }),
  related: (slug) => api.get(`/products/${slug}/related/`),
  categories: () => api.get('/products/categories/'),
  subcategories: (params) => api.get('/products/subcategories/', { params }),
  sizes: () => api.get('/products/sizes/'),
  colors: () => api.get('/products/colors/'),
  banners: () => api.get('/products/banners/'),
  reviews: (params) => api.get('/products/reviews/', { params }),
  createReview: (data) => api.post('/products/reviews/', data),
  reviewEligibility: (slug) => api.get(`/products/${slug}/review_eligibility/`),
  featured: () => api.get('/products/', { params: { is_featured: true } }),
  newArrivals: () => api.get('/products/', { params: { is_new_arrival: true } }),
  trending: () => api.get('/products/', { params: { is_trending: true } }),
  create: (data) => api.post('/products/', data),
  update: (slug, data) => api.patch(`/products/${slug}/`, data),
  delete: (slug) => api.delete(`/products/${slug}/`),
  variants: (params) => api.get('/products/variants/', { params }),
  createVariant: (data) => api.post('/products/variants/', data),
  updateVariant: (id, data) => api.patch(`/products/variants/${id}/`, data),
  deleteVariant: (id) => api.delete(`/products/variants/${id}/`),
  bulkCreateVariants: (data) => api.post('/products/variants/bulk_create/', data),
  createImage: (data) => api.post('/products/images/', data),
  updateImage: (id, data) => api.patch(`/products/images/${id}/`, data),
  inventory: () => api.get('/products/inventory/'),
  createInventory: (data) => api.post('/products/inventory/', data),
  updateInventory: (id, data) => api.patch(`/products/inventory/${id}/`, data),
  deleteInventory: (id) => api.delete(`/products/inventory/${id}/`),
  cleanupInventory: () => api.post('/products/inventory/cleanup/'),
  lowStock: () => api.get('/products/inventory/low_stock/'),
  coupons: () => api.get('/products/coupons/'),
  currentCoupon: () => api.get('/products/coupons/current/'),
  coupon: (id) => api.get(`/products/coupons/${id}/`),
  createCoupon: (data) => api.post('/products/coupons/', data),
  updateCoupon: (id, data) => api.patch(`/products/coupons/${id}/`, data),
  deleteCoupon: (id) => api.delete(`/products/coupons/${id}/`),
  validateCoupon: (code) => api.post('/products/coupons/validate/', { code }),
  createBanner: (data) => api.post('/products/banners/', data),
  updateBanner: (id, data) => api.patch(`/products/banners/${id}/`, data),
  deleteBanner: (id) => api.delete(`/products/banners/${id}/`),
  approveReview: (id) => api.post(`/products/reviews/${id}/approve/`),
  rejectReview: (id) => api.post(`/products/reviews/${id}/reject/`),
  deleteReview: (id) => api.delete(`/products/reviews/${id}/`),
};

export const cartAPI = {
  get: () => api.get('/cart/'),
  addItem: (variant_id, quantity = 1) => api.post('/cart/items/', { variant_id, quantity }),
  updateItem: (itemId, quantity) => api.patch(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),
  clear: () => api.delete('/cart/'),
  applyCoupon: (code) => api.post('/cart/apply-coupon/', { code }),
  wishlist: () => api.get('/cart/wishlist/'),
  addWishlist: (product_id) => api.post('/cart/wishlist/', { product_id }),
  removeWishlist: (product_id) => api.delete(`/cart/wishlist/${product_id}/`),
};

export const orderAPI = {
  checkout: (data) => api.post('/orders/checkout/', data),
  list: () => api.get('/orders/'),
  get: (id) => api.get(`/orders/${id}/`),
  cancel: (id) => api.post(`/orders/${id}/cancel/`),
  updateStatus: (id, data) => api.patch(`/orders/${id}/update_status/`, data),
  paymentConfig: () => api.get('/orders/payment/config/'),
  confirmPayment: (data) => api.post('/orders/payment/confirm/', data),
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard/'),
  logs: () => api.get('/admin/logs/'),
  users: () => api.get('/auth/admin/users/'),
  createUser: (data) => api.post('/auth/admin/users/', data),
  updateUser: (id, data) => api.patch(`/auth/admin/users/${id}/`, data),
  contacts: () => api.get('/core/admin/contacts/'),
  updateContact: (id, data) => api.patch(`/core/admin/contacts/${id}/`, data),
  deleteContact: (id) => api.delete(`/core/admin/contacts/${id}/`),
};

export const coreAPI = {
  contact: (data) => api.post('/core/contact/', data),
  subscribe: (email) => api.post('/core/newsletter/subscribe/', { email }),
};

export default api;
