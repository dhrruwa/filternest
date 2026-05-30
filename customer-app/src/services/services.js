import api from './api';

// Customer Auth services
export const authService = {
  registerCustomer: (data) => api.post('/auth/register/customer', data),
  
  // OTP-based login
  requestLoginOTP: (email, password) => 
    api.post('/auth/login/request-otp', { email, password, userType: 'customer' }),
  verifyLoginOTP: (userId, otp) =>
    api.post('/auth/login/verify-otp', { userId, otp, userType: 'customer' }),
  
  // Legacy login
  loginCustomer: (email, password) => api.post('/auth/login/customer', { email, password }),
  
  // Email verification OTP
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp, role: 'customer' }),
  resendOTP: (email) => api.post('/auth/resend-otp', { email, role: 'customer' }),
  
  // Password reset
  forgotPassword: (email) => api.post('/auth/forgot-password', { email, userType: 'customer' }),
  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword, userType: 'customer' }),

  // Google OAuth
  verifyGoogleOAuth: (credential) => api.post('/auth/google', { credential }),
  completeGoogleSignup: (data) => api.post('/auth/google/complete', data),

  // Mobile OTP
  requestMobileOTP: (phone) => api.post('/auth/login/mobile/request', { phone }),
  verifyMobileOTP: (phone, otp) => api.post('/auth/login/mobile/verify', { phone, otp }),

  // Agent application (public form on customer site)
  applyAgent: (data) => api.post('/auth/agent/apply', data),
  uploadAgentAvatar: (formData) => api.post('/auth/agent/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Customer services
export const customerService = {
  getProfile: () => api.get('/customers/profile'),
  updateProfile: (data) => api.put('/customers/profile', data),
  updateLocation: (latitude, longitude) =>
    api.put('/customers/location', { latitude, longitude }),
  getDashboard: () => api.get('/customers/dashboard'),
  getBookings: (params) => api.get('/customers/bookings', { params }),
  getInvoices: () => api.get('/customers/invoices'),
  getInvoicePdfUrl: (id) => {
    const token = localStorage.getItem('token');
    const base = api.defaults.baseURL || '/api';
    return `${base}/customers/invoices/${id}/pdf${token ? `?token=${token}` : ''}`;
  },
  getPayments: () => api.get('/customers/payments'),
  simulateCheckout: (invoiceId, method) => api.post('/customers/payments/simulate', { invoiceId, method }),
  getNotifications: () => api.get('/customers/notifications'),
  markNotificationRead: (id) => api.put(`/customers/notifications/${id}/read`),
  deleteNotification: (id) => api.delete(`/customers/notifications/${id}`),
  getSupportTickets: () => api.get('/customers/support/tickets'),
  createSupportTicket: (data) => api.post('/customers/support/tickets', data),
  addSupportTicketMessage: (id, text) => api.post(`/customers/support/tickets/${id}/messages`, { text }),
  getReminders: () => api.get('/customers/reminders'),
  snoozeReminder: (id) => api.put(`/customers/reminders/${id}/snooze`),
  rescheduleReminder: (id, customDate) => api.put(`/customers/reminders/${id}/reschedule`, { customDate }),
};

// Booking services
export const bookingService = {
  createBooking: (data) => api.post('/bookings', data),
  getCustomerBookings: () => api.get('/bookings/customer'),
  getBookingDetails: (bookingId) => api.get(`/bookings/${bookingId}`),
  cancelBooking: (bookingId, reason) => api.put(`/bookings/${bookingId}/cancel`, { reason }),
  submitFeedback: (bookingId, rating, review) => api.put(`/bookings/${bookingId}/feedback`, { rating, review }),
  getPublicReviews: () => api.get('/bookings/reviews/public'),
};

// Service catalog
export const serviceService = {
  getAllServices: () => api.get('/services'),
  getServiceByType: (serviceType) => api.get(`/services/${serviceType}`),
};

// Notifications
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
};
